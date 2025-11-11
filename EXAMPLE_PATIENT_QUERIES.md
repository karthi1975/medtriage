# 📋 Example Patient Queries - HAPI FHIR Integration

## 🏥 Real Patient IDs from HAPI FHIR Server

Here are real patient IDs you can use for testing:

| Patient ID | Name | Gender | Birth Date | Age |
|------------|------|--------|------------|-----|
| **47936371** | Aage Test | Male | 2002-10-27 | 22 years |
| 47026052 | Karla Nuñez | Female | N/A | N/A |
| 47077394 | Luis Riquelme | Male | N/A | N/A |

**Recommended for Testing**: **47936371** (Aage Test) - has complete data

---

## 🎯 How to Use Patient IDs in the Web UI

### Method 1: Via Frontend UI (http://localhost:3000)

**Currently**, the frontend doesn't have a visible patient ID input field, but you can test patient-specific queries via the API.

---

## 🔧 How to Test via API

### Example 1: Get Patient History

```bash
# View patient data
curl http://localhost:8002/api/v1/patients/47936371 | json_pp
```

**Response**:
```json
{
  "patient_id": "47936371",
  "data": {
    "patient": {
      "id": "47936371",
      "name": "Aage Test",
      "gender": "male",
      "birthDate": "2002-10-27"
    },
    "conditions": [],
    "medications": [],
    "allergies": []
  }
}
```

---

### Example 2: Triage with Patient Context

```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe headaches and dizziness for 3 days. Worse in morning with nausea.",
    "patient_id": "47936371",
    "symptoms": null
  }'
```

**What Happens**:
1. ✅ System retrieves patient data (Aage Test, Male, 22 years old)
2. ✅ Analyzes symptoms in context of patient demographics
3. ✅ Provides triage priority: **URGENT**
4. ✅ Extracts symptoms: headache (severe), dizziness, nausea
5. ✅ Recommends: Urgent Care within a few hours
6. ✅ Returns patient context in response

---

### Example 3: Chat with Patient Context

```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been feeling very tired and have a persistent cough for 2 weeks",
    "patient_id": "47936371",
    "conversation_history": []
  }'
```

**Response includes**:
- AI chat response
- Extracted symptoms
- Patient context (demographics, conditions, etc.)

---

## 📝 Example Questions to Ask

### For Patient 47936371 (Aage Test - 22 year old male):

#### 1. **Headache Query**
**Message**:
```
I have been experiencing severe headaches and dizziness for the past 3 days.
The headaches are worse in the morning and I sometimes feel nauseous.
```

**Expected Results**:
- Priority: **URGENT**
- Care Level: Urgent Care
- Timeframe: Within a few hours
- Symptoms: headache (severe, 3 days), dizziness, nausea

---

#### 2. **Respiratory Query**
**Message**:
```
I have a persistent cough for 2 weeks with mild fever and fatigue.
Sometimes I feel short of breath when climbing stairs.
```

**Expected Results**:
- Priority: **URGENT** (persistent symptoms + shortness of breath)
- Care Level: Urgent Care or Primary Care
- Symptoms: cough (2 weeks), fever (mild), fatigue, shortness of breath

---

#### 3. **Emergency Query**
**Message**:
```
I have severe chest pain that radiates to my left arm and jaw.
I'm sweating profusely and feeling dizzy.
```

**Expected Results**:
- Priority: **EMERGENCY** ⚠️
- Care Level: Emergency Department - IMMEDIATE
- Red Flags: chest pain, radiating pain, sweating, dizziness
- Recommendation: Call 911 or go to ER immediately

---

#### 4. **Mild Query**
**Message**:
```
I have a mild headache that started this morning.
I think it's from not getting enough sleep last night.
```

**Expected Results**:
- Priority: **NON_URGENT**
- Care Level: Self-care or Primary Care
- Timeframe: Within a few days if persists
- Symptoms: headache (mild, today)

---

## 🧪 Testing in Browser Console

Open http://localhost:3000, then open browser console (F12) and run:

