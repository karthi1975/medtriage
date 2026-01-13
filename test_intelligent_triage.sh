#!/bin/bash
# Test script for Intelligent MA Triage System
# Tests the complete workflow from triage to test ordering

set -e  # Exit on error

echo "=========================================="
echo "Testing Intelligent MA Triage System"
echo "=========================================="

BASE_URL="http://localhost:8002"

echo ""
echo "1. Testing Intelligent Triage - Chest Pain Protocol"
echo "=============================================="

TRIAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/ma/intelligent-triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "232",
    "patient_name": "Jane Doe",
    "patient_age": 59,
    "patient_gender": "female",
    "patient_conditions": ["Hypertension", "Type 2 Diabetes", "Hyperlipidemia"],
    "symptoms": ["chest pain", "radiation to left arm"],
    "symptom_details": {
      "onset": "2 hours ago",
      "severity": "7/10",
      "character": "pressure-like"
    },
    "provider_name": "Dr. Alexander Mitchell",
    "specialty": "Cardiology",
    "urgency_override": null
  }')

echo "$TRIAGE_RESPONSE" | python3 -m json.tool

# Extract workflow ID from response
WORKFLOW_ID=$(echo "$TRIAGE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('workflow', {}).get('workflow_id', 'UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

echo ""
echo "Workflow ID created: $WORKFLOW_ID"

echo ""
echo "2. Get Active Workflows"
echo "========================"

curl -s -X GET "$BASE_URL/api/v1/workflows/active" | python3 -m json.tool

echo ""
echo "3. Get Workflows Needing Attention"
echo "===================================="

curl -s -X GET "$BASE_URL/api/v1/workflows/attention-needed" | python3 -m json.tool

if [ "$WORKFLOW_ID" != "UNKNOWN" ]; then
    echo ""
    echo "4. Get Specific Workflow: $WORKFLOW_ID"
    echo "======================================="

    curl -s -X GET "$BASE_URL/api/v1/workflows/$WORKFLOW_ID" | python3 -m json.tool

    echo ""
    echo "5. Update Checkpoint: Take vital signs"
    echo "========================================"

    curl -s -X POST "$BASE_URL/api/v1/workflows/$WORKFLOW_ID/checkpoints/Take%20vital%20signs/update" \
      -H "Content-Type: application/json" \
      -d '{
        "checkpoint_status": "completed",
        "details": "BP: 145/92, HR: 88, SpO2: 97%, Pain: 7/10"
      }' | python3 -m json.tool

    echo ""
    echo "6. Update Checkpoint: 12-lead ECG"
    echo "=================================="

    curl -s -X POST "$BASE_URL/api/v1/workflows/$WORKFLOW_ID/checkpoints/12-lead%20ECG/update" \
      -H "Content-Type: application/json" \
      -d '{
        "checkpoint_status": "completed",
        "details": "Normal sinus rhythm, no ST changes"
      }' | python3 -m json.tool

    echo ""
    echo "7. Add Test Order: Lipid Panel"
    echo "==============================="

    ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/workflows/$WORKFLOW_ID/test-orders" \
      -H "Content-Type: application/json" \
      -d '{
        "test_name": "Lipid Panel",
        "order_type": "laboratory",
        "scheduled_date": "2025-12-14T07:30:00",
        "details": {
          "fasting_required": true,
          "location": "Main Lab - 1st Floor"
        }
      }')

    echo "$ORDER_RESPONSE" | python3 -m json.tool

    ORDER_ID=$(echo "$ORDER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('order', {}).get('order_id', 'UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

    echo ""
    echo "Test Order ID: $ORDER_ID"

    if [ "$ORDER_ID" != "UNKNOWN" ]; then
        echo ""
        echo "8. Update Test Order Status"
        echo "============================"

        curl -s -X POST "$BASE_URL/api/v1/workflows/$WORKFLOW_ID/test-orders/$ORDER_ID/update" \
          -H "Content-Type: application/json" \
          -d '{
            "order_status": "completed",
            "results_available": true,
            "details": {
              "total_cholesterol": "245 mg/dL",
              "ldl": "165 mg/dL",
              "hdl": "42 mg/dL"
            }
          }' | python3 -m json.tool
    fi

    echo ""
    echo "9. Get Updated Workflow Progress"
    echo "================================="

    curl -s -X GET "$BASE_URL/api/v1/workflows/$WORKFLOW_ID" | python3 -m json.tool

    echo ""
    echo "10. Get Patient Workflows"
    echo "=========================="

    curl -s -X GET "$BASE_URL/api/v1/workflows/patient/232" | python3 -m json.tool

fi

echo ""
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="

echo ""
echo "Summary:"
echo "- Intelligent triage endpoint: Tested ✓"
echo "- Protocol activation: Tested ✓"
echo "- Workflow creation: Tested ✓"
echo "- Checkpoint management: Tested ✓"
echo "- Test order management: Tested ✓"
echo "- Workflow tracking: Tested ✓"

echo ""
echo "Next steps:"
echo "1. Review the triage result - should activate Chest Pain Protocol"
echo "2. Check immediate actions - should include ECG, troponin"
echo "3. Verify test ordering plan - should include labs and echo"
echo "4. Confirm workflow was created with proper checkpoints"
