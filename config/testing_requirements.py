"""
Testing Requirements Configuration
Defines required and recommended tests per specialty before appointments
"""

from typing import Dict, List, Any

# Specialty-specific testing requirements
# Structure: specialty_name -> visit_type -> {required: [...], recommended: [...]}
# Each test has: type, max_age_days, optional loinc_codes or dicom_modality
TESTING_REQUIREMENTS: Dict[str, Dict[str, Dict[str, List[Dict[str, Any]]]]] = {
    "Cardiology": {
        "new_patient": {
            "required": [
                {
                    "type": "ECG",
                    "max_age_days": 180,
                    "loinc_codes": ["11524-6"],
                    "description": "Electrocardiogram (12-lead)"
                },
                {
                    "type": "Lipid Panel",
                    "max_age_days": 90,
                    "loinc_codes": ["24331-1", "2093-3", "2089-1", "2085-9"],
                    "description": "Total cholesterol, LDL, HDL, Triglycerides"
                },
                {
                    "type": "Vitals",
                    "max_age_days": 30,
                    "description": "Blood pressure, heart rate, weight"
                }
            ],
            "recommended": [
                {
                    "type": "CBC",
                    "max_age_days": 90,
                    "loinc_codes": ["718-7", "789-8", "785-6"],
                    "description": "Complete blood count"
                },
                {
                    "type": "BMP",
                    "max_age_days": 90,
                    "loinc_codes": ["2345-7", "2160-0", "6299-2"],
                    "description": "Basic metabolic panel"
                }
            ]
        },
        "followup": {
            "required": [
                {
                    "type": "Vitals",
                    "max_age_days": 30,
                    "description": "Blood pressure, heart rate, weight"
                }
            ],
            "recommended": []
        },
        "urgent": {
            "required": [
                {
                    "type": "ECG",
                    "max_age_days": 1,
                    "urgent": True,
                    "loinc_codes": ["11524-6"],
                    "description": "Urgent ECG required same-day"
                },
                {
                    "type": "Troponin",
                    "max_age_days": 1,
                    "urgent": True,
                    "loinc_codes": ["10839-9", "42757-5"],
                    "description": "Cardiac troponin (urgent)"
                },
                {
                    "type": "BNP",
                    "max_age_days": 1,
                    "urgent": True,
                    "loinc_codes": ["30934-4", "33762-6"],
                    "description": "B-type natriuretic peptide"
                }
            ],
            "recommended": []
        }
    },

    "Orthopedics": {
        "new_patient": {
            "required": [
                {
                    "type": "X-Ray",
                    "max_age_days": 90,
                    "dicom_modality": "DX",
                    "description": "Radiograph of affected area"
                }
            ],
            "recommended": [
                {
                    "type": "Vitamin D",
                    "max_age_days": 180,
                    "loinc_codes": ["1989-3", "14635-7"],
                    "description": "25-hydroxyvitamin D"
                },
                {
                    "type": "Calcium",
                    "max_age_days": 180,
                    "loinc_codes": ["17861-6"],
                    "description": "Serum calcium"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [
                {
                    "type": "X-Ray",
                    "max_age_days": 1,
                    "urgent": True,
                    "dicom_modality": "DX",
                    "description": "Urgent radiograph"
                }
            ],
            "recommended": []
        }
    },

    "Neurology": {
        "new_patient": {
            "required": [
                {
                    "type": "Vitals",
                    "max_age_days": 30,
                    "description": "Blood pressure, pulse"
                },
                {
                    "type": "CBC",
                    "max_age_days": 90,
                    "loinc_codes": ["718-7", "789-8"],
                    "description": "Complete blood count"
                }
            ],
            "recommended": [
                {
                    "type": "MRI Brain",
                    "max_age_days": 180,
                    "dicom_modality": "MR",
                    "description": "Brain MRI for chronic conditions"
                },
                {
                    "type": "Vitamin B12",
                    "max_age_days": 180,
                    "loinc_codes": ["2132-9"],
                    "description": "Serum B12 level"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [
                {
                    "type": "CT Head",
                    "max_age_days": 1,
                    "urgent": True,
                    "dicom_modality": "CT",
                    "description": "Urgent head CT"
                }
            ],
            "recommended": []
        }
    },

    "Gastroenterology": {
        "new_patient": {
            "required": [
                {
                    "type": "CBC",
                    "max_age_days": 90,
                    "loinc_codes": ["718-7"],
                    "description": "Complete blood count"
                },
                {
                    "type": "Liver Function Tests",
                    "max_age_days": 90,
                    "loinc_codes": ["1742-6", "1920-8", "6768-6"],
                    "description": "ALT, AST, Alkaline phosphatase"
                }
            ],
            "recommended": [
                {
                    "type": "H. pylori Test",
                    "max_age_days": 180,
                    "loinc_codes": ["13955-0"],
                    "description": "Helicobacter pylori antibody"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Pulmonology": {
        "new_patient": {
            "required": [
                {
                    "type": "Chest X-Ray",
                    "max_age_days": 90,
                    "dicom_modality": "DX",
                    "description": "Chest radiograph PA and lateral"
                },
                {
                    "type": "Pulse Oximetry",
                    "max_age_days": 30,
                    "description": "Oxygen saturation"
                }
            ],
            "recommended": [
                {
                    "type": "Pulmonary Function Tests",
                    "max_age_days": 180,
                    "description": "Spirometry"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [
                {
                    "type": "Chest X-Ray",
                    "max_age_days": 1,
                    "urgent": True,
                    "dicom_modality": "DX",
                    "description": "Urgent chest X-ray"
                }
            ],
            "recommended": []
        }
    },

    "Endocrinology": {
        "new_patient": {
            "required": [
                {
                    "type": "HbA1c",
                    "max_age_days": 90,
                    "loinc_codes": ["4548-4"],
                    "description": "Hemoglobin A1c"
                },
                {
                    "type": "Fasting Glucose",
                    "max_age_days": 90,
                    "loinc_codes": ["1558-6"],
                    "description": "Fasting blood glucose"
                },
                {
                    "type": "TSH",
                    "max_age_days": 180,
                    "loinc_codes": ["3016-3"],
                    "description": "Thyroid stimulating hormone"
                }
            ],
            "recommended": [
                {
                    "type": "Lipid Panel",
                    "max_age_days": 90,
                    "loinc_codes": ["2093-3", "2089-1"],
                    "description": "Cholesterol panel"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Nephrology": {
        "new_patient": {
            "required": [
                {
                    "type": "BMP",
                    "max_age_days": 90,
                    "loinc_codes": ["2160-0", "2345-7", "6299-2"],
                    "description": "Creatinine, BUN, electrolytes"
                },
                {
                    "type": "Urinalysis",
                    "max_age_days": 90,
                    "loinc_codes": ["5792-7", "5804-0"],
                    "description": "Complete urinalysis with microscopy"
                },
                {
                    "type": "eGFR",
                    "max_age_days": 90,
                    "loinc_codes": ["33914-3"],
                    "description": "Estimated glomerular filtration rate"
                }
            ],
            "recommended": [
                {
                    "type": "Microalbumin/Creatinine Ratio",
                    "max_age_days": 180,
                    "loinc_codes": ["14959-1"],
                    "description": "Urine microalbumin/creatinine ratio"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Oncology": {
        "new_patient": {
            "required": [
                {
                    "type": "CBC with Differential",
                    "max_age_days": 30,
                    "loinc_codes": ["718-7", "789-8", "785-6", "770-8"],
                    "description": "Complete blood count with differential"
                },
                {
                    "type": "CMP",
                    "max_age_days": 30,
                    "loinc_codes": ["24323-8"],
                    "description": "Comprehensive metabolic panel"
                }
            ],
            "recommended": [
                {
                    "type": "CT Scan",
                    "max_age_days": 90,
                    "dicom_modality": "CT",
                    "description": "CT imaging of affected area"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Rheumatology": {
        "new_patient": {
            "required": [
                {
                    "type": "CBC",
                    "max_age_days": 90,
                    "loinc_codes": ["718-7"],
                    "description": "Complete blood count"
                },
                {
                    "type": "ESR",
                    "max_age_days": 90,
                    "loinc_codes": ["30341-2"],
                    "description": "Erythrocyte sedimentation rate"
                },
                {
                    "type": "CRP",
                    "max_age_days": 90,
                    "loinc_codes": ["1988-5"],
                    "description": "C-reactive protein"
                }
            ],
            "recommended": [
                {
                    "type": "RF",
                    "max_age_days": 180,
                    "loinc_codes": ["11572-5"],
                    "description": "Rheumatoid factor"
                },
                {
                    "type": "ANA",
                    "max_age_days": 180,
                    "loinc_codes": ["13502-8"],
                    "description": "Antinuclear antibody"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Dermatology": {
        "new_patient": {
            "required": [],
            "recommended": []
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Ophthalmology": {
        "new_patient": {
            "required": [],
            "recommended": [
                {
                    "type": "Visual Acuity",
                    "max_age_days": 180,
                    "description": "Visual acuity test"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "ENT": {
        "new_patient": {
            "required": [],
            "recommended": [
                {
                    "type": "Hearing Test",
                    "max_age_days": 180,
                    "description": "Audiometry"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Urology": {
        "new_patient": {
            "required": [
                {
                    "type": "Urinalysis",
                    "max_age_days": 90,
                    "loinc_codes": ["5792-7"],
                    "description": "Complete urinalysis"
                }
            ],
            "recommended": [
                {
                    "type": "PSA",
                    "max_age_days": 180,
                    "loinc_codes": ["2857-1"],
                    "description": "Prostate-specific antigen (for males 50+)"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Mental Health": {
        "new_patient": {
            "required": [],
            "recommended": [
                {
                    "type": "TSH",
                    "max_age_days": 180,
                    "loinc_codes": ["3016-3"],
                    "description": "Thyroid function (to rule out medical causes)"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "OB/GYN": {
        "new_patient": {
            "required": [
                {
                    "type": "Pap Smear",
                    "max_age_days": 1095,  # 3 years
                    "description": "Cervical cytology"
                }
            ],
            "recommended": [
                {
                    "type": "HPV Test",
                    "max_age_days": 1825,  # 5 years
                    "description": "HPV DNA test"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Pediatrics": {
        "new_patient": {
            "required": [
                {
                    "type": "Growth Measurements",
                    "max_age_days": 90,
                    "description": "Height, weight, head circumference"
                }
            ],
            "recommended": [
                {
                    "type": "Immunization Record",
                    "max_age_days": 365,
                    "description": "Vaccination history"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Geriatrics": {
        "new_patient": {
            "required": [
                {
                    "type": "CBC",
                    "max_age_days": 90,
                    "loinc_codes": ["718-7"],
                    "description": "Complete blood count"
                },
                {
                    "type": "CMP",
                    "max_age_days": 90,
                    "loinc_codes": ["24323-8"],
                    "description": "Comprehensive metabolic panel"
                },
                {
                    "type": "Vitals",
                    "max_age_days": 30,
                    "description": "Blood pressure, weight, BMI"
                }
            ],
            "recommended": [
                {
                    "type": "Vitamin D",
                    "max_age_days": 180,
                    "loinc_codes": ["1989-3"],
                    "description": "25-hydroxyvitamin D"
                },
                {
                    "type": "Vitamin B12",
                    "max_age_days": 180,
                    "loinc_codes": ["2132-9"],
                    "description": "Serum B12"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Infectious Disease": {
        "new_patient": {
            "required": [
                {
                    "type": "CBC with Differential",
                    "max_age_days": 30,
                    "loinc_codes": ["718-7", "770-8"],
                    "description": "Complete blood count with differential"
                },
                {
                    "type": "CMP",
                    "max_age_days": 30,
                    "loinc_codes": ["24323-8"],
                    "description": "Comprehensive metabolic panel"
                }
            ],
            "recommended": [
                {
                    "type": "HIV Test",
                    "max_age_days": 180,
                    "loinc_codes": ["75622-1"],
                    "description": "HIV screening"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Hematology": {
        "new_patient": {
            "required": [
                {
                    "type": "CBC with Differential",
                    "max_age_days": 30,
                    "loinc_codes": ["718-7", "789-8", "785-6", "770-8"],
                    "description": "Complete blood count with differential"
                },
                {
                    "type": "Peripheral Blood Smear",
                    "max_age_days": 90,
                    "description": "Blood smear review"
                }
            ],
            "recommended": [
                {
                    "type": "Iron Studies",
                    "max_age_days": 90,
                    "loinc_codes": ["2498-4", "2500-7", "2502-3"],
                    "description": "Serum iron, TIBC, ferritin"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Pain Management": {
        "new_patient": {
            "required": [
                {
                    "type": "Urine Drug Screen",
                    "max_age_days": 30,
                    "description": "Urine toxicology"
                }
            ],
            "recommended": [
                {
                    "type": "X-Ray",
                    "max_age_days": 180,
                    "dicom_modality": "DX",
                    "description": "Imaging of painful area"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    },

    "Family Medicine": {
        "new_patient": {
            "required": [
                {
                    "type": "Vitals",
                    "max_age_days": 30,
                    "description": "Blood pressure, heart rate, weight, BMI"
                }
            ],
            "recommended": [
                {
                    "type": "CBC",
                    "max_age_days": 365,
                    "loinc_codes": ["718-7"],
                    "description": "Complete blood count"
                },
                {
                    "type": "Lipid Panel",
                    "max_age_days": 365,
                    "loinc_codes": ["2093-3"],
                    "description": "Cholesterol screening"
                }
            ]
        },
        "followup": {
            "required": [],
            "recommended": []
        },
        "urgent": {
            "required": [],
            "recommended": []
        }
    }
}


def get_requirements_for_specialty(specialty_name: str, visit_type: str = "new_patient", urgency: str = "non-urgent") -> Dict[str, List[Dict[str, Any]]]:
    """
    Get testing requirements for a specific specialty and visit type.

    Args:
        specialty_name: Name of the specialty (e.g., "Cardiology")
        visit_type: Type of visit - "new_patient" or "followup"
        urgency: Priority level - "urgent", "emergency", or "non-urgent"

    Returns:
        Dictionary with 'required' and 'recommended' test lists
    """
    # If urgent or emergency, check for urgent-specific requirements
    if urgency in ["urgent", "emergency"]:
        specialty_reqs = TESTING_REQUIREMENTS.get(specialty_name, {})
        urgent_reqs = specialty_reqs.get("urgent", {})
        if urgent_reqs.get("required") or urgent_reqs.get("recommended"):
            return urgent_reqs

    # Otherwise return standard requirements for visit type
    specialty_reqs = TESTING_REQUIREMENTS.get(specialty_name, {})
    visit_reqs = specialty_reqs.get(visit_type, {"required": [], "recommended": []})

    return visit_reqs


def get_all_specialty_names() -> List[str]:
    """Get list of all configured specialties."""
    return list(TESTING_REQUIREMENTS.keys())
