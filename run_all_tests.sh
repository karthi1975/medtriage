#!/bin/bash
# Run all tests for the Medical Triage System

echo "======================================"
echo "Medical Triage System - Test Suite"
echo "======================================"
echo ""

# Set up test environment
export OPENAI_API_KEY="test-key-for-testing"
export FHIR_SERVER_URL="https://hapi.fhir.org/baseR4"

# Backend tests
echo "Running Backend Tests..."
echo "--------------------------------------"

# Install Python dependencies
echo "Installing Python test dependencies..."
pip install -q pytest pytest-cov 2>/dev/null || true

# Run unit tests
echo ""
echo "1. Running Chat Service Tests..."
python -m pytest test_chat_service.py -v || echo "Chat service tests completed with some failures"

echo ""
echo "2. Running Triage Service Tests..."
python -m pytest test_triage_service.py -v || echo "Triage service tests completed with some failures"

echo ""
echo "3. Running Integration Tests..."
python -m pytest test_integration.py -v || echo "Integration tests completed with some failures"

echo ""
echo "4. Running Original API Tests..."
python test_api.py || echo "Original API tests completed with some failures"

echo ""
echo "======================================"
echo "Backend Tests Complete"
echo "======================================"
echo ""

# Frontend tests
echo "Running Frontend Tests..."
echo "--------------------------------------"

if [ -d "frontend" ]; then
    cd frontend

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install --silent
    fi

    echo ""
    echo "Running React Component Tests..."
    # Run tests in non-interactive mode
    CI=true npm test -- --coverage --watchAll=false || echo "Frontend tests completed with some failures"

    cd ..
else
    echo "Frontend directory not found, skipping frontend tests"
fi

echo ""
echo "======================================"
echo "All Tests Complete"
echo "======================================"
echo ""
echo "Test Summary:"
echo "- Backend unit tests (chat, triage): DONE"
echo "- Backend integration tests: DONE"
echo "- Frontend component tests: DONE"
echo ""
echo "Review the output above for any failures or errors."
echo ""
