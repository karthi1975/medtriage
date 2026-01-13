"""
Clinical Protocol Configuration
Defines clinical protocols that automatically activate based on symptoms and conditions.
"""

from typing import List, Dict, Optional
from enum import Enum


class Urgency(str, Enum):
    IMMEDIATE = "immediate"
    URGENT = "urgent"
    ROUTINE = "routine"
    CONDITIONAL = "conditional"


class ProtocolPriority(str, Enum):
    CRITICAL = "critical"
    URGENT = "urgent"
    ROUTINE = "routine"


# Clinical Protocol Definitions
CLINICAL_PROTOCOLS = {
    "chest_pain": {
        "name": "Chest Pain Protocol",
        "priority": ProtocolPriority.URGENT,
        "triggers": {
            "symptoms": [
                "chest pain",
                "chest pressure",
                "chest tightness",
                "angina",
                "cardiac pain",
                "crushing"
            ],
            "red_flags": [
                "radiation to arm",
                "radiating to arm",
                "down my arm",
                "down my left arm",
                "down left arm",
                "to my arm",
                "to left arm",
                "radiation to jaw",
                "radiating to jaw",
                "to my jaw",
                "shortness of breath",
                "diaphoresis",
                "sweating",
                "nausea with chest pain",
                "crushing",
                "crushing pain",
                "squeezing"
            ]
        },
        "risk_stratification": {
            "age_threshold": 45,
            "high_risk_conditions": [
                "Hypertension",
                "Type 2 Diabetes",
                "Hyperlipidemia",
                "Family history of CAD",
                "Smoking",
                "Obesity"
            ]
        },
        "actions": [
            {
                "action": "Take vital signs",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "BP, HR, Temp, SpO2, Pain scale"
            },
            {
                "action": "12-lead ECG",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "STAT ECG - do not wait for physician"
            },
            {
                "action": "Troponin test",
                "urgency": Urgency.URGENT,
                "status": "pending",
                "details": "Point-of-care troponin if available"
            },
            {
                "action": "Notify cardiologist if abnormal",
                "urgency": Urgency.CONDITIONAL,
                "status": "pending",
                "details": "Call cardiology if ECG shows ST changes or troponin elevated"
            }
        ],
        "pre_appointment_tests": [
            {
                "test": "Lipid Panel",
                "max_age_days": 30,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Assess cardiac risk factors"
            },
            {
                "test": "BNP/NT-proBNP",
                "max_age_days": 7,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Chest pain + heart failure risk factors"
            },
            {
                "test": "Echocardiogram",
                "max_age_days": 180,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Assess cardiac structure and function"
            }
        ],
        "disposition_rules": {
            "critical": {
                "criteria": "ST elevation OR troponin >0.04 OR unstable vitals",
                "action": "Call 911 / Transfer to ER immediately"
            },
            "urgent": {
                "criteria": "Abnormal ECG OR elevated troponin OR high risk factors",
                "action": "Same-day cardiology consult"
            },
            "routine": {
                "criteria": "Normal ECG AND normal troponin AND stable",
                "action": "Schedule cardiology within 1-2 weeks with pre-tests"
            }
        }
    },

    "shortness_of_breath": {
        "name": "Dyspnea Protocol",
        "priority": ProtocolPriority.URGENT,
        "triggers": {
            "symptoms": [
                "shortness of breath",
                "dyspnea",
                "difficulty breathing",
                "can't catch breath"
            ],
            "red_flags": [
                "at rest",
                "worsening",
                "orthopnea",
                "paroxysmal nocturnal dyspnea"
            ]
        },
        "risk_stratification": {
            "age_threshold": 50,
            "high_risk_conditions": [
                "Heart failure",
                "COPD",
                "Asthma",
                "Pulmonary hypertension"
            ]
        },
        "actions": [
            {
                "action": "Take vital signs including SpO2",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "Focus on oxygen saturation"
            },
            {
                "action": "ECG",
                "urgency": Urgency.URGENT,
                "status": "pending",
                "details": "Rule out cardiac cause"
            },
            {
                "action": "BNP test",
                "urgency": Urgency.URGENT,
                "status": "pending",
                "details": "Differentiate cardiac vs pulmonary"
            }
        ],
        "pre_appointment_tests": [
            {
                "test": "BNP",
                "max_age_days": 7,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Essential for heart failure assessment"
            },
            {
                "test": "Chest X-ray",
                "max_age_days": 30,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Rule out pulmonary edema, infiltrate"
            },
            {
                "test": "Echocardiogram",
                "max_age_days": 90,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Assess cardiac function if heart failure suspected"
            }
        ]
    },

    "palpitations": {
        "name": "Palpitations Protocol",
        "priority": ProtocolPriority.ROUTINE,
        "triggers": {
            "symptoms": [
                "palpitations",
                "heart racing",
                "irregular heartbeat",
                "heart fluttering"
            ],
            "red_flags": [
                "syncope",
                "near syncope",
                "chest pain with palpitations",
                "family history sudden death"
            ]
        },
        "actions": [
            {
                "action": "12-lead ECG",
                "urgency": Urgency.URGENT,
                "status": "pending",
                "details": "Capture rhythm"
            },
            {
                "action": "Take vital signs",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "Check for tachycardia/bradycardia"
            }
        ],
        "pre_appointment_tests": [
            {
                "test": "24-hour Holter monitor",
                "max_age_days": 30,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Capture rhythm abnormalities"
            },
            {
                "test": "Thyroid function tests",
                "max_age_days": 90,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Rule out hyperthyroidism"
            }
        ]
    },

    "syncope": {
        "name": "Syncope/Fainting Protocol",
        "priority": ProtocolPriority.URGENT,
        "triggers": {
            "symptoms": [
                "syncope",
                "fainting",
                "passed out",
                "lost consciousness"
            ],
            "red_flags": [
                "during exertion",
                "no warning",
                "family history sudden death",
                "occurred while sitting/lying"
            ]
        },
        "actions": [
            {
                "action": "12-lead ECG",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "STAT - rule out arrhythmia, prolonged QT"
            },
            {
                "action": "Orthostatic vital signs",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "BP/HR lying, sitting, standing"
            },
            {
                "action": "Point-of-care glucose",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "Rule out hypoglycemia"
            }
        ],
        "pre_appointment_tests": [
            {
                "test": "Echocardiogram",
                "max_age_days": 30,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Rule out structural heart disease"
            },
            {
                "test": "24-hour Holter or Event Monitor",
                "max_age_days": 30,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Capture potential arrhythmias"
            }
        ]
    },

    "hypertension_followup": {
        "name": "Hypertension Follow-up Protocol",
        "priority": ProtocolPriority.ROUTINE,
        "triggers": {
            "conditions": ["Hypertension", "High blood pressure"],
            "visit_type": ["follow_up", "routine"]
        },
        "actions": [
            {
                "action": "Blood pressure check",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "Both arms, repeat if elevated"
            }
        ],
        "pre_appointment_tests": [
            {
                "test": "Basic Metabolic Panel",
                "max_age_days": 90,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Monitor kidney function (ACE inhibitors)"
            },
            {
                "test": "Lipid Panel",
                "max_age_days": 180,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Cardiovascular risk assessment"
            }
        ]
    },

    "diabetes_followup": {
        "name": "Diabetes Follow-up Protocol",
        "priority": ProtocolPriority.ROUTINE,
        "triggers": {
            "conditions": ["Type 2 Diabetes", "Type 1 Diabetes", "Diabetes"],
            "visit_type": ["follow_up", "routine"]
        },
        "actions": [
            {
                "action": "Point-of-care glucose",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "Fasting if possible"
            },
            {
                "action": "Blood pressure check",
                "urgency": Urgency.IMMEDIATE,
                "status": "pending",
                "details": "Diabetics at high risk for HTN"
            }
        ],
        "pre_appointment_tests": [
            {
                "test": "HbA1c",
                "max_age_days": 90,
                "urgency": "before_appointment",
                "can_schedule_without": False,
                "reason": "Essential for diabetes management"
            },
            {
                "test": "Basic Metabolic Panel",
                "max_age_days": 180,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Monitor kidney function"
            },
            {
                "test": "Lipid Panel",
                "max_age_days": 180,
                "urgency": "routine",
                "can_schedule_without": True,
                "reason": "Cardiovascular risk in diabetics"
            }
        ]
    }
}


