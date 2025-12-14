"""
FHIR Loader - Loads FHIR resources to HAPI FHIR server
"""
import requests
import json
from typing import List, Dict, Any
from fhir.resources.bundle import Bundle, BundleEntry, BundleEntryRequest
from fhir.resources.resource import Resource


class FHIRLoader:
    """Load FHIR resources to HAPI FHIR server"""

    def __init__(self, fhir_base_url: str = "http://localhost:8081/fhir"):
        self.fhir_base_url = fhir_base_url
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/fhir+json"})

    def create_transaction_bundle(self, resources: List[Resource]) -> Bundle:
        """Create a FHIR transaction bundle"""
        entries = []

        for resource in resources:
            entry = BundleEntry(
                resource=resource,
                request=BundleEntryRequest(
                    method="POST",
                    url=resource.__resource_type__
                )
            )
            entries.append(entry)

        bundle = Bundle(
            type="transaction",
            entry=entries
        )

        return bundle

    def load_bundle(self, bundle: Bundle) -> Dict[str, Any]:
        """POST a transaction bundle to FHIR server"""
        try:
            response = self.session.post(
                self.fhir_base_url,
                data=bundle.json(),
                timeout=60
            )

            response.raise_for_status()
            return {"success": True, "response": response.json()}

        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}

    def load_resources_in_batches(
        self,
        resources: List[Resource],
        batch_size: int = 50
    ) -> List[Dict[str, Any]]:
        """Load resources in batches to avoid timeouts"""
        results = []

        for i in range(0, len(resources), batch_size):
            batch = resources[i:i+batch_size]
            bundle = self.create_transaction_bundle(batch)

            print(f"Loading batch {i//batch_size + 1} ({len(batch)} resources)...")
            result = self.load_bundle(bundle)
            results.append(result)

            if not result['success']:
                print(f"Error loading batch: {result['error']}")
            else:
                print(f"Batch loaded successfully")

        return results

    def verify_resource_count(self, resource_type: str) -> int:
        """Get count of resources of a specific type"""
        try:
            response = self.session.get(
                f"{self.fhir_base_url}/{resource_type}?_summary=count"
            )
            response.raise_for_status()
            data = response.json()
            return data.get('total', 0)
        except Exception as e:
            print(f"Error verifying {resource_type} count: {e}")
            return 0


def main():
    """Test FHIR loader"""
    from fhir.resources.patient import Patient

    loader = FHIRLoader()

    # Create test patient
    patient = Patient(
        id="test-patient-001",
        gender="male",
        birthDate="1990-01-01"
    )

    # Load single patient
    bundle = loader.create_transaction_bundle([patient])
    result = loader.load_bundle(bundle)

    if result['success']:
        print("Test patient loaded successfully")
    else:
        print(f"Error: {result['error']}")

    # Verify count
    count = loader.verify_resource_count("Patient")
    print(f"Total patients in FHIR server: {count}")


if __name__ == "__main__":
    main()