### Test 1: Simple Triage with Patient
```javascript
fetch('http://localhost:8002/api/v1/triage', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: "I have severe chest pain and difficulty breathing",
    patient_id: "47936371",
    symptoms: null
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('Priority:', data.priority);
    console.log('Care Level:', data.recommendations.care_level);
    console.log('Patient:', data.patient_context.patient.name);
    console.log('Full Response:', data);
  });
```

### Test 2: Chat with Patient Context
```javascript
fetch('http://localhost:8002/api/v1/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: "I have been feeling very tired lately",
    patient_id: "47936371",
    conversation_history: []
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('AI Response:', data.response);
    console.log('Symptoms:', data.extracted_symptoms);
    console.log('Patient:', data.patient_context.patient.name);
  });
```

---

## 📊 Using Swagger UI (Easiest Method!)

**Go to**: http://localhost:8002/docs

### Step-by-Step:

1. **Find the `/api/v1/triage` endpoint**
2. **Click "Try it out"**
3. **Fill in the request body**:
```json
{
  "message": "I have severe headaches and dizziness for 3 days",
  "patient_id": "47936371",
  "symptoms": null
}
```
4. **Click "Execute"**
5. **See the response** with patient context included!

---

## 🎭 Different Scenarios to Test

### Scenario 1: Emergency (Should be RED - EMERGENCY)
```json
{
  "message": "Severe chest pain radiating to left arm, difficulty breathing, sweating",
  "patient_id": "47936371"
}
```

### Scenario 2: Urgent (Should be ORANGE - URGENT)
```json
{
  "message": "High fever 103°F for 2 days, severe headache, stiff neck",
  "patient_id": "47936371"
}
```

### Scenario 3: Non-Urgent (Should be GREEN - NON_URGENT)
```json
{
  "message": "Mild headache and runny nose since this morning",
  "patient_id": "47936371"
}
```

### Scenario 4: Multi-Symptom Complex Case
```json
{
  "message": "I've had a persistent cough for 2 weeks, low-grade fever, night sweats, and unexplained weight loss of 10 pounds",
  "patient_id": "47936371"
}
```

---

## 🔍 What Patient Context Provides

When you include a `patient_id`, the system:

1. ✅ **Retrieves patient demographics** (name, age, gender)
2. ✅ **Fetches medical history** (conditions, medications, allergies)
3. ✅ **Contextualizes triage** (age/gender-specific considerations)
4. ✅ **Enhances AI responses** (personalized recommendations)
5. ✅ **Returns full patient data** in response

**Example**: A 22-year-old male with chest pain might get different recommendations than a 65-year-old female with the same symptoms.

---

## 📋 Quick Reference

| Endpoint | Method | Purpose | Include Patient ID? |
|----------|--------|---------|-------------------|
| `/api/v1/triage` | POST | Get triage assessment | ✅ Optional |
| `/api/v1/chat` | POST | Chat with AI | ✅ Optional |
| `/api/v1/patients/{id}` | GET | Get patient data | ✅ Required |
| `/api/v1/extract-symptoms` | POST | Extract symptoms only | ✅ Optional |
| `/health` | GET | Check API status | ❌ No |

---

## 🎯 Best Test Patient

**Use Patient ID: `47936371`** (Aage Test)
- Has complete demographic data
- Male, 22 years old
- Good for testing various scenarios
- Publicly available on HAPI FHIR test server

---

## 💡 Pro Tips

1. **Without Patient ID**: System still works, just no patient context
2. **With Invalid Patient ID**: System gracefully handles, returns null patient context
3. **Patient ID is optional**: All endpoints work with or without it
4. **FHIR Server Slow?**: Public HAPI server can be slow, patient data fetch may timeout
5. **Best Testing**: Use Swagger UI at http://localhost:8002/docs for interactive testing

---

## 🚀 Quick Start Command

Copy-paste this into your terminal to test right now:

```bash
# Test triage with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "I have severe headaches and dizziness for 3 days. Worse in morning with nausea.", "patient_id": "47936371"}' \
  | python3 -m json.tool
```

**You'll see**: Full triage assessment with patient Aage Test's information included!

---

**Happy Testing! 🎉**
