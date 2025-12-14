#!/usr/bin/env python3
"""
RAG Verification Script
Tests that RAG is actually working by checking for knowledge base content in responses
"""

import requests
import json
import sys
from typing import Dict, Any, List

BASE_URL = "http://localhost:8002"

# Test cases designed to trigger specific knowledge base retrieval
TEST_CASES = [
    {
        "name": "Chest Pain - ACS Guidelines",
        "query": "I have crushing chest pain radiating to my left arm and jaw. I am sweating profusely and short of breath.",
        "expected_keywords": [
            "ACS",
            "acute coronary syndrome",
            "cardiac",
            "911",
            "emergency",
            "radiation",
            "diaphoresis"
        ],
        "expected_priority": "emergency",
        "category": "Chest Pain"
    },
    {
        "name": "Headache - Thunderclap/SAH",
        "query": "Sudden severe headache, worst headache of my life, started 30 minutes ago",
        "expected_keywords": [
            "worst headache",
            "thunderclap",
            "subarachnoid",
            "emergency",
            "911"
        ],
        "expected_priority": "emergency",
        "category": "Headache"
    },
    {
        "name": "Pediatric Fever - Infant Protocol",
        "query": "My 2-month-old baby has a fever of 100.8°F",
        "expected_keywords": [
            "infant",
            "months",
            "emergency",
            "serious bacterial infection",
            "urgent"
        ],
        "expected_priority": "emergency",
        "category": "Pediatric Triage"
    },
    {
        "name": "Stroke - F.A.S.T. Protocol",
        "query": "My father's face is drooping on one side and he can't lift his right arm. Started 20 minutes ago.",
        "expected_keywords": [
            "stroke",
            "F.A.S.T",
            "TIA",
            "911",
            "emergency",
            "neurological"
        ],
        "expected_priority": "emergency",
        "category": "Stroke/TIA"
    },
    {
        "name": "Abdominal Pain - Appendicitis",
        "query": "Severe pain in my lower right abdomen that started yesterday. Pain is constant, rated 8/10, with nausea and loss of appetite.",
        "expected_keywords": [
            "appendicitis",
            "right lower quadrant",
            "RLQ",
            "urgent",
            "surgical"
        ],
        "expected_priority": "urgent",
        "category": "Abdominal Pain"
    }
]


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """Print formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")


def test_triage_endpoint(test_case: Dict[str, Any]) -> Dict[str, Any]:
    """Send triage request and return response"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/triage",
            json={"message": test_case["query"]},
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code == 200:
            return response.json()
        else:
            print_error(f"API returned status {response.status_code}: {response.text}")
            return None

    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to {BASE_URL}. Is the server running?")
        return None
    except Exception as e:
        print_error(f"Error making request: {str(e)}")
        return None


def check_rag_evidence(test_case: Dict[str, Any], response: Dict[str, Any]) -> bool:
    """
    Check if response shows evidence of RAG knowledge retrieval
    Returns True if RAG appears to be working
    """
    if not response:
        return False

    # Combine all text fields to search
    search_text = " ".join([
        str(response.get('reasoning', '')),
        str(response.get('priority', '')),
        json.dumps(response.get('recommendations', {})),
        json.dumps(response.get('red_flags', []))
    ]).lower()

    # Check for expected keywords from knowledge base
    found_keywords = []
    missing_keywords = []

    for keyword in test_case['expected_keywords']:
        if keyword.lower() in search_text:
            found_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    # Calculate match percentage
    match_percentage = (len(found_keywords) / len(test_case['expected_keywords'])) * 100

    # Print results
    print(f"\n  {Colors.BOLD}RAG Evidence Analysis:{Colors.ENDC}")
    print(f"  Expected Category: {test_case['category']}")
    print(f"  Expected Priority: {test_case['expected_priority']}")
    print(f"  Actual Priority: {response.get('priority', 'unknown')}")
    print(f"  Match Score: {match_percentage:.1f}%")

    if found_keywords:
        print(f"\n  {Colors.OKGREEN}Found Keywords ({len(found_keywords)}):{Colors.ENDC}")
        for kw in found_keywords:
            print(f"    ✓ {kw}")

    if missing_keywords:
        print(f"\n  {Colors.WARNING}Missing Keywords ({len(missing_keywords)}):{Colors.ENDC}")
        for kw in missing_keywords:
            print(f"    ✗ {kw}")

    # Check priority match
    priority_match = response.get('priority', '').lower() == test_case['expected_priority'].lower()

    if priority_match:
        print_success("Priority classification matches expected")
    else:
        print_warning(f"Priority mismatch: expected '{test_case['expected_priority']}', got '{response.get('priority')}'")

    # RAG is working if we found at least 40% of keywords and priority matches
    rag_working = match_percentage >= 40 and priority_match

    return rag_working


def verify_rag_service():
    """Main verification function"""
    print_header("RAG VERIFICATION TEST SUITE")

    # Check server health
    print_info("Checking server health...")
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=5)
        if health_response.status_code == 200:
            print_success(f"Server is running at {BASE_URL}")
        else:
            print_error("Server health check failed")
            return False
    except:
        print_error(f"Cannot connect to server at {BASE_URL}")
        print_info("Start the server with: docker-compose up")
        return False

    # Run test cases
    print_header("RUNNING RAG TEST CASES")

    results = []
    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"\n{Colors.BOLD}Test {i}/{len(TEST_CASES)}: {test_case['name']}{Colors.ENDC}")
        print(f"Query: {test_case['query'][:80]}...")

        # Send request
        print_info("Sending triage request...")
        response = test_triage_endpoint(test_case)

        if response:
            # Check for RAG evidence
            rag_working = check_rag_evidence(test_case, response)
            results.append({
                'name': test_case['name'],
                'passed': rag_working
            })

            if rag_working:
                print_success(f"Test PASSED - RAG appears to be working")
            else:
                print_warning(f"Test INCONCLUSIVE - Limited RAG evidence")
        else:
            print_error(f"Test FAILED - No response received")
            results.append({
                'name': test_case['name'],
                'passed': False
            })

    # Summary
    print_header("VERIFICATION SUMMARY")

    passed = sum(1 for r in results if r['passed'])
    total = len(results)
    pass_rate = (passed / total * 100) if total > 0 else 0

    print(f"Tests Passed: {passed}/{total} ({pass_rate:.1f}%)\n")

    for result in results:
        status = "✓ PASSED" if result['passed'] else "✗ FAILED"
        color = Colors.OKGREEN if result['passed'] else Colors.FAIL
        print(f"{color}{status}{Colors.ENDC} - {result['name']}")

    print()

    # Final verdict
    if pass_rate >= 80:
        print_success("✓ RAG IS WORKING CORRECTLY")
        print_info("The system is retrieving and using medical knowledge from the knowledge base.")
        return True
    elif pass_rate >= 50:
        print_warning("⚠ RAG MAY BE PARTIALLY WORKING")
        print_info("Some evidence of knowledge retrieval, but results are inconsistent.")
        return False
    else:
        print_error("✗ RAG DOES NOT APPEAR TO BE WORKING")
        print_info("Check the following:")
        print_info("  1. USE_RAG=true in .env file")
        print_info("  2. ChromaDB is initialized (check logs)")
        print_info("  3. Medical knowledge base is loaded")
        print_info("  4. Server logs for RAG-related errors")
        return False


if __name__ == "__main__":
    print(f"\n{Colors.BOLD}FHIR Medical Triage System - RAG Verification{Colors.ENDC}")
    print(f"Testing RAG functionality at {BASE_URL}\n")

    success = verify_rag_service()

    sys.exit(0 if success else 1)
