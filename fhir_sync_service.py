"""
FHIR Sync Service
Syncs PostgreSQL tribal knowledge data (providers, facilities) to HAPI FHIR
Creates and manages Practitioner and Location resources
"""
import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from fhirclient import client
from fhirclient.models.practitioner import Practitioner
from fhirclient.models.location import Location
from fhirclient.models.humanname import HumanName
from fhirclient.models.identifier import Identifier
from fhirclient.models.address import Address
from fhirclient.models.contactpoint import ContactPoint
from fhirclient.models.codeableconcept import CodeableConcept
from fhirclient.models.coding import Coding
from fhirclient.models.fhirreference import FHIRReference

from database.models import Provider, Facility

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FHIRSyncService:
    """Service for syncing tribal knowledge data to FHIR resources"""

    def __init__(self, fhir_server_url: str, db_session: Session):
        """
        Initialize FHIR sync service

        Args:
            fhir_server_url: Base URL of the HAPI FHIR server
            db_session: SQLAlchemy database session
        """
        self.settings = {
            'app_id': 'fhir_sync_app',
            'api_base': fhir_server_url
        }
        self.client = client.FHIRClient(settings=self.settings)
        self.db = db_session
        logger.info(f"FHIR Sync Service initialized with server: {fhir_server_url}")

    # ========== Practitioner Resource Sync ==========

    def sync_provider_to_practitioner(self, provider: Provider) -> Optional[str]:
        """
        Create or update a FHIR Practitioner resource from a Provider

        Args:
            provider: Provider database model

        Returns:
            FHIR Practitioner ID if successful, None otherwise
        """
        try:
            # Check if practitioner already exists by NPI
            existing_practitioner_id = self._find_practitioner_by_npi(provider.npi)

            if existing_practitioner_id:
                logger.info(f"Practitioner with NPI {provider.npi} already exists: {existing_practitioner_id}")
                return existing_practitioner_id

            # Create new Practitioner resource
            practitioner = Practitioner()

            # Active status
            practitioner.active = provider.active

            # Name
            practitioner.name = [HumanName()]
            practitioner.name[0].use = "official"
            practitioner.name[0].family = provider.last_name
            practitioner.name[0].given = [provider.first_name]
            if provider.credentials:
                practitioner.name[0].suffix = [provider.credentials]
            practitioner.name[0].text = f"Dr. {provider.first_name} {provider.last_name}"

            # Identifiers
            practitioner.identifier = []

            # NPI identifier
            if provider.npi:
                npi_identifier = Identifier()
                npi_identifier.system = "http://hl7.org/fhir/sid/us-npi"
                npi_identifier.value = provider.npi
                npi_identifier.use = "official"
                practitioner.identifier.append(npi_identifier)

            # Internal provider ID
            internal_id = Identifier()
            internal_id.system = "http://medichat.example.com/provider-id"
            internal_id.value = str(provider.provider_id)
            practitioner.identifier.append(internal_id)

            # Contact information
            if provider.contact_info:
                practitioner.telecom = [ContactPoint()]
                practitioner.telecom[0].system = "phone"
                practitioner.telecom[0].value = provider.contact_info
                practitioner.telecom[0].use = "work"

            # Note: Qualifications are complex and optional - skipping for now
            # Can be added later if needed with proper PractitionerQualification structure

            # Create on FHIR server
            practitioner.create(self.client.server)

            logger.info(f"Created FHIR Practitioner: {practitioner.id} for Provider {provider.provider_id}")

            # Store mapping in database (update provider with FHIR ID)
            provider.fhir_practitioner_id = practitioner.id
            self.db.commit()

            return practitioner.id

        except Exception as e:
            logger.error(f"Error syncing Provider {provider.provider_id} to Practitioner: {str(e)}", exc_info=True)
            self.db.rollback()
            return None

    def _find_practitioner_by_npi(self, npi: str) -> Optional[str]:
        """Find Practitioner by NPI identifier"""
        try:
            search = Practitioner.where(struct={'identifier': f"http://hl7.org/fhir/sid/us-npi|{npi}"})
            practitioners = search.perform_resources(self.client.server)

            if practitioners and len(practitioners) > 0:
                return practitioners[0].id

            return None

        except Exception as e:
            logger.debug(f"No Practitioner found with NPI {npi}: {str(e)}")
            return None

    def sync_all_providers(self) -> Dict[str, Any]:
        """
        Sync all providers to FHIR Practitioner resources

        Returns:
            Dict with sync statistics
        """
        try:
            providers = self.db.query(Provider).filter(Provider.active == True).all()

            stats = {
                "total": len(providers),
                "synced": 0,
                "failed": 0,
                "practitioner_ids": []
            }

            for provider in providers:
                practitioner_id = self.sync_provider_to_practitioner(provider)
                if practitioner_id:
                    stats["synced"] += 1
                    stats["practitioner_ids"].append({
                        "provider_id": provider.provider_id,
                        "fhir_id": practitioner_id,
                        "name": f"Dr. {provider.first_name} {provider.last_name}",
                        "npi": provider.npi
                    })
                else:
                    stats["failed"] += 1

            logger.info(f"Synced {stats['synced']}/{stats['total']} providers to FHIR Practitioners")
            return stats

        except Exception as e:
            logger.error(f"Error syncing all providers: {str(e)}")
            return {"total": 0, "synced": 0, "failed": 0, "practitioner_ids": []}

    # ========== Location Resource Sync ==========

    def sync_facility_to_location(self, facility: Facility) -> Optional[str]:
        """
        Create or update a FHIR Location resource from a Facility

        Args:
            facility: Facility database model

        Returns:
            FHIR Location ID if successful, None otherwise
        """
        try:
            # Check if location already exists by facility name
            existing_location_id = self._find_location_by_name(facility.name)

            if existing_location_id:
                logger.info(f"Location '{facility.name}' already exists: {existing_location_id}")
                return existing_location_id

            # Create new Location resource
            location = Location()

            # Status
            location.status = "active"

            # Name
            location.name = facility.name

            # Identifiers
            location.identifier = []

            # Internal facility ID
            internal_id = Identifier()
            internal_id.system = "http://medichat.example.com/facility-id"
            internal_id.value = str(facility.facility_id)
            location.identifier.append(internal_id)

            # Address
            if facility.address_line1 or facility.city or facility.state:
                location.address = Address()
                if facility.address_line1:
                    location.address.line = [facility.address_line1]
                    if facility.address_line2:
                        location.address.line.append(facility.address_line2)
                location.address.city = facility.city
                location.address.state = facility.state
                location.address.postalCode = facility.zip_code
                location.address.country = "US"

            # Contact information
            if facility.phone:
                location.telecom = [ContactPoint()]
                location.telecom[0].system = "phone"
                location.telecom[0].value = facility.phone
                location.telecom[0].use = "work"

            # Type (healthcare facility)
            location.type = [CodeableConcept()]
            location.type[0].coding = [Coding()]
            location.type[0].coding[0].system = "http://terminology.hl7.org/CodeSystem/v3-RoleCode"
            location.type[0].coding[0].code = "HOSP"
            location.type[0].coding[0].display = "Hospital"
            location.type[0].text = "Healthcare Facility"

            # Physical type (building)
            location.physicalType = CodeableConcept()
            location.physicalType.coding = [Coding()]
            location.physicalType.coding[0].system = "http://terminology.hl7.org/CodeSystem/location-physical-type"
            location.physicalType.coding[0].code = "bu"
            location.physicalType.coding[0].display = "Building"

            # Create on FHIR server
            location.create(self.client.server)

            logger.info(f"Created FHIR Location: {location.id} for Facility {facility.facility_id}")

            # Store mapping in database
            facility.fhir_location_id = location.id
            self.db.commit()

            return location.id

        except Exception as e:
            logger.error(f"Error syncing Facility {facility.facility_id} to Location: {str(e)}", exc_info=True)
            self.db.rollback()
            return None

    def _find_location_by_name(self, name: str) -> Optional[str]:
        """Find Location by name"""
        try:
            search = Location.where(struct={'name': name})
            locations = search.perform_resources(self.client.server)

            if locations and len(locations) > 0:
                return locations[0].id

            return None

        except Exception as e:
            logger.debug(f"No Location found with name '{name}': {str(e)}")
            return None

    def sync_all_facilities(self) -> Dict[str, Any]:
        """
        Sync all facilities to FHIR Location resources

        Returns:
            Dict with sync statistics
        """
        try:
            facilities = self.db.query(Facility).all()

            stats = {
                "total": len(facilities),
                "synced": 0,
                "failed": 0,
                "location_ids": []
            }

            for facility in facilities:
                location_id = self.sync_facility_to_location(facility)
                if location_id:
                    stats["synced"] += 1
                    stats["location_ids"].append({
                        "facility_id": facility.facility_id,
                        "fhir_id": location_id,
                        "name": facility.name,
                        "city": facility.city
                    })
                else:
                    stats["failed"] += 1

            logger.info(f"Synced {stats['synced']}/{stats['total']} facilities to FHIR Locations")
            return stats

        except Exception as e:
            logger.error(f"Error syncing all facilities: {str(e)}")
            return {"total": 0, "synced": 0, "failed": 0, "location_ids": []}

    # ========== Complete Sync ==========

    def sync_all_resources(self) -> Dict[str, Any]:
        """
        Sync all tribal knowledge resources to FHIR

        Returns:
            Dict with comprehensive sync statistics
        """
        logger.info("Starting complete FHIR resource sync...")

        results = {
            "providers": self.sync_all_providers(),
            "facilities": self.sync_all_facilities()
        }

        logger.info("Complete FHIR resource sync finished")
        return results

    def get_provider_fhir_id(self, provider_id: int) -> Optional[str]:
        """
        Get the FHIR Practitioner ID for a provider

        Args:
            provider_id: Internal provider ID

        Returns:
            FHIR Practitioner ID or None
        """
        try:
            provider = self.db.query(Provider).filter(Provider.provider_id == provider_id).first()
            if provider and hasattr(provider, 'fhir_practitioner_id'):
                return provider.fhir_practitioner_id
            return None
        except Exception as e:
            logger.error(f"Error getting FHIR ID for provider {provider_id}: {str(e)}")
            return None

    def get_facility_fhir_id(self, facility_id: int) -> Optional[str]:
        """
        Get the FHIR Location ID for a facility

        Args:
            facility_id: Internal facility ID

        Returns:
            FHIR Location ID or None
        """
        try:
            facility = self.db.query(Facility).filter(Facility.facility_id == facility_id).first()
            if facility and hasattr(facility, 'fhir_location_id'):
                return facility.fhir_location_id
            return None
        except Exception as e:
            logger.error(f"Error getting FHIR ID for facility {facility_id}: {str(e)}")
            return None
