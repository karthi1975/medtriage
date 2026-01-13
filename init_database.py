"""
Database Initialization Script
Creates all tables and loads initial data for MediChat
"""
import os
import sys
from sqlalchemy import create_engine, text
from database.models import Base, Facility, Specialty, Provider, ProviderAvailability
from datetime import time, date
from config import settings

def init_database():
    """Initialize database with schema and data"""
    print("=" * 60)
    print("MediChat Database Initialization")
    print("=" * 60)
    print()

    # Create engine
    print(f"Connecting to database...")
    print(f"Database URL: {settings.tribal_db_url.split('@')[1] if '@' in settings.tribal_db_url else 'hidden'}")
    engine = create_engine(settings.tribal_db_url)

    # Drop all tables if they exist (for clean install)
    print("\n1. Dropping existing tables...")
    try:
        Base.metadata.drop_all(engine)
        print("   ✓ Existing tables dropped")
    except Exception as e:
        print(f"   ⚠ Warning: {str(e)}")

    # Create all tables
    print("\n2. Creating database tables...")
    try:
        Base.metadata.create_all(engine)
        print("   ✓ Tables created successfully")

        # List created tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            print(f"   Tables created: {', '.join(tables)}")
    except Exception as e:
        print(f"   ✗ Error creating tables: {str(e)}")
        sys.exit(1)

    # Load initial data
    print("\n3. Loading initial data...")
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # ===== SPECIALTIES =====
        print("\n   Loading specialties...")
        specialties_data = [
            {"name": "Cardiology", "snomed_code": "394579002", "description": "Heart and cardiovascular system"},
            {"name": "Emergency Medicine", "snomed_code": "773568002", "description": "Emergency and urgent care"},
            {"name": "Internal Medicine", "snomed_code": "419192003", "description": "General adult medicine"},
            {"name": "Family Medicine", "snomed_code": "419772000", "description": "Primary care for all ages"},
            {"name": "Orthopedic Surgery", "snomed_code": "394801008", "description": "Musculoskeletal surgery"},
            {"name": "Neurology", "snomed_code": "394591006", "description": "Nervous system disorders"},
            {"name": "Endocrinology", "snomed_code": "394583002", "description": "Diabetes and hormonal disorders"},
            {"name": "Podiatry", "snomed_code": "394862001", "description": "Foot and ankle care"},
        ]

        specialties = {}
        for spec_data in specialties_data:
            spec = Specialty(**spec_data)
            session.add(spec)
            session.flush()
            specialties[spec_data["name"]] = spec.specialty_id
            print(f"   ✓ {spec_data['name']} (ID: {spec.specialty_id})")

        # ===== FACILITIES =====
        print("\n   Loading facilities...")
        facilities_data = [
            {
                "name": "West Valley City Community Health Center",
                "type": "Community Health",
                "address_line1": "2850 W 3500 S",
                "city": "West Valley City",
                "state": "UT",
                "zip_code": "84119",
                "region": "Utah",
                "phone": "801-555-1000",
                "email": "info@wvcchc.org",
                "services_offered": ["Primary Care", "Cardiology", "Endocrinology", "Orthopedics"],
            },
            {
                "name": "Salt Lake Heart Center",
                "type": "Specialty Clinic",
                "address_line1": "500 E 900 S",
                "city": "Salt Lake City",
                "state": "UT",
                "zip_code": "84102",
                "region": "Utah",
                "phone": "801-555-2000",
                "email": "cardiology@slhc.org",
                "services_offered": ["Cardiology", "Cardiac Surgery", "Interventional Cardiology"],
            },
            {
                "name": "Utah Valley Orthopedics",
                "type": "Specialty Clinic",
                "address_line1": "1200 N University Ave",
                "city": "Provo",
                "state": "UT",
                "zip_code": "84604",
                "region": "Utah",
                "phone": "801-555-3000",
                "email": "ortho@uvortho.org",
                "services_offered": ["Orthopedic Surgery", "Sports Medicine", "Joint Replacement"],
            },
        ]

        facilities = {}
        for fac_data in facilities_data:
            fac = Facility(**fac_data)
            session.add(fac)
            session.flush()
            facilities[fac_data["name"]] = fac.facility_id
            print(f"   ✓ {fac_data['name']} (ID: {fac.facility_id})")

        # ===== PROVIDERS =====
        print("\n   Loading providers...")
        providers_data = [
            {
                "npi": "1234567890",
                "first_name": "John",
                "last_name": "Smith",
                "specialty_id": specialties["Cardiology"],
                "facility_id": facilities["Salt Lake Heart Center"],
                "credentials": "MD, FACC",
                "years_experience": 15,
                "email": "jsmith@slhc.org",
                "phone": "801-555-2001",
            },
            {
                "npi": "2345678901",
                "first_name": "Lisa",
                "last_name": "Chen",
                "specialty_id": specialties["Endocrinology"],
                "facility_id": facilities["West Valley City Community Health Center"],
                "credentials": "MD, FACE",
                "years_experience": 12,
                "email": "lchen@wvcchc.org",
                "phone": "801-555-1001",
            },
            {
                "npi": "3456789012",
                "first_name": "Michael",
                "last_name": "Rodriguez",
                "specialty_id": specialties["Orthopedic Surgery"],
                "facility_id": facilities["Utah Valley Orthopedics"],
                "credentials": "MD, FAAOS",
                "years_experience": 20,
                "email": "mrodriguez@uvortho.org",
                "phone": "801-555-3001",
            },
            {
                "npi": "4567890123",
                "first_name": "Sarah",
                "last_name": "Williams",
                "specialty_id": specialties["Internal Medicine"],
                "facility_id": facilities["West Valley City Community Health Center"],
                "credentials": "MD",
                "years_experience": 8,
                "email": "swilliams@wvcchc.org",
                "phone": "801-555-1002",
            },
            {
                "npi": "5678901234",
                "first_name": "David",
                "last_name": "Patel",
                "specialty_id": specialties["Neurology"],
                "facility_id": facilities["West Valley City Community Health Center"],
                "credentials": "MD, PhD",
                "years_experience": 18,
                "email": "dpatel@wvcchc.org",
                "phone": "801-555-1003",
            },
        ]

        for prov_data in providers_data:
            prov = Provider(**prov_data)
            session.add(prov)
            session.flush()
            print(f"   ✓ Dr. {prov_data['first_name']} {prov_data['last_name']} (NPI: {prov_data['npi']})")

            # Add availability (Monday-Friday, 9 AM - 5 PM)
            for day in range(5):  # 0=Monday, 4=Friday
                avail = ProviderAvailability(
                    provider_id=prov.provider_id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    slot_duration_minutes=30,
                    effective_from=date.today(),
                )
                session.add(avail)

        # Commit all data
        session.commit()
        print("\n✓ All data loaded successfully!")

    except Exception as e:
        print(f"\n✗ Error loading data: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

    # Verify data
    print("\n4. Verifying data...")
    session = Session()
    try:
        specialty_count = session.query(Specialty).count()
        facility_count = session.query(Facility).count()
        provider_count = session.query(Provider).count()

        print(f"   ✓ Specialties: {specialty_count}")
        print(f"   ✓ Facilities: {facility_count}")
        print(f"   ✓ Providers: {provider_count}")
    finally:
        session.close()

    print("\n" + "=" * 60)
    print("Database initialization complete!")
    print("=" * 60)


if __name__ == "__main__":
    init_database()
