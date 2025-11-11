# Quick Start Guide - Medical Triage System

## Get Started in 5 Minutes

This guide will get you up and running with the Medical Triage System quickly.

## Prerequisites

Before you begin, ensure you have:

1. **Python 3.8+** installed
2. **Node.js 16+** and npm installed
3. **Docker** (optional, but recommended)
4. **OpenAI API Key** (required)

## Step-by-Step Setup

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (you'll need it in the next step)

### Step 2: Configure Backend

1. **Navigate to project directory**:
```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
```

2. **Update the .env file with your OpenAI API key**:
```bash
# Edit .env file
echo "OPENAI_API_KEY=your-api-key-here" > .env
echo "OPENAI_MODEL=gpt-3.5-turbo" >> .env
echo "FHIR_SERVER_URL=https://hapi.fhir.org/baseR4" >> .env
```

Replace `your-api-key-here` with your actual OpenAI API key.

### Step 3: Start Backend (Choose One Method)

#### Option A: Using Docker (Recommended)

```bash
# Build and start the container
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The backend will be available at http://localhost:8002

#### Option B: Without Docker

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

### Step 4: Start Frontend

Open a **new terminal window** and run:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm start
```

The frontend will automatically open at http://localhost:3000

### Step 5: Test the System

1. **Open your browser** to http://localhost:3000

2. **Verify API connection**: You should see a green "Connected to API" indicator

3. **Try a test query**:
   - Type: "I have a severe headache and fever for 3 days"
   - Click Send
   - Wait for the triage assessment to appear

4. **Review the results**:
   - Priority level (Emergency/Urgent/Semi-Urgent/Non-Urgent)
   - Assessment reasoning
   - Care recommendations
   - Warning signs

## What You Should See

### Frontend (http://localhost:3000)
- Medical Triage System header with gradient purple background
- Green "Connected to API" status indicator
- Chat interface on the left
- Empty results panel on the right (until you send a message)

### Backend API (http://localhost:8002)
- Health check: http://localhost:8002/health
- API documentation: http://localhost:8002/docs
- Interactive API explorer: http://localhost:8002/redoc

## Example Usage Scenarios

### Scenario 1: Emergency Symptoms
**Input**: "I'm experiencing severe chest pain and difficulty breathing"
**Expected Result**: Emergency priority with immediate ER recommendation

### Scenario 2: With Patient Context
**Input**: "I have a persistent cough for 2 weeks"
**Patient ID**: "example" (use HAPI FHIR test patient)
**Expected Result**: Triage with patient history consideration

### Scenario 3: Multiple Symptoms
**Input**: "I have a moderate headache in my forehead for 3 days, mild nausea, and sensitivity to light"
**Expected Result**: Detailed symptom extraction with appropriate triage level

## Common Issues & Solutions

### Issue: "Cannot connect to backend API"

**Solution**:
```bash
# Check if backend is running
curl http://localhost:8002/health

# If not running, start it:
docker-compose up  # if using Docker
# OR
python main.py     # if running locally
```

### Issue: "OpenAI API Error"

**Solution**:
1. Verify your API key in `.env` file
2. Check you have OpenAI credits available
3. Ensure no extra spaces in the API key

### Issue: "Port already in use"

**Backend (Port 8002)**:
```bash
# Find what's using the port
lsof -i :8002

# Kill the process or use a different port in docker-compose.yml
```

**Frontend (Port 3000)**:
```bash
# Use a different port
PORT=3001 npm start
```

### Issue: "Module not found" errors

**Backend**:
```bash
pip install -r requirements.txt
```

**Frontend**:
```bash
cd frontend
rm -rf node_modules
npm install
```

## Stopping the Application

### Stop Backend

**If using Docker**:
```bash
docker-compose down
```

**If running locally**:
Press `Ctrl+C` in the terminal running Python

### Stop Frontend

Press `Ctrl+C` in the terminal running npm

## Next Steps

1. **Read Full Documentation**: Check `README.md` for detailed information
2. **Review Implementation**: See `IMPLEMENTATION_COMPLETE.md` for technical details
3. **Explore API**: Visit http://localhost:8002/docs for interactive API documentation
4. **Test Thoroughly**: Try different symptom scenarios
5. **Review Code**: Explore the codebase to understand the architecture

## Project Structure Quick Reference

```
project/
├── main.py              # Backend API entry point
├── triage_service.py    # Triage algorithm
├── chat_service.py      # Chat & symptom extraction
├── fhir_client.py       # FHIR integration
├── frontend/
│   └── src/
│       ├── App.js       # Main frontend component
│       └── components/  # React components
└── .env                 # Configuration (API keys)
```

## Getting Help

1. **API Documentation**: http://localhost:8002/docs
2. **Check Logs**:
   - Backend: `docker-compose logs -f` (Docker) or check terminal output
   - Frontend: Check browser console (F12)
3. **Review Documentation**: `README.md`, `QUICKSTART.md`, `IMPLEMENTATION_COMPLETE.md`

## Important Notes

- This is an **educational project**, not for real medical use
- Always keep your OpenAI API key secure
- Monitor your OpenAI API usage to avoid unexpected costs
- The system uses a public FHIR test server (HAPI)

## Ready to Go!

You're all set! The Medical Triage System is now running and ready to assess symptoms.

**Frontend**: http://localhost:3000
**Backend**: http://localhost:8002
**API Docs**: http://localhost:8002/docs

Happy testing!
