# 🎯 Swagger UI Testing Guide - Step by Step

## 📍 Open Swagger UI

**Click this URL**: http://localhost:8002/docs

---

## 🎨 What You'll See

When Swagger UI loads, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║  FHIR Chat API - 1.0.0                                     ║
║  API for patient data retrieval and chat-based symptom     ║
║  extraction                                                 ║
╚════════════════════════════════════════════════════════════╝

📍 Servers
   http://localhost:8002

🔽 default
   ├─ GET  /                          Root endpoint
   ├─ GET  /health                    Health check
   ├─ GET  /api/v1/patients/{id}      Get patient history
   ├─ POST /api/v1/chat               Chat endpoint
   ├─ POST /api/v1/extract-symptoms   Extract symptoms
   ├─ GET  /api/v1/patients/{id}/demographics
   ├─ GET  /api/v1/patients/{id}/conditions
   ├─ GET  /api/v1/patients/{id}/medications
   ├─ GET  /api/v1/patients/{id}/allergies
   └─ POST /api/v1/triage             🎯 Perform triage ← START HERE
```

---

## 🚀 Let's Test Triage with Patient ID

### Step 1: Find the Triage Endpoint

Scroll down and look for the **green POST button** that says:

```
POST /api/v1/triage
Perform triage assessment
```

**Click on it** to expand.

---

### Step 2: Click "Try it out"

You'll see a blue button on the right side:

```
┌─────────────────────────────────────────────┐
│                                             │
│  POST /api/v1/triage                        │
│  Perform triage assessment                  │
│                                             │
│              [Try it out] ← CLICK THIS      │
└─────────────────────────────────────────────┘
```

---

### Step 3: Enter Request Body

After clicking "Try it out", you'll see an editable text box with example JSON.

**CLEAR IT** and paste this:

```json
{
  "message": "I have severe headaches and dizziness for 3 days. Worse in morning with nausea.",
  "patient_id": "47936371",
  "symptoms": null
}
```

It should look like this:

```
┌─────────────────────────────────────────────┐
│ Request body                                 │
│ application/json                             │
│ ┌─────────────────────────────────────────┐ │
│ │ {                                       │ │
│ │   "message": "I have severe headaches   │ │
│ │     and dizziness for 3 days. Worse in  │ │
│ │     morning with nausea.",              │ │
│ │   "patient_id": "47936371",             │ │
│ │   "symptoms": null                      │ │
│ │ }                                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│              [Execute] ← CLICK THIS         │
└─────────────────────────────────────────────┘
```

---

### Step 4: Click "Execute"

Click the big blue **Execute** button.

You'll see a loading spinner, then after 2-5 seconds...

---

### Step 5: View the Response! 🎉

Scroll down to see the response. You should see:

```
┌─────────────────────────────────────────────┐
│ Server response                              │
├─────────────────────────────────────────────┤
│ Code: 200                                    │
│ Details                                      │
│                                              │
│ Response body                                │
│ {                                            │
│   "priority": "urgent",                      │
│   "reasoning": "The patient's severe         │
│      headaches, dizziness lasting for 3      │
│      days, and worsening in the morning      │
│      along with nausea are concerning        │
│      symptoms...",                           │
│   "confidence": "high",                      │
│   "red_flags": [                             │
│     "severe headaches",                      │
│     "dizziness for 3 days",                  │
│     "worsening in the morning",              │
│     "nausea"                                 │
│   ],                                         │
│   "recommendations": {                       │
│     "immediate_action": "Seek medical        │
│        attention immediately...",            │
│     "care_level": "Urgent Care",             │
│     "timeframe": "Within a few hours",       │
│     "warning_signs": [...]                   │
│   },                                         │
│   "extracted_symptoms": [                    │
│     {                                        │
│       "symptom": "headache",                 │
│       "severity": "severe",                  │
│       "duration": "3 days",                  │
│       "location": null                       │
│     },                                       │
│     {                                        │
│       "symptom": "dizziness",                │
│       "severity": null,                      │
│       "duration": "3 days",                  │
│       "location": null                       │
│     },                                       │
│     {                                        │
│       "symptom": "nausea",                   │
│       "severity": null,                      │
│       "duration": null,                      │
│       "location": null                       │
│     }                                        │
│   ],                                         │
│   "patient_context": {                       │
│     "patient": {                             │
│       "id": "47936371",                      │
│       "name": "Aage Test",                   │
│       "gender": "male",                      │
│       "birthDate": "2002-10-27",             │
│       "address": null,                       │
│       "telecom": null                        │
│     },                                       │
│     "conditions": [],                        │
│     "observations": [],                      │
│     "medications": [],                       │
│     "allergies": []                          │
│   }                                          │
│ }                                            │
└─────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

Look for these in the response:

1. **Code: 200** - Request successful
2. **"priority": "urgent"** - Triage level assigned
3. **"patient_context"** section with patient details:
   - `"name": "Aage Test"`
   - `"gender": "male"`
   - `"birthDate": "2002-10-27"`
4. **"extracted_symptoms"** - AI extracted the symptoms
5. **"recommendations"** - Care guidance provided

---

## 🧪 More Examples to Try

