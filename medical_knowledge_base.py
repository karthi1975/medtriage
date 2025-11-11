"""
Medical Knowledge Base for RAG
Contains clinical triage guidelines, symptom information, and decision rules
"""

MEDICAL_KNOWLEDGE = [
    # Chest Pain Triage Guidelines
    {
        "category": "Chest Pain",
        "content": """
        CHEST PAIN TRIAGE PROTOCOL:

        EMERGENCY (Call 911 immediately):
        - Crushing, squeezing chest pain or pressure
        - Pain radiating to jaw, neck, shoulder, or arm (especially left)
        - Associated with shortness of breath, sweating, nausea
        - Sudden onset severe chest pain
        - Duration >5 minutes
        - Patient appears ill or distressed

        Clinical Pearl: In patients over 40, with cardiac risk factors (diabetes, hypertension,
        smoking, family history), ANY chest discomfort should be treated as potential cardiac
        event until proven otherwise.

        ACUTE CORONARY SYNDROME (ACS) RED FLAGS:
        - Diaphoresis (profuse sweating)
        - Pallor
        - Dyspnea
        - Nausea/vomiting with chest pain
        - Radiation of pain
        - Pain not relieved by rest

        References: American Heart Association ACS Guidelines 2023
        """
    },

    # Headache Triage
    {
        "category": "Headache",
        "content": """
        HEADACHE TRIAGE PROTOCOL:

        EMERGENCY ("Worst headache of life" or "Thunderclap headache"):
        - Sudden severe headache reaching maximum intensity within minutes
        - "Worst headache I've ever had"
        - Associated with confusion, loss of consciousness, seizure
        - Fever + stiff neck + headache (meningitis concern)
        - Headache after head trauma
        - New headache in patient >50 years with temporal tenderness (temporal arteritis)
        - Headache with vision changes, weakness, speech difficulty

        URGENT (Same day evaluation):
        - Severe headache lasting >72 hours
        - Headache with persistent vomiting
        - Progressive worsening over days/weeks
        - New pattern in patient with history of migraines
        - Headache awakening patient from sleep

        NON-URGENT:
        - Tension-type headache with known pattern
        - Mild migraine with usual characteristics
        - Headache associated with stress, lack of sleep, dehydration

        SUBARACHNOID HEMORRHAGE WARNING: Sudden severe headache + stiff neck + altered
        mental status = EMERGENCY. Do not delay care.

        References: American College of Emergency Physicians Clinical Guidelines
        """
    },

    # Fever Triage
    {
        "category": "Fever",
        "content": """
        FEVER TRIAGE PROTOCOL:

        Temperature Definitions:
        - Low-grade: 100.4°F - 102°F (38°C - 38.9°C)
        - High-grade: >102°F (>38.9°C)
        - Very high: >103°F (>39.4°C)

        EMERGENCY:
        - Fever >105°F (40.5°C)
        - Fever with altered mental status, confusion, lethargy
        - Fever with severe headache + stiff neck (meningitis)
        - Fever with difficulty breathing
        - Fever with petechial rash (non-blanching)
        - Fever in immunocompromised patient
        - Fever with chest pain
        - Fever in infant <3 months

        URGENT (same day/next day):
        - Fever >103°F for >48 hours
        - Fever with moderate dehydration
        - Fever with productive cough (pneumonia concern)
        - Fever with urinary symptoms
        - Fever with severe sore throat

        NON-URGENT:
        - Low-grade fever <48 hours with URI symptoms
        - Fever responding well to antipyretics
        - Patient maintaining hydration and activity

        AGE CONSIDERATIONS:
        - Infants <3 months: ANY fever is URGENT
        - Elderly: May have serious infection with minimal fever
        - Immunocompromised: Lower threshold for urgent care

        References: CDC Fever Guidelines, Infectious Disease Society of America
        """
    },

    # Abdominal Pain
    {
        "category": "Abdominal Pain",
        "content": """
        ABDOMINAL PAIN TRIAGE PROTOCOL:

        EMERGENCY:
        - Severe constant abdominal pain (not crampy)
        - Abdominal pain with rigid, board-like abdomen
        - Pain with hypotension, tachycardia (shock signs)
        - Abdominal pain with bloody stool or vomit
        - Pain radiating to back (AAA concern)
        - Abdominal pain in pregnant patient
        - Pain with inability to pass stool or gas (obstruction)

        URGENT:
        - Severe pain lasting >6 hours
        - Right lower quadrant pain (appendicitis concern)
        - Right upper quadrant pain especially after eating (gallbladder)
        - Pain with fever
        - Pain with persistent vomiting
        - Pain with blood in urine

        APPENDICITIS RED FLAGS:
        - McBurney's point tenderness
        - Rebound tenderness
        - Migration of pain from periumbilical to RLQ
        - Anorexia, nausea, low-grade fever

        ECTOPIC PREGNANCY: Any abdominal pain in woman of childbearing age
        with missed period = URGENT evaluation

        References: American College of Surgeons Acute Abdomen Guidelines
        """
    },

    # Shortness of Breath
    {
        "category": "Dyspnea",
        "content": """
        SHORTNESS OF BREATH TRIAGE PROTOCOL:

        EMERGENCY (Call 911):
        - Severe difficulty breathing at rest
        - Unable to speak full sentences
        - Blue lips or fingernails (cyanosis)
        - Confusion, altered mental status
        - Gasping for air
        - Respiratory rate >30 or <10
        - Stridor (high-pitched breathing sound)
        - Drooling, unable to swallow (epiglottitis)

        URGENT:
        - New onset shortness of breath
        - Shortness of breath with chest pain
        - SOB with leg swelling (DVT/PE concern)
        - SOB with fever
        - Wheezing not responding to usual inhalers
        - Orthopnea (SOB when lying flat)

        PULMONARY EMBOLISM RED FLAGS:
        - Sudden onset SOB
        - Chest pain (pleuritic)
        - Recent surgery, immobilization, long flight
        - History of DVT
        - Unilateral leg swelling

        ASTHMA EXACERBATION WARNING SIGNS:
        - Peak flow <50% personal best
        - No improvement after 2-3 albuterol treatments
        - Difficulty speaking
        - Use of accessory muscles

        References: American Thoracic Society, COPD Guidelines
        """
    },

    # Neurological Symptoms
    {
        "category": "Stroke/TIA",
        "content": """
        STROKE RECOGNITION (F.A.S.T.):

        EMERGENCY - EVERY MINUTE COUNTS:
        F - Face drooping (Ask person to smile)
        A - Arm weakness (Ask to raise both arms)
        S - Speech difficulty (Ask to repeat simple phrase)
        T - Time to call 911 IMMEDIATELY

        OTHER STROKE WARNING SIGNS:
        - Sudden severe headache
        - Sudden vision changes (one or both eyes)
        - Sudden dizziness, loss of balance
        - Sudden confusion
        - Sudden numbness (face, arm, leg, especially one side)

        TIA (Transient Ischemic Attack):
        - Symptoms resolve within minutes to hours
        - STILL URGENT - high risk of stroke within 48 hours
        - Requires immediate evaluation

        TIME IS BRAIN: Treatment window for tPA is 4.5 hours from symptom onset.
        Every minute of delay = 1.9 million neurons lost.

        POSTERIOR CIRCULATION STROKES may present with:
        - Vertigo, ataxia
        - Visual field deficits
        - Dysarthria, dysphagia

        References: American Stroke Association, National Stroke Guidelines
        """
    },

    # Pediatric Considerations
    {
        "category": "Pediatric Triage",
        "content": """
        PEDIATRIC SPECIAL CONSIDERATIONS:

        INFANT <3 MONTHS:
        - ANY fever >100.4°F = EMERGENCY (risk of serious bacterial infection)
        - Poor feeding, lethargy = EMERGENCY
        - Irritability, inconsolable crying = URGENT
        - Bulging fontanelle = EMERGENCY (increased ICP)

        DEHYDRATION SIGNS IN CHILDREN:
        Mild: Slightly dry mucous membranes, decreased urine output
        Moderate: Sunken eyes, no tears, very dry mouth
        Severe: Lethargic, sunken fontanelle, no urine >8hrs = EMERGENCY

        RESPIRATORY DISTRESS IN CHILDREN:
        - Nasal flaring
        - Subcostal/intercostal retractions
        - Grunting
        - Head bobbing
        = EMERGENCY if present

        SEIZURE IN CHILDREN:
        - First-time seizure = URGENT evaluation
        - Febrile seizure >15 minutes = EMERGENCY
        - Multiple seizures without recovery = EMERGENCY (status epilepticus)

        References: AAP Clinical Practice Guidelines, PALS Guidelines
        """
    },

    # Trauma and Injuries
    {
        "category": "Trauma",
        "content": """
        TRAUMA TRIAGE CRITERIA:

        EMERGENCY (Call 911):
        - Any penetrating injury to head, neck, torso
        - Falls from >20 feet
        - Motor vehicle crash with ejection
        - Motorcycle crash >20 mph
        - Pedestrian struck by vehicle
        - Suspected spine injury (neck/back pain after trauma)
        - Severe bleeding not controlled by pressure
        - Open fracture (bone through skin)

        HEAD INJURY RED FLAGS:
        - Loss of consciousness
        - Vomiting (>1 episode)
        - Severe headache
        - Confusion, amnesia
        - Unequal pupils
        - Clear fluid from nose/ears
        - Seizure after injury

        URGENT:
        - Suspected closed fracture
        - Deep laceration needing sutures
        - Joint injury with swelling, instability
        - Persistent pain after sprain >48 hours

        CONCUSSION RETURN TO PLAY: Must be symptom-free and cleared by
        physician before returning to sports

        References: Advanced Trauma Life Support (ATLS), Brain Injury Guidelines
        """
    },

    # Allergic Reactions
    {
        "category": "Allergic Reactions",
        "content": """
        ANAPHYLAXIS RECOGNITION AND MANAGEMENT:

        EMERGENCY (Call 911 and use EpiPen if available):
        Anaphylaxis criteria (2 or more of following):
        - Skin: Hives, flushing, angioedema
        - Respiratory: Difficulty breathing, wheezing, stridor, throat tightness
        - Cardiovascular: Hypotension, dizziness, syncope
        - GI: Severe cramping, vomiting, diarrhea

        BIPHASIC REACTION: 20% of anaphylaxis cases have second wave 4-12 hours
        after initial symptoms. Patient needs hospital observation even if
        EpiPen helped initially.

        URGENT:
        - Localized allergic reaction with significant swelling
        - Hives covering large body area
        - Facial swelling without respiratory symptoms
        - Known severe allergy with exposure

        NON-URGENT:
        - Mild localized hives
        - Minor itching
        - Rash responding to antihistamines

        RISK FACTORS for severe reaction:
        - History of anaphylaxis
        - Asthma
        - Delayed EpiPen use
        - Adolescents/young adults at higher risk

        References: World Allergy Organization Anaphylaxis Guidelines
        """
    },

    # Mental Health Emergencies
    {
        "category": "Mental Health",
        "content": """
        PSYCHIATRIC EMERGENCY TRIAGE:

        EMERGENCY (Immediate intervention):
        - Active suicidal ideation with plan and means
        - Homicidal ideation with intent
        - Acute psychosis with dangerous behavior
        - Severe agitation, threatening behavior
        - Acute altered mental status
        - Suicide attempt or self-harm

        SUICIDE RISK ASSESSMENT (SAD PERSONS):
        S - Sex (male higher risk)
        A - Age (<25 or >45)
        D - Depression
        P - Previous attempt
        E - Ethanol/substance abuse
        R - Rational thinking loss
        S - Social support lacking
        O - Organized plan
        N - No spouse
        S - Sickness (chronic illness)

        URGENT:
        - New or worsening depression with passive suicidal thoughts
        - Panic attack (first-time or severe)
        - Medication not working or causing adverse effects
        - Unable to care for self
        - Bipolar mania without dangerous behavior

        988 SUICIDE & CRISIS LIFELINE: Available 24/7

        References: American Psychiatric Association Practice Guidelines
        """
    },

    # Medication and Overdose
    {
        "category": "Poisoning/Overdose",
        "content": """
        POISONING AND OVERDOSE MANAGEMENT:

        EMERGENCY (Call 911 AND Poison Control 1-800-222-1222):
        - Any intentional ingestion/overdose
        - Altered mental status after ingestion
        - Seizure after ingestion
        - Difficulty breathing
        - Chest pain
        - Severe vomiting/diarrhea
        - Known toxic substance (household chemicals, medications)

        ACETAMINOPHEN OVERDOSE:
        - Extremely dangerous even if patient feels okay initially
        - >7.5g in adults (>150mg/kg in children) = EMERGENCY
        - N-acetylcysteine (NAC) most effective if given <8 hours
        - Liver damage may not be apparent for 24-72 hours

        OPIOID OVERDOSE SIGNS:
        - Pinpoint pupils
        - Slow/shallow breathing
        - Unconsciousness
        - Blue lips/fingernails
        - Naloxone (Narcan) can reverse - still need emergency care

        COMMON DANGEROUS INGESTIONS:
        - Iron supplements
        - Tricyclic antidepressants
        - Beta blockers/calcium channel blockers
        - Caustic substances (drain cleaner, batteries)

        References: American Association of Poison Control Centers
        """
    }
]


def get_all_knowledge_chunks():
    """Return all medical knowledge chunks for vector database"""
    return [item["content"] for item in MEDICAL_KNOWLEDGE]


def get_knowledge_by_category(category: str):
    """Get specific category knowledge"""
    return [item for item in MEDICAL_KNOWLEDGE if item["category"].lower() == category.lower()]
