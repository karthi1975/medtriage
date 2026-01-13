#!/bin/bash

# Complete Patient Workflow Demo
# Creates 5 patients and demonstrates intelligent triage & scheduling

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        MEDICHAT - COMPLETE PATIENT WORKFLOW DEMO              ║"
echo "║                                                               ║"
echo "║  Demonstrates:                                                ║"
echo "║  • Patient Creation in HAPI FHIR                              ║"
echo "║  • Intelligent Triage with Llama 4 AI                         ║"
echo "║  • Appointment Scheduling Logic                               ║"
echo "║  • Multi-specialty Care Coordination                          ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "This demo includes 5 realistic patient scenarios:"
echo ""
echo "  1. 🫀 Cardiac Emergency (Acute MI) - Age 60M"
echo "  2. 🧠 Stroke Emergency (CVA) - Age 67F"
echo "  3. 💔 Heart Failure (CHF) - Age 73M"
echo "  4. 🩹 Diabetic Foot Ulcer - Age 57F"
echo "  5. 🦴 Hip Fracture - Age 80F"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Press Enter to start creating patients in HAPI FHIR..."
echo ""

# Step 1: Create patients
echo "STEP 1: Creating 5 Test Patients..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./create-5-test-patients.sh

if [ $? -ne 0 ]; then
    echo "❌ Error creating patients. Please check HAPI FHIR server."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Press Enter to run intelligent triage workflow..."
echo ""

# Step 2: Run triage workflow
echo "STEP 2: Running Intelligent Triage & Scheduling..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./test-5-patient-workflow.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Complete Patient Workflow Demo Finished!"
echo ""
echo "📚 For detailed clinical information, see:"
echo "   • FIVE_PATIENT_SCENARIOS.md - Complete clinical scenarios"
echo "   • Patient IDs for testing:"
echo "      - cardiac-emergency-001"
echo "      - stroke-emergency-002"
echo "      - chf-patient-003"
echo "      - diabetes-patient-004"
echo "      - ortho-patient-005"
echo ""
echo "🧪 Test these patients in the frontend:"
echo "   https://medichat-frontend-820444130598.us-east5.run.app"
echo ""