After your first successful test, try these:

### Test 2: Emergency Case (Should be RED)

```json
{
  "message": "Severe chest pain radiating to left arm and jaw. Difficulty breathing and profuse sweating.",
  "patient_id": "47936371",
  "symptoms": null
}
```

**Expected**: `"priority": "emergency"`

---

### Test 3: Mild Case (Should be GREEN)

```json
{
  "message": "Mild headache and runny nose since this morning. Probably from lack of sleep.",
  "patient_id": "47936371",
  "symptoms": null
}
```

**Expected**: `"priority": "non_urgent"`

---

### Test 4: Without Patient ID

```json
{
  "message": "I have a persistent cough for 2 weeks with mild fever",
  "patient_id": null,
  "symptoms": null
}
```

**Expected**: Response works, but `"patient_context": null`

---

### Test 5: With Pre-supplied Symptoms

```json
{
  "message": "I'm feeling very sick",
  "patient_id": "47936371",
  "symptoms": [
    {
      "symptom": "fever",
      "severity": "high",
      "duration": "2 days",
      "location": null
    },
    {
      "symptom": "cough",
      "severity": "severe",
      "duration": "1 week",
      "location": "chest"
    }
  ]
}
```

**Expected**: Uses your provided symptoms instead of extracting

---

## 🎯 Other Endpoints to Try

### 1. Health Check (GET /health)

**Steps**:
1. Find `GET /health`
2. Click to expand
3. Click "Try it out"
4. Click "Execute"

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 2. Get Patient History (GET /api/v1/patients/{patient_id})

**Steps**:
1. Find `GET /api/v1/patients/{patient_id}`
2. Click "Try it out"
3. In the `patient_id` field, enter: `47936371`
4. Click "Execute"

**Expected Response**: Full patient data from FHIR server

---

### 3. Chat Endpoint (POST /api/v1/chat)

**Steps**:
1. Find `POST /api/v1/chat`
2. Click "Try it out"
3. Paste this:

```json
{
  "message": "I've been feeling very tired and have a persistent cough",
  "patient_id": "47936371",
  "conversation_history": []
}
```

4. Click "Execute"

**Expected Response**: AI chat response + extracted symptoms + patient context

---

### 4. Extract Symptoms Only (POST /api/v1/extract-symptoms)

**Steps**:
1. Find `POST /api/v1/extract-symptoms`
2. Click "Try it out"
3. Paste this:

```json
{
  "text": "I have severe headaches, high fever 103°F, and stiff neck for 2 days",
  "patient_id": null
}
```

4. Click "Execute"

**Expected Response**: List of extracted symptoms without triage

---

## 🎨 Understanding the Color Codes

In Swagger UI, endpoints are color-coded:

- **🟢 GREEN (GET)** - Retrieve data (read-only)
- **🟡 YELLOW (POST)** - Send data / Create new
- **🔵 BLUE (PUT)** - Update existing data
- **🔴 RED (DELETE)** - Remove data

Our API uses:
- 🟢 GET for health checks and patient data retrieval
- 🟡 POST for triage, chat, and symptom extraction

---

## 💡 Pro Tips

1. **Response Time**: Triage requests take 2-5 seconds (AI processing)
2. **Scroll Down**: Response appears below the Execute button
3. **Copy Response**: Click the "Copy" icon to copy the JSON
4. **Try Different Messages**: Experiment with various symptoms
5. **Patient ID Optional**: Works with or without patient ID
6. **Real AI**: This is calling real OpenAI GPT-3.5-turbo API

---

## 🐛 Troubleshooting

### "Failed to fetch" Error
- Backend might not be running
- Check http://localhost:8002/health in a new tab
- Restart backend if needed

### "500 Internal Server Error"
- Check OpenAI API key in `.env` file
- Check backend logs: `tail -50 backend.log`
- OpenAI API might be rate-limited or out of credits

### Slow Response
- Normal! AI processing takes 2-5 seconds
- FHIR server (patient data) can be slow (public server)

### Empty Patient Context
- Patient ID might not exist in FHIR server
- Try our verified ID: `47936371`
- Or try without patient_id (set to null)

---

## 🎉 Success!

When you see a response with:
- ✅ Code 200
- ✅ Priority level (emergency/urgent/non_urgent)
- ✅ Extracted symptoms
- ✅ Recommendations
- ✅ Patient context (if patient_id provided)

**You've successfully tested the Medical Triage API!** 🚀

---

## 📸 What to Look For

**Priority Levels**:
- `"priority": "emergency"` - Red flag symptoms (chest pain, breathing difficulty)
- `"priority": "urgent"` - Needs prompt attention (high fever, severe pain)
- `"priority": "non_urgent"` - Can wait (mild symptoms)

**Patient Context**:
- Should show Aage Test's information when using patient_id: "47936371"
- Name, gender, birthdate included
- Medical history (conditions, meds, allergies) if available

**Extracted Symptoms**:
- AI parses your message and extracts structured symptom data
- Includes severity, duration, location when mentioned

---

**Ready? Open Swagger now!**

## 🔗 http://localhost:8002/docs

Start with the `/api/v1/triage` endpoint and the example I provided above! 🎯
