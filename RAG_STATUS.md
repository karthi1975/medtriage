# RAG (Retrieval Augmented Generation) Status

## Current Status: ✅ ENABLED

RAG is currently **enabled** in the system as configured in `.env`:
```
USE_RAG=true
```

## What is RAG in this System?

RAG enhances the medical triage system by retrieving relevant clinical guidelines and medical knowledge to improve triage accuracy. When a patient describes symptoms, the system:

1. **Retrieves** relevant medical guidelines from the knowledge base
2. **Augments** the AI prompt with this clinical knowledge
3. **Generates** more accurate and evidence-based triage recommendations

## RAG Architecture

```
User Symptoms
    ↓
Vector Similarity Search (ChromaDB)
    ↓
Retrieve Top-N Relevant Guidelines
    ↓
Combine with User Query
    ↓
Enhanced AI Triage Assessment
```

## Key Files for RAG Implementation

### 1. Core RAG Service
- **File**: `rag_service.py`
- **Purpose**: Main RAG implementation using ChromaDB for vector search
- **Key Components**:
  - `RAGService` class - manages vector database and retrieval
  - `retrieve_relevant_knowledge()` - finds relevant medical guidelines
  - `augment_prompt_with_knowledge()` - enhances prompts with retrieved info
  - Embedding Model: `all-MiniLM-L6-v2` (SentenceTransformers)

### 2. Medical Knowledge Base
- **File**: `medical_knowledge_base.py`
- **Purpose**: Contains clinical triage guidelines and protocols
- **Content Categories**:
  1. Chest Pain (Emergency cardiac protocols, ACS red flags)
  2. Headache (Thunderclap headache, meningitis, stroke warnings)
  3. Fever (Temperature thresholds, age-specific guidelines)
  4. Abdominal Pain (Appendicitis, ectopic pregnancy protocols)
  5. Dyspnea/Shortness of Breath (Pulmonary embolism, asthma)
  6. Stroke/TIA (F.A.S.T. protocol, neurological emergencies)
  7. Pediatric Triage (Infant-specific guidelines, dehydration)
  8. Trauma (Head injury, fractures, ATLS guidelines)
  9. Allergic Reactions (Anaphylaxis recognition, EpiPen use)
  10. Mental Health (Suicide risk assessment, psychiatric emergencies)
  11. Poisoning/Overdose (Acetaminophen, opioid overdose protocols)

**Total Knowledge Documents**: 10 clinical guideline categories

### 3. Triage Service Integration
- **File**: `triage_service.py`
- **Purpose**: Integrates RAG into triage decision-making
- **How it uses RAG**:
  - Checks `USE_RAG` environment variable
  - Retrieves relevant guidelines based on symptoms
  - Augments triage prompts with clinical knowledge
  - Provides evidence-based recommendations

### 4. Configuration
- **File**: `.env`
- **RAG Settings**:
  ```
  USE_RAG=true
  ```

### 5. Vector Database Storage
- **Directory**: `./chroma_db/`
- **Status**: Not yet initialized (will be created on first run)
- **Technology**: ChromaDB (persistent vector store)
- **Function**: Stores embeddings of medical knowledge for fast similarity search

## How RAG Works in Practice

### Example 1: Chest Pain Query

**User Input**: "I have crushing chest pain radiating to my left arm"

**RAG Process**:
1. Vector search finds "Chest Pain" guidelines from knowledge base
2. Retrieves protocols about ACS (Acute Coronary Syndrome)
3. Augments prompt with emergency cardiac protocols
4. AI generates response using clinical guidelines

**Result**: More accurate emergency classification with specific red flags

### Example 2: Pediatric Fever

**User Input**: "My 2-month-old baby has a fever of 100.6°F"

**RAG Process**:
1. Retrieves "Pediatric Triage" and "Fever" guidelines
2. Finds specific protocol: "Infant <3 months: ANY fever >100.4°F = EMERGENCY"
3. Augments triage assessment with age-specific rules

**Result**: Correct emergency classification based on clinical guidelines

## Testing RAG Functionality

### Check RAG Status via API

```bash
# The triage endpoint automatically uses RAG when enabled
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have crushing chest pain radiating to my left arm and jaw. I am sweating profusely."
  }'
```

### Expected Behavior with RAG Enabled:
- Response includes specific clinical red flags from guidelines
- Recommendations cite specific protocols (e.g., "ACS Guidelines", "FAST protocol")
- More detailed and evidence-based reasoning
- Better detection of emergency conditions

### Expected Behavior with RAG Disabled:
- General medical advice without specific protocol citations
- Less detailed clinical reasoning
- May miss subtle but important clinical red flags

## Performance Characteristics

### Vector Database:
- **Embedding Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Search Speed**: ~10-50ms for similarity search
- **Storage**: Persistent on disk (ChromaDB)
- **Default Retrieval**: Top 2-3 most relevant guidelines

### Knowledge Base Size:
- **Documents**: 10 clinical categories
- **Total Content**: ~5,000+ words of clinical guidelines
- **Sources**: Based on AHA, ACP, ACEP, CDC guidelines

## Advantages of RAG in Medical Triage

1. **Evidence-Based**: Responses grounded in clinical guidelines
2. **Consistency**: Same symptoms retrieve same protocols
3. **Transparency**: Can trace recommendations to specific guidelines
4. **Updatable**: Knowledge base can be extended without retraining
5. **Cost-Effective**: No need to fine-tune large language models
6. **Safety**: Reduces hallucinations by grounding in medical literature

## Disabling RAG

To disable RAG and use the AI model without retrieval:

```bash
# Edit .env file
USE_RAG=false

# Restart the server
docker-compose restart backend
```

## Future Enhancements

Potential improvements to the RAG system:

1. **Larger Knowledge Base**: Add more clinical guidelines and protocols
2. **External Sources**: Integrate PubMed, UpToDate, clinical databases
3. **Multi-modal RAG**: Include medical images, diagrams
4. **Hybrid Search**: Combine vector search with keyword search
5. **Relevance Feedback**: Track which guidelines led to better outcomes
6. **Citation Links**: Provide direct links to source medical literature

## References

- ChromaDB: https://www.trychroma.com/
- SentenceTransformers: https://www.sbert.net/
- Medical Guidelines: AHA, ACEP, CDC, American Stroke Association
