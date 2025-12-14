#!/bin/bash
# MediChat Quick Setup Script
# Sets up the complete system with synthetic data

set -e

echo "============================================"
echo "MediChat System Quick Setup"
echo "============================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "Step 1: Starting Docker services..."
docker-compose down 2>/dev/null || true
docker-compose up -d postgres-fhir postgres-tribal
echo "✓ PostgreSQL databases started"

echo ""
echo "Step 2: Waiting for databases to initialize (15 seconds)..."
sleep 15

echo ""
echo "Step 3: Starting HAPI FHIR server..."
docker-compose up -d hapi-fhir
echo "✓ HAPI FHIR server started"

echo ""
echo "Step 4: Waiting for HAPI FHIR to be ready (30 seconds)..."
sleep 30

# Check if HAPI FHIR is responsive
if curl -f http://localhost:8081/fhir/metadata > /dev/null 2>&1; then
    echo "✓ HAPI FHIR is ready"
else
    echo "⚠ Warning: HAPI FHIR may need more time to start"
fi

echo ""
echo "Step 5: Checking database schema..."
SPECIALTY_COUNT=$(docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -t -c "SELECT COUNT(*) FROM specialties;" 2>/dev/null | tr -d ' ')

if [ "$SPECIALTY_COUNT" -eq "21" ]; then
    echo "✓ All 21 specialties configured"
else
    echo "⚠ Only $SPECIALTY_COUNT specialties found. Expected 21."
    echo "  Reinitializing database schema..."
    docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -c "TRUNCATE TABLE specialties CASCADE;" > /dev/null
    docker exec -i postgres-tribal-db psql -U tribaluser -d tribal_knowledge < postgres-init/02-schema.sql > /dev/null 2>&1
    echo "✓ Database schema reinitialized"
fi

echo ""
echo "Step 6: Generating synthetic data..."
echo "  This will create:"
echo "  - 500 patients"
echo "  - 210 providers (10 per specialty)"
echo "  - 21 facilities"
echo "  - 1000+ clinical records"
echo ""
cd data_generation

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
source venv/bin/activate
pip install -q -r requirements.txt

# Run data generation
python main.py

cd ..

echo ""
echo "Step 7: Starting backend API..."
docker-compose up -d fhir-chat-api
echo "✓ Backend API started"

echo ""
echo "Step 8: Starting frontend..."
docker-compose up -d fhir-chat-frontend
echo "✓ Frontend started"

echo ""
echo "============================================"
echo "✓ MediChat System Setup Complete!"
echo "============================================"
echo ""
echo "Access the system:"
echo "  Frontend:    http://localhost:80"
echo "  Backend API: http://localhost:8002"
echo "  API Docs:    http://localhost:8002/docs"
echo "  HAPI FHIR:   http://localhost:8081/fhir"
echo ""
echo "Database Access:"
echo "  Tribal DB:   postgresql://tribaluser:tribalpassword@localhost:5433/tribal_knowledge"
echo "  FHIR DB:     postgresql://hapiuser:hapipassword@localhost:5434/hapi"
echo ""
echo "Quick Commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop system:      docker-compose down"
echo "  Restart backend:  docker-compose restart fhir-chat-api"
echo ""
echo "To verify data was loaded:"
echo "  docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -c \"SELECT COUNT(*) FROM providers;\""
echo "  curl http://localhost:8081/fhir/Patient?_summary=count"
echo ""
