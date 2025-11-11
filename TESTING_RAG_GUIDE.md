# Testing RAG-Enabled Triage System

## ✅ RAG Status: ENABLED

You have successfully enabled RAG! Here's how to test it.

---

## 🌐 Quick Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Swagger UI** | http://localhost:8002/docs | Interactive API testing (EASIEST) |
| **API Base** | http://localhost:8002 | Main API endpoint |
| **Health Check** | http://localhost:8002/health | Verify backend is running |
| **OpenAPI Schema** | http://localhost:8002/openapi.json | API specification |

---

## 🧪 Test Methods

### **Method 1: Swagger UI (Recommended for Beginners)**

1. **Open browser**: http://localhost:8002/docs
2. **Find endpoint**: Scroll to `POST /api/v1/triage`
3. **Click**: "Try it out"
4. **Paste JSON** (examples below)
5. **Click**: "Execute"
6. **View response** in the Response section

**Watch RAG work in logs**:
```bash
# In another terminal
tail -f backend.log | grep "Category"
```

---

### **Method 2: Test Script (All 5 Cases)**

Run all test cases at once:
```bash
./test_rag_endpoints.sh
```

Or if permission denied:
```bash
chmod +x test_rag_endpoints.sh
./test_rag_endpoints.sh
```

---

### **Method 3: Individual curl Commands**

Copy/paste these commands into your terminal.

---

## 📋 Test Cases

### **Test 1: Thunderclap Headache** 🧠
**Tests**: Specific medical terminology recognition

**JSON for Swagger**:
```json
{
  "message": "I have the worst headache of my life. It came on suddenly, like a thunderclap, and reached maximum intensity within seconds. I'm also feeling nauseous and have a stiff neck."
}
```

**curl command**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have the worst headache of my life. It came on suddenly, like a thunderclap, and reached maximum intensity within seconds. I am also feeling nauseous and have a stiff neck."
  }' | jq .
```

**Expected RAG Retrieval**:
```
Category: Headache, Distance: ~0.68
```

**Expected Priority**: `EMERGENCY`

**What RAG Should Retrieve**:
- Thunderclap headache = possible subarachnoid hemorrhage
- "Worst headache of life" red flag
- Nuchal rigidity (stiff neck) warning

---

### **Test 2: Chest Pain (ACS)** ❤️
**Tests**: Cardiac emergency recognition

**JSON for Swagger**:
```json
{
  "message": "I'm having crushing chest pain that's radiating to my left arm and jaw. I'm sweating profusely and feel nauseous. I'm 55 years old with diabetes and high blood pressure."
}
```

**curl command**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am having crushing chest pain that is radiating to my left arm and jaw. I am sweating profusely and feel nauseous. I am 55 years old with diabetes and high blood pressure."
  }' | jq .
```

**Expected RAG Retrieval**:
```
Category: Chest Pain, Distance: ~0.65
```

**Expected Priority**: `EMERGENCY`

**What RAG Should Retrieve**:
- ACS red flags (crushing pain, radiation, diaphoresis)
- Cardiac risk factors (age, diabetes, HTN)
- Acute MI warning signs

---

### **Test 3: Stroke (FAST Protocol)** 🧠
**Tests**: FAST protocol recognition

**JSON for Swagger**:
```json
{
  "message": "My wife's face is drooping on one side, her arm is weak when she tries to lift it, and she's having trouble speaking clearly. This started about 30 minutes ago."
}
```

**curl command**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My wife face is drooping on one side, her arm is weak when she tries to lift it, and she is having trouble speaking clearly. This started about 30 minutes ago."
  }' | jq .
```

**Expected RAG Retrieval**:
```
Category: Stroke/TIA or Dyspnea, Distance: ~1.3
```

**Expected Priority**: `EMERGENCY`

**What RAG Should Retrieve**:
- FAST criteria (Face, Arm, Speech, Time)
- Time-critical intervention window
- Stroke warning signs

---

### **Test 4: Appendicitis** 🩺
**Tests**: Surgical emergency recognition

**JSON for Swagger**:
```json
{
  "message": "I have severe abdominal pain that started around my belly button and moved to my lower right side. I've had nausea, can't eat, and have a low-grade fever."
}
```

**curl command**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe abdominal pain that started around my belly button and moved to my lower right side. I have had nausea, cannot eat, and have a low-grade fever."
  }' | jq .
```

**Expected RAG Retrieval**:
```
Category: Abdominal Pain, Distance: ~0.81
```

**Expected Priority**: `URGENT` or `EMERGENCY`

**What RAG Should Retrieve**:
- McBurney's point (right lower quadrant)
- Migration of pain (classic appendicitis presentation)
- Anorexia + fever red flags

---

### **Test 5: Pediatric Fever** 👶
**Tests**: Age-specific protocols

**JSON for Swagger**:
```json
{
  "message": "My 2-month-old baby has a fever of 100.5°F. She seems a bit fussy but is still feeding."
}
```

**curl command**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My 2-month-old baby has a fever of 100.5 degrees F. She seems a bit fussy but is still feeding."
  }' | jq .
