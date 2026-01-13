import re

# Test the patient ID patterns
test_messages = [
    "cardiac-emergency-001",
    "Find patient cardiac-emergency-001",
    "stroke-emergency-002",
    "lookup chf-patient-003",
    "search diabetes-patient-004",
]

patient_id_patterns = [
    # Direct patient ID format (e.g., cardiac-emergency-001, stroke-emergency-002)
    (r'^([a-z]+\-[a-z]+\-\d+)$', 1),
    # Patient ID with words (e.g., "patient cardiac-emergency-001", "find patient X")
    (r'patient[\s-]*(id)?[\s:-]*([a-zA-Z0-9\-]+)', 2),
    (r'find\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
    (r'look\s*up\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
    (r'search\s+(?:for\s+)?(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
    (r'get\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
    (r'show\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
    # Just the ID alone (last resort - match IDs with hyphens and numbers)
    (r'\b([a-z]+\-[a-z]+\-\d{3,})\b', 1),
]

for message in test_messages:
    print(f"\nTesting: '{message}'")
    matched = False
    for pattern, group_idx in patient_id_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            patient_id = match.group(group_idx)
            print(f"  ✓ Matched with pattern: {pattern}")
            print(f"  ✓ Extracted patient_id: {patient_id}")
            matched = True
            break
    if not matched:
        print(f"  ✗ NO MATCH")
