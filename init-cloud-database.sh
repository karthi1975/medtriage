#!/bin/bash

# Initialize Cloud SQL Database for MediChat
# This script creates all tables and loads initial data

echo "════════════════════════════════════════════════════════════"
echo "  MediChat Cloud SQL Database Initialization"
echo "════════════════════════════════════════════════════════════"
echo ""

# Set environment variables for Cloud SQL connection
export TRIBAL_DB_HOST="34.162.250.28"
export TRIBAL_DB_PORT="5432"
export TRIBAL_DB_NAME="hapi"
export TRIBAL_DB_USER="hapiuser"
export TRIBAL_DB_PASSWORD="HapiSecure2026!"

# Required for config
export OPENAI_API_KEY="not-using-openai"
export FHIR_SERVER_URL="http://34.162.139.26:8080/fhir"

echo "Target Database:"
echo "  Host: $TRIBAL_DB_HOST"
echo "  Port: $TRIBAL_DB_PORT"
echo "  Database: $TRIBAL_DB_NAME"
echo "  User: $TRIBAL_DB_USER"
echo ""

read -p "Proceed with initialization? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Initialization cancelled."
    exit 0
fi

echo ""
echo "Running initialization script..."
echo ""

# Run the Python initialization script
python init_database.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database initialized successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test MA login at: https://medichat-frontend-820444130598.us-east5.run.app"
    echo "2. Run patient demo: ./run-complete-patient-demo.sh"
else
    echo ""
    echo "❌ Database initialization failed!"
    echo "Check the error messages above."
    exit 1
fi
