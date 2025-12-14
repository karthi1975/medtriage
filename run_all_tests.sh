#!/bin/bash
set -e

echo "=================================="
echo "MediChat Enhanced - Full Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_count=0
pass_count=0
fail_count=0

run_test() {
  test_count=$((test_count + 1))
  echo -e "\n${YELLOW}Test $test_count: $1${NC}"
  if eval "$2"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    pass_count=$((pass_count + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    fail_count=$((fail_count + 1))
    return 1
  fi
}

# Test 1: Docker Services
run_test "Docker Services Running" \
  "docker-compose ps | grep -q 'Up'"

# Test 2: Health Endpoint
run_test "Backend Health Check" \
  "curl -s http://localhost:8002/health | grep -q 'healthy'"

# Test 3: FHIR Server
run_test "FHIR Server Accessible" \
  "curl -s http://localhost:8081/fhir/metadata | grep -q 'CapabilityStatement'"

# Test 4: Tribal DB Connection
run_test "Tribal Database Connection" \
  "docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -c 'SELECT 1;' | grep -q '1 row'"

# Test 5: FHIR DB Connection
run_test "FHIR Database Connection" \
  "docker exec postgres-fhir-db psql -U hapiuser -d hapi -c 'SELECT 1;' | grep -q '1 row'"

# Test 6: Provider Count
run_test "Provider Data Loaded" \
  "docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -t -c 'SELECT COUNT(*) FROM providers;' | grep -q '210'"

# Test 7: Specialty Count
run_test "Specialty Data Loaded" \
  "docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -t -c 'SELECT COUNT(*) FROM specialties;' | grep -q '21'"

# Test 8: Frontend Accessible
run_test "Frontend Accessible" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 | grep -q '200'"

# Test 9: API Docs Accessible
run_test "API Documentation Accessible" \
  "curl -s http://localhost:8002/docs | grep -q 'Swagger'"

# Test 10: Patient Endpoint
run_test "Patient API Endpoint" \
  "curl -s 'http://localhost:8081/fhir/Patient?_count=1' | grep -q 'resourceType'"

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo "=================================="

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
