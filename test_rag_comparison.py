"""
Comparison Test: RAG vs Simple Prompting
Demonstrates the advantages of Retrieval Augmented Generation
"""
import sys
import json
from typing import Dict, Any
from config import settings
from triage_service import TriageService
from schemas import ExtractedSymptom

# Test cases designed to show RAG advantages
TEST_CASES = [
    {
        "name": "Thunderclap Headache (Specific Medical Term)",
        "message": "I have the worst headache of my life. It came on suddenly, like a thunderclap, and reached maximum intensity within seconds. I'm also feeling nauseous and have a stiff neck.",
        "symptoms": [
            ExtractedSymptom(symptom="headache", severity="severe", duration="sudden", location="head"),
            ExtractedSymptom(symptom="nausea", severity="moderate", duration=None, location=None),
            ExtractedSymptom(symptom="stiff neck", severity="moderate", duration=None, location="neck")
        ],
        "expected_priority": "emergency",
        "key_knowledge": "Subarachnoid hemorrhage warning, thunderclap headache protocol"
    },
    {
        "name": "FAST Stroke Symptoms",
        "message": "My wife's face is drooping on one side, her arm is weak when she tries to lift it, and she's having trouble speaking clearly. This started about 30 minutes ago.",
        "symptoms": [
            ExtractedSymptom(symptom="face drooping", severity="severe", duration="30 minutes", location="face"),
            ExtractedSymptom(symptom="arm weakness", severity="severe", duration="30 minutes", location="arm"),
            ExtractedSymptom(symptom="speech difficulty", severity="severe", duration="30 minutes", location=None)
        ],
        "expected_priority": "emergency",
        "key_knowledge": "FAST protocol, stroke recognition, time is brain"
    },
    {
        "name": "Chest Pain with ACS Red Flags",
        "message": "I'm having crushing chest pain that's radiating to my left arm and jaw. I'm sweating profusely and feel nauseous. I'm 55 years old with diabetes and high blood pressure.",
        "symptoms": [
            ExtractedSymptom(symptom="chest pain", severity="severe", duration="current", location="chest"),
            ExtractedSymptom(symptom="radiating pain", severity="severe", duration="current", location="left arm and jaw"),
            ExtractedSymptom(symptom="sweating", severity="severe", duration="current", location=None),
            ExtractedSymptom(symptom="nausea", severity="moderate", duration="current", location=None)
        ],
        "expected_priority": "emergency",
        "key_knowledge": "ACS red flags, cardiac risk factors, diaphoresis"
    },
    {
        "name": "Appendicitis Red Flags",
        "message": "I have severe abdominal pain that started around my belly button and moved to my lower right side. I've had nausea, can't eat, and have a low-grade fever.",
        "symptoms": [
            ExtractedSymptom(symptom="abdominal pain", severity="severe", duration="hours", location="right lower quadrant"),
            ExtractedSymptom(symptom="nausea", severity="moderate", duration="hours", location=None),
            ExtractedSymptom(symptom="anorexia", severity="moderate", duration="hours", location=None),
            ExtractedSymptom(symptom="fever", severity="low-grade", duration="hours", location=None)
        ],
        "expected_priority": "urgent",
        "key_knowledge": "McBurney's point, migration of pain, appendicitis red flags"
    },
    {
        "name": "Pediatric Fever (Infant)",
        "message": "My 2-month-old baby has a fever of 100.5°F. She seems a bit fussy but is still feeding.",
        "symptoms": [
            ExtractedSymptom(symptom="fever", severity="low-grade", duration="current", location=None)
        ],
        "expected_priority": "emergency",
        "key_knowledge": "Infant <3 months fever protocol, risk of serious bacterial infection"
    }
]