# Provider-Specific Protocol Overrides
PROVIDER_PROTOCOL_PREFERENCES = {
    "Dr. Alexander Mitchell": {
        "chest_pain": {
            "additional_tests": [
                # Removed High-sensitivity troponin - already have Troponin test in STAT tests
            ],
            "notes": "All chest pain patients need ECG + troponin before I see them. If elevated troponin → ER",
            "appointment_duration": 30
        },
        "new_patient": {
            "required_tests": [
                {
                    "test": "Recent labs",
                    "max_age_days": 30,
                    "reason": "Dr. Mitchell requires recent labs for all new patients"
                }
            ],
            "appointment_duration": 30,
            "notes": "I need 30 min for new patients, 15 min for follow-ups"
        }
    }
}


def get_protocol_for_symptoms(symptoms: List[str], conditions: List[str] = None) -> Optional[Dict]:
    """
    Get the appropriate clinical protocol based on symptoms and conditions.

    Args:
        symptoms: List of symptom descriptions
        conditions: List of existing conditions

    Returns:
        Protocol dictionary if match found, None otherwise
    """
    if conditions is None:
        conditions = []

    symptoms_lower = [s.lower() for s in symptoms]
    conditions_lower = [c.lower() for c in conditions]

    # Check each protocol for trigger matches
    for protocol_key, protocol in CLINICAL_PROTOCOLS.items():
        triggers = protocol.get("triggers", {})

        # Check symptom triggers
        symptom_triggers = [t.lower() for t in triggers.get("symptoms", [])]
        if any(any(trigger in symptom for symptom in symptoms_lower) for trigger in symptom_triggers):
            return {
                "protocol_key": protocol_key,
                **protocol
            }

        # Check condition triggers
        condition_triggers = [t.lower() for t in triggers.get("conditions", [])]
        if any(any(trigger in condition for condition in conditions_lower) for trigger in condition_triggers):
            return {
                "protocol_key": protocol_key,
                **protocol
            }

    return None


