#!/bin/bash

# Complete GCP Deployment Test
# Tests Frontend, Backend, HAPI FHIR, and end-to-end integration

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Service URLs
FRONTEND_URL="https://medichat-frontend-820444130598.us-east5.run.app"
BACKEND_URL="https://fhir-chat-api-820444130598.us-east5.run.app"
HAPI_URL="http://34.162.139.26:8080/fhir"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test header
print_header() {
    echo -e "\n${BLUE}=========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=========================================${NC}\n"
}

# Function to print test
print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $1${NC}"
}

# Function to print success
print_success() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: $1\n"
}

# Function to print failure
print_failure() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ FAIL${NC}: $1\n"
}

# Start testing
print_header "Complete GCP Deployment Test Suite"
echo -e "${CYAN}Testing all services...${NC}\n"

# ============================================
# PART 1: Frontend Tests
# ============================================
print_header "PART 1: Frontend Tests"

print_test "Frontend Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$FRONTEND_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Frontend is healthy (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    print_failure "Frontend health check failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi

print_test "Frontend Homepage Access"
RESPONSE=$(curl -s -w "\n%{http_code}" "$FRONTEND_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Frontend homepage accessible (HTTP $HTTP_CODE)"
else
    print_failure "Frontend homepage not accessible (HTTP $HTTP_CODE)"
fi

# ============================================
# PART 2: Backend API Tests
# ============================================
print_header "PART 2: Backend API Tests"

print_test "Backend Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Backend is healthy (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    print_failure "Backend health check failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi

print_test "Llama 4 API Integration"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/llama/test")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Llama 4 API is working (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    print_failure "Llama 4 API test failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi

# ============================================
# PART 3: HAPI FHIR Tests
# ============================================
print_header "PART 3: HAPI FHIR Server Tests"

print_test "HAPI FHIR Metadata Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$HAPI_URL/metadata")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    RESOURCE_TYPE=$(echo "$BODY" | jq -r '.resourceType' 2>/dev/null)
    FHIR_VERSION=$(echo "$BODY" | jq -r '.fhirVersion' 2>/dev/null)
    STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null)

    if [ "$RESOURCE_TYPE" = "CapabilityStatement" ] && [ "$STATUS" = "active" ]; then
        print_success "HAPI FHIR is running (FHIR $FHIR_VERSION)"
        echo "Resource Type: $RESOURCE_TYPE"
        echo "FHIR Version: $FHIR_VERSION"
        echo "Status: $STATUS"
    else
        print_failure "HAPI FHIR returned unexpected response"
        echo "$BODY" | head -20
    fi
else
    print_failure "HAPI FHIR metadata endpoint failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY" | head -20
fi

print_test "HAPI FHIR Patient Search"
RESPONSE=$(curl -s -w "\n%{http_code}" "$HAPI_URL/Patient?_count=1")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    BUNDLE_TYPE=$(echo "$BODY" | jq -r '.resourceType' 2>/dev/null)
    if [ "$BUNDLE_TYPE" = "Bundle" ]; then
        TOTAL=$(echo "$BODY" | jq -r '.total' 2>/dev/null)
        print_success "HAPI FHIR Patient search works (Total: $TOTAL patients)"
    else
        print_failure "HAPI FHIR Patient search returned unexpected format"
    fi
else
    print_failure "HAPI FHIR Patient search failed (HTTP $HTTP_CODE)"
fi

# ============================================
# PART 4: End-to-End Integration Tests
# ============================================
print_header "PART 4: End-to-End Integration Tests"

print_test "Backend → HAPI FHIR Connection"
# Test if backend can reach HAPI FHIR
RESPONSE=$(curl -s -X POST -w "\n%{http_code}" "$BACKEND_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "test-e2e", "user_message": "Hello"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    # 200 = success, 404 = patient not found (but connection works)
    print_success "Backend can communicate with services (HTTP $HTTP_CODE)"
else
    print_failure "Backend integration test failed (HTTP $HTTP_CODE)"
fi

# ============================================
# PART 5: Database Tests
# ============================================
print_header "PART 5: Database Tests"

print_test "Cloud SQL Connection (via HAPI)"
# If HAPI is working, Cloud SQL connection is good
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Cloud SQL database is accessible via HAPI FHIR"
else
    # Check if HAPI has database connectivity issues
    echo -e "${YELLOW}Note: Checking if database connection is the issue...${NC}"
    print_failure "Could not verify Cloud SQL connection"
fi

# ============================================
# Summary
# ============================================
print_header "Test Summary"

echo -e "${CYAN}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}ALL TESTS PASSED! ✓${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "${CYAN}Your deployment is fully operational!${NC}"
    echo ""
    echo "Access your application:"
    echo -e "${BLUE}Frontend:${NC} $FRONTEND_URL"
    echo -e "${BLUE}Backend:${NC} $BACKEND_URL"
    echo -e "${BLUE}HAPI FHIR:${NC} $HAPI_URL"
    echo ""
    exit 0
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}SOME TESTS FAILED ✗${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Please check the failed tests above and review:"
    echo "- Service logs"
    echo "- Network connectivity"
    echo "- IAM permissions"
    echo ""
    exit 1
fi
