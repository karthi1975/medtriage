"""
Tribal DB Loader - Loads tribal knowledge data to PostgreSQL
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import List, Dict, Any
import json


class TribalDBLoader:
    """Load tribal knowledge data to PostgreSQL database"""

    def __init__(self, db_url: str = "postgresql://tribaluser:tribalpassword@localhost:5433/tribal_knowledge"):
        self.engine = create_engine(db_url)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

    def load_facilities(self, facilities: List[Dict[str, Any]]) -> int:
        """Load facility data"""
        count = 0

        for facility in facilities:
            data = facility['tribal_data']

            query = text("""
                INSERT INTO facilities (
                    facility_id, name, type, address_line1, city, state, zip_code,
                    region, latitude, longitude, phone, email, website,
                    hours_of_operation, services_offered, active
                ) VALUES (
                    :facility_id, :name, :type, :address_line1, :city, :state, :zip_code,
                    :region, :latitude, :longitude, :phone, :email, :website,
                    :hours_of_operation, :services_offered, :active
                )
                ON CONFLICT (facility_id) DO NOTHING
            """)

            self.session.execute(query, {
                **data,
                'hours_of_operation': json.dumps(data['hours_of_operation']),
                'services_offered': data['services_offered']
            })
            count += 1

        self.session.commit()
        print(f"Loaded {count} facilities")
        return count

    def load_providers(self, providers: List[Dict[str, Any]]) -> int:
        """Load provider data"""
        count = 0

        for provider in providers:
            data = provider['tribal_data']

            query = text("""
                INSERT INTO providers (
                    provider_id, npi, first_name, last_name, specialty_id, facility_id,
                    email, phone, credentials, years_experience, languages,
                    accepts_new_patients, telemedicine_available, active
                ) VALUES (
                    :provider_id, :npi, :first_name, :last_name, :specialty_id, :facility_id,
                    :email, :phone, :credentials, :years_experience, :languages,
                    :accepts_new_patients, :telemedicine_available, :active
                )
                ON CONFLICT (provider_id) DO NOTHING
            """)

            self.session.execute(query, {
                **data,
                'languages': data['languages']
            })
            count += 1

        self.session.commit()
        print(f"Loaded {count} providers")
        return count

    def load_provider_schedules(self, schedules: List[Dict[str, Any]]) -> int:
        """Load provider availability schedules"""
        count = 0

        for schedule in schedules:
            query = text("""
                INSERT INTO provider_availability (
                    provider_id, day_of_week, start_time, end_time,
                    slot_duration_minutes, active
                ) VALUES (
                    :provider_id, :day_of_week, :start_time, :end_time,
                    :slot_duration_minutes, :active
                )
                ON CONFLICT DO NOTHING
            """)

            self.session.execute(query, schedule)
            count += 1

        self.session.commit()
        print(f"Loaded {count} schedule slots")
        return count

    def load_provider_preferences(self, preferences: List[Dict[str, Any]]) -> int:
        """Load provider tribal knowledge preferences"""
        count = 0

        for pref in preferences:
            query = text("""
                INSERT INTO provider_preferences (
                    provider_id, preference_type, preference_key,
                    preference_value, priority, active
                ) VALUES (
                    :provider_id, :preference_type, :preference_key,
                    :preference_value, :priority, :active
                )
                ON CONFLICT (provider_id, preference_type, preference_key)
                DO UPDATE SET preference_value = EXCLUDED.preference_value
            """)

            self.session.execute(query, {
                **pref,
                'preference_value': json.dumps(pref['preference_value']),
                'active': pref.get('active', True)
            })
            count += 1

        self.session.commit()
        print(f"Loaded {count} provider preferences")
        return count

    def load_clinic_rules(self, rules: List[Dict[str, Any]]) -> int:
        """Load clinic tribal knowledge rules"""
        count = 0

        for rule in rules:
            query = text("""
                INSERT INTO clinic_rules (
                    facility_id, rule_type, rule_name, rule_definition,
                    priority, active
                ) VALUES (
                    :facility_id, :rule_type, :rule_name, :rule_definition,
                    :priority, :active
                )
                ON CONFLICT (facility_id, rule_type, rule_name)
                DO UPDATE SET rule_definition = EXCLUDED.rule_definition
            """)

            self.session.execute(query, {
                **rule,
                'rule_definition': json.dumps(rule['rule_definition'])
            })
            count += 1

        self.session.commit()
        print(f"Loaded {count} clinic rules")
        return count

    def verify_counts(self) -> Dict[str, int]:
        """Verify record counts in database"""
        counts = {}

        tables = ['facilities', 'providers', 'provider_availability',
                  'provider_preferences', 'clinic_rules']

        for table in tables:
            result = self.session.execute(text(f"SELECT COUNT(*) FROM {table}"))
            counts[table] = result.scalar()

        return counts

    def close(self):
        """Close database session"""
        self.session.close()


def main():
    """Test tribal DB loader"""
    loader = TribalDBLoader()

    # Verify database connection
    counts = loader.verify_counts()
    print("Current database counts:")
    for table, count in counts.items():
        print(f"  {table}: {count}")

    loader.close()


if __name__ == "__main__":
    main()