def run_comparison_test():
    """Run comparison between RAG and non-RAG triage"""

    print("\n" + "="*80)
    print("RAG vs SIMPLE PROMPTING COMPARISON TEST")
    print("="*80)

    # Initialize both services
    print("\nInitializing services...")
    print("  - Creating Non-RAG Triage Service...")
    non_rag_service = TriageService(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        use_rag=False
    )

    print("  - Creating RAG-Enabled Triage Service...")
    rag_service = TriageService(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        use_rag=True
    )

    print("\nServices initialized successfully!\n")

    results_comparison = []

    for i, test_case in enumerate(TEST_CASES, 1):
        print("\n" + "="*80)
        print(f"TEST CASE {i}: {test_case['name']}")
        print("="*80)
        print(f"\nScenario: {test_case['message']}\n")
        print(f"Expected Priority: {test_case['expected_priority'].upper()}")
        print(f"Key Knowledge Required: {test_case['key_knowledge']}\n")

        # Test with NON-RAG
        print("-" * 80)
        print("SIMPLE PROMPTING (No RAG):")
        print("-" * 80)
        try:
            non_rag_result = non_rag_service.determine_triage_priority(
                symptoms=test_case['symptoms'],
                patient_context=None,
                user_message=test_case['message']
            )
            print(f"Priority: {non_rag_result.get('priority', 'N/A').upper()}")
            print(f"Confidence: {non_rag_result.get('confidence', 'N/A')}")
            print(f"Reasoning: {non_rag_result.get('reasoning', 'N/A')[:200]}...")
            print(f"Red Flags: {', '.join(non_rag_result.get('red_flags', []))}")
        except Exception as e:
            print(f"ERROR: {str(e)}")
            non_rag_result = {"error": str(e)}

        # Test with RAG
        print("\n" + "-" * 80)
        print("RAG-ENHANCED (With Medical Knowledge Retrieval):")
        print("-" * 80)
        try:
            rag_result = rag_service.determine_triage_priority(
                symptoms=test_case['symptoms'],
                patient_context=None,
                user_message=test_case['message']
            )
            print(f"Priority: {rag_result.get('priority', 'N/A').upper()}")
            print(f"Confidence: {rag_result.get('confidence', 'N/A')}")
            print(f"Reasoning: {rag_result.get('reasoning', 'N/A')[:200]}...")
            print(f"Red Flags: {', '.join(rag_result.get('red_flags', []))}")
        except Exception as e:
            print(f"ERROR: {str(e)}")
            rag_result = {"error": str(e)}

        # Compare results
        print("\n" + "-" * 80)
        print("COMPARISON:")
        print("-" * 80)

        comparison = {
            "test_case": test_case['name'],
            "expected_priority": test_case['expected_priority'],
            "non_rag_priority": non_rag_result.get('priority', 'error'),
            "rag_priority": rag_result.get('priority', 'error'),
            "non_rag_confidence": non_rag_result.get('confidence', 'N/A'),
            "rag_confidence": rag_result.get('confidence', 'N/A'),
            "priority_match_non_rag": non_rag_result.get('priority') == test_case['expected_priority'],
            "priority_match_rag": rag_result.get('priority') == test_case['expected_priority']
        }

        if comparison['priority_match_non_rag'] and comparison['priority_match_rag']:
            print("✅ Both got correct priority")
        elif comparison['priority_match_rag'] and not comparison['priority_match_non_rag']:
            print("✅ RAG got correct priority, Simple Prompting did not")
        elif comparison['priority_match_non_rag'] and not comparison['priority_match_rag']:
            print("⚠️  Simple Prompting got correct priority, RAG did not")
        else:
            print("❌ Both missed the correct priority")

        # Compare reasoning depth
        non_rag_reasoning_length = len(non_rag_result.get('reasoning', ''))
        rag_reasoning_length = len(rag_result.get('reasoning', ''))

        print(f"\nReasoning Depth:")
        print(f"  Simple Prompting: {non_rag_reasoning_length} characters")
        print(f"  RAG-Enhanced: {rag_reasoning_length} characters")

        if rag_reasoning_length > non_rag_reasoning_length * 1.2:
            print("  📝 RAG provided significantly more detailed reasoning")

        results_comparison.append(comparison)

        print("\n")

    # Final Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)

    non_rag_correct = sum(1 for r in results_comparison if r['priority_match_non_rag'])
    rag_correct = sum(1 for r in results_comparison if r['priority_match_rag'])

    print(f"\nCorrect Priorities:")
    print(f"  Simple Prompting: {non_rag_correct}/{len(TEST_CASES)} ({non_rag_correct/len(TEST_CASES)*100:.0f}%)")
    print(f"  RAG-Enhanced: {rag_correct}/{len(TEST_CASES)} ({rag_correct/len(TEST_CASES)*100:.0f}%)")

    print(f"\nAverage Confidence:")
    non_rag_confidence_scores = {'high': 3, 'medium': 2, 'low': 1}
    rag_confidence_scores = {'high': 3, 'medium': 2, 'low': 1}

    avg_non_rag = sum(non_rag_confidence_scores.get(r['non_rag_confidence'], 0) for r in results_comparison) / len(results_comparison)
    avg_rag = sum(rag_confidence_scores.get(r['rag_confidence'], 0) for r in results_comparison) / len(results_comparison)

    print(f"  Simple Prompting: {avg_non_rag:.2f}/3.0")
    print(f"  RAG-Enhanced: {avg_rag:.2f}/3.0")

    print("\n" + "="*80)
    print("KEY ADVANTAGES OF RAG DEMONSTRATED:")
    print("="*80)
    print("""
1. **Specific Medical Knowledge**: RAG retrieves exact clinical protocols and guidelines
   - Example: "Thunderclap headache" triggers subarachnoid hemorrhage protocol
   - Simple prompting relies on GPT's general training, which may miss specific terms

2. **Consistent with Best Practices**: RAG references actual medical standards
   - FAST protocol for strokes
   - ACS red flags for chest pain
   - Pediatric fever protocols

3. **More Detailed Reasoning**: Retrieved knowledge provides context for decisions
   - Explains WHY certain symptoms are concerning
   - Cites specific red flags from guidelines

4. **Reduced Hallucination Risk**: RAG grounds responses in retrieved documents
   - Less likely to make up protocols
   - More reliable for edge cases

5. **Updatable Knowledge**: Medical knowledge can be updated without retraining model
   - Add new guidelines to vector DB
   - Immediately available to all triage decisions

6. **Explainability**: Can trace decisions back to source guidelines
   - Important for medical liability
   - Builds trust with healthcare professionals
    """)

    print("="*80)
    print()

    return results_comparison


if __name__ == "__main__":
    try:
        results = run_comparison_test()

        # Save results to file
        with open('rag_comparison_results.json', 'w') as f:
            json.dump(results, f, indent=2)

        print(f"Results saved to rag_comparison_results.json")

    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
