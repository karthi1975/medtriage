#!/usr/bin/env python3
"""
Test script for Llama 4 API integration
Run this after authenticating with gcloud
"""
import sys
import json
from llama_service import get_llama_service


def test_basic_chat():
    """Test basic chat functionality"""
    print("\n" + "="*60)
    print("TEST 1: Basic Chat")
    print("="*60)

    llama = get_llama_service()

    messages = [
        {"role": "user", "content": "Hello! Can you help with medical questions?"}
    ]

    print("\nSending message to Llama 4...")
    response = llama.chat_completion(messages, max_tokens=150)

    if response:
        print("\n✅ SUCCESS!")
        print("\nResponse:")
        if 'choices' in response:
            print(response['choices'][0]['message']['content'])
        elif 'content' in response:
            print(response['content'])
        else:
            print(json.dumps(response, indent=2))
    else:
        print("\n❌ FAILED - No response received")
        return False

    return True


def test_medical_triage():
    """Test medical triage functionality"""
    print("\n" + "="*60)
    print("TEST 2: Medical Triage")
    print("="*60)

    llama = get_llama_service()

    symptoms = "High fever (103°F), severe headache, stiff neck, sensitivity to light"
    patient_history = {
        "age": "42",
        "gender": "Female",
        "allergies": "Penicillin",
        "current_medications": "Lisinopril for hypertension"
    }

    print(f"\nPatient Symptoms: {symptoms}")
    print(f"Patient History: {json.dumps(patient_history, indent=2)}")
    print("\nAnalyzing with Llama 4...")

    recommendation = llama.medical_triage(symptoms, patient_history)

    if recommendation:
        print("\n✅ SUCCESS!")
        print("\nTriage Recommendation:")
        print("-" * 60)
        print(recommendation)
        print("-" * 60)
    else:
        print("\n❌ FAILED - No recommendation received")
        return False

    return True


def test_medical_summary():
    """Test medical summary generation"""
    print("\n" + "="*60)
    print("TEST 3: Medical Summary Generation")
    print("="*60)

    llama = get_llama_service()

    clinical_notes = """
    Patient presents with acute onset chest pain radiating to left arm, started 2 hours ago.
    Pain described as crushing, 8/10 severity. Associated with diaphoresis and nausea.
    BP 145/92, HR 98, RR 20, O2 sat 96% on room air.
    ECG shows ST elevation in leads V2-V4.
    Patient has history of smoking (20 pack-years) and family history of CAD (father MI at age 55).
    Previous medical history includes hypertension and hyperlipidemia.
    Current medications: Lisinopril 10mg daily, Atorvastatin 40mg daily.
    """

    print("\nClinical Notes:")
    print(clinical_notes)
    print("\nGenerating summary with Llama 4...")

    summary = llama.generate_medical_summary(clinical_notes)

    if summary:
        print("\n✅ SUCCESS!")
        print("\nGenerated Summary:")
        print("-" * 60)
        print(summary)
        print("-" * 60)
    else:
        print("\n❌ FAILED - No summary generated")
        return False

    return True


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("LLAMA 4 API INTEGRATION TEST SUITE")
    print("="*60)
    print("\nMake sure you have:")
    print("1. Authenticated with: gcloud auth login")
    print("2. Set project: gcloud config set project project-c78515e0-ee8f-4282-a3c")
    print("3. Set quota project: gcloud auth application-default set-quota-project project-c78515e0-ee8f-4282-a3c")

    input("\nPress Enter to continue or Ctrl+C to cancel...")

    results = []

    # Run tests
    try:
        results.append(("Basic Chat", test_basic_chat()))
        results.append(("Medical Triage", test_medical_triage()))
        results.append(("Medical Summary", test_medical_summary()))
    except KeyboardInterrupt:
        print("\n\nTests cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = 0
    failed = 0

    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1

    print(f"\nTotal: {passed + failed} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if failed == 0:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed} test(s) failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