```

**Expected RAG Retrieval**:
```
Category: Fever + Pediatric Triage, Distance: ~0.82
```

**Expected Priority**: `EMERGENCY` or `URGENT`

**What RAG Should Retrieve**:
- Infant <3 months fever = automatic urgent/emergency
- 100.4°F threshold for infants
- Risk of serious bacterial infection

---

## 👀 Verify RAG is Working

### **Check Backend Logs**

Open a second terminal:
```bash
tail -f backend.log
```

When you make a triage request, you should see:

```
INFO:triage_service:Augmenting prompt with RAG-retrieved medical knowledge
INFO:rag_service:Retrieving relevant knowledge for: [your query]...
INFO:rag_service:Retrieved 2 relevant documents
INFO:rag_service:  - Category: [Protocol Name], Distance: [score]
INFO:rag_service:  - Category: [Protocol Name], Distance: [score]
INFO:rag_service:Augmented prompt with 2 knowledge chunks
INFO:triage_service:Requesting AI triage assessment
INFO:httpx:HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"
```

### **Filter for RAG-specific logs**:
```bash
tail -f backend.log | grep -E "(Retrieving|Retrieved|Category|Distance|Augmenting)"
```

---

## 📊 Understanding RAG Output

### **Distance Scores**

| Range | Quality | Example |
|-------|---------|---------|
| 0.0 - 0.7 | 🟢 Excellent match | "Chest Pain" for "crushing chest pain" (0.653) |
| 0.7 - 1.0 | 🟡 Good match | "Headache" for "thunderclap headache" (0.681) |
| 1.0 - 1.5 | 🟠 Moderate match | Related but not exact category |
| > 1.5 | 🔴 Weak match | May retrieve less relevant protocols |

**Lower distance = Better semantic similarity**

### **What RAG Adds to the Response**

Compare these two reasoning outputs:

**Without RAG** (Simple Prompting):
> "The patient is experiencing chest pain which could indicate a heart problem. Recommend seeking medical attention."

**With RAG** (After retrieving Chest Pain protocol):
> "The patient presents with severe chest pain radiating to the left arm and jaw, along with diaphoresis and nausea - these are classic red flags for acute coronary syndrome (ACS). Given the risk factors of age 55, diabetes, and hypertension, immediate emergency evaluation is critical per ACS protocol."

**Difference**: More specific, cites red flags, mentions protocol alignment.

---

## 🔍 Compare RAG vs Non-RAG

Want to see the difference side-by-side?

### **Disable RAG temporarily**:

Edit `.env`:
```bash
USE_RAG=false
```

Restart backend:
```bash
lsof -ti:8002 | xargs kill -9
python main.py
```

### **Run the same test**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have crushing chest pain radiating to my left arm"}' | jq .reasoning
```

### **Re-enable RAG**:
```bash
# .env
USE_RAG=true
```

Restart and run the same test again. Compare the `reasoning` field!

---

## 🚨 Troubleshooting

### **Backend not responding**

**Check if running**:
```bash
lsof -i:8002
```

**Restart backend**:
```bash
lsof -ti:8002 | xargs kill -9
source venv/bin/activate
python main.py
```

### **RAG not retrieving**

**Check logs**:
```bash
tail -30 backend.log | grep -i rag
```

**Should see**:
```
INFO:triage_service:TriageService initialized with RAG enabled
INFO:rag_service:Loaded existing collection with 11 documents
```

**If not**, verify `.env` has:
```
USE_RAG=true
```

### **Curl command not working**

**Try without jq**:
```bash
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have chest pain"}'
```

**Or install jq**:
```bash
brew install jq
```

---

## 📈 Advanced: View Retrieved Protocols

Want to see exactly what knowledge was retrieved?

### **Add logging to see full retrieved content**:

In another terminal, watch for the actual protocol content:
```bash
tail -f backend.log | grep -A 20 "RETRIEVED MEDICAL KNOWLEDGE"
```

This will show you the full medical protocol text that was inserted into the prompt!

---

## 🎯 Success Criteria

After testing, you should see:

✅ Backend logs show "RAG enabled"
✅ Each triage request logs "Retrieving relevant knowledge"
✅ Logs show "Retrieved 2 relevant documents"
✅ Distance scores are < 1.0 for most queries
✅ Triage responses include specific medical reasoning
✅ Priority levels are appropriate (EMERGENCY for chest pain, stroke, etc.)

---

## 📚 Next Steps

1. ✅ Test all 5 cases above
2. ✅ Compare reasoning quality with/without RAG
3. ✅ Try your own custom symptom descriptions
4. ✅ Monitor logs to see which protocols are retrieved
5. ✅ Read full report: `RAG_IMPLEMENTATION_REPORT.md`

---

## 🔗 Quick Links

- **Swagger UI**: http://localhost:8002/docs
- **Full Report**: `RAG_IMPLEMENTATION_REPORT.md`
- **Quick Start**: `RAG_QUICK_START.md`
- **Test Script**: `./test_rag_endpoints.sh`
- **Medical Protocols**: `medical_knowledge_base.py`

---

**Happy Testing! 🚀**

The RAG system is now enhancing every triage decision with curated medical knowledge.