def assess_risk_level(
    protocol: Dict,
    patient_age: int,
    patient_conditions: List[str],
    symptoms: List[str]
) -> Dict:
    """
    Assess patient risk level based on protocol criteria.

    Returns:
        Dict with risk_level and risk_factors
    """
    risk_factors = []
    risk_score = 0

    risk_strat = protocol.get("risk_stratification", {})

    # Check age
    age_threshold = risk_strat.get("age_threshold", 65)
    if patient_age >= age_threshold:
        risk_factors.append(f"Age {patient_age} (≥{age_threshold})")
        risk_score += 1

    # Check high-risk conditions
    high_risk_conditions = risk_strat.get("high_risk_conditions", [])
    patient_conditions_lower = [c.lower() for c in patient_conditions]

    for risk_condition in high_risk_conditions:
        if any(risk_condition.lower() in pc for pc in patient_conditions_lower):
            risk_factors.append(risk_condition)
            risk_score += 1

    # Check red flag symptoms
    red_flags = protocol.get("triggers", {}).get("red_flags", [])
    symptoms_lower = [s.lower() for s in symptoms]

    for red_flag in red_flags:
        if any(red_flag.lower() in symptom for symptom in symptoms_lower):
            risk_factors.append(f"Red flag: {red_flag}")
            risk_score += 2  # Red flags count more

    # Determine overall risk level
    if risk_score >= 3:
        risk_level = "HIGH"
    elif risk_score >= 1:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "risk_factors": risk_factors
    }


def get_provider_preferences(provider_name: str, protocol_key: str) -> Optional[Dict]:
    """Get provider-specific preferences for a protocol."""
    provider_prefs = PROVIDER_PROTOCOL_PREFERENCES.get(provider_name, {})
    return provider_prefs.get(protocol_key)
