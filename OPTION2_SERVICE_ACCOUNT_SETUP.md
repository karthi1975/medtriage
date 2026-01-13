# Option 2: Service Account Setup Guide

## Complete Production Setup for Llama 4 API

This guide walks you through setting up a Google Cloud Service Account for production use of the Llama 4 API.

---

## ✅ Prerequisites

- Google Cloud SDK (gcloud) installed ✅
- Access to Google Cloud project: `project-c78515e0-ee8f-4282-a3c` ✅
- Permissions to create service accounts ✅

---

## 📋 Step-by-Step Instructions

### Step 1: Authenticate and Set Project

Open your **local terminal** and run:

```bash
# Login if not already authenticated
gcloud auth login

# Set your project
gcloud config set project project-c78515e0-ee8f-4282-a3c

# Verify current project
gcloud config get-value project
```

**Expected Output:**
```
project-c78515e0-ee8f-4282-a3c
```

---

### Step 2: Create Service Account

```bash
# Create the service account
gcloud iam service-accounts create llama-api-service \
    --description="Service account for Llama 4 API access" \
    --display-name="Llama API Service Account"
```

**Expected Output:**
```
Created service account [llama-api-service].
```

---

### Step 3: Grant Required Permissions

```bash
# Grant AI Platform User role (allows API access)
gcloud projects add-iam-policy-binding project-c78515e0-ee8f-4282-a3c \
    --member="serviceAccount:llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Optional: Grant additional roles if needed
gcloud projects add-iam-policy-binding project-c78515e0-ee8f-4282-a3c \
    --member="serviceAccount:llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com" \
    --role="roles/serviceusage.serviceUsageConsumer"
```

**Expected Output:**
```
Updated IAM policy for project [project-c78515e0-ee8f-4282-a3c].
```

---

### Step 4: Create and Download Service Account Key

```bash
# Create the key file
gcloud iam service-accounts keys create ~/llama-service-account-key.json \
    --iam-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com

# Move the key to your project directory
mv ~/llama-service-account-key.json /Users/karthi/GA_ML_COURSE/CS-6440-O01/project/

# Set proper permissions (read-only for owner)
chmod 400 /Users/karthi/GA_ML_COURSE/CS-6440-O01/project/llama-service-account-key.json
```

**Expected Output:**
```
created key [XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX] of type [json] as [~/llama-service-account-key.json] for [llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com]
```

⚠️ **IMPORTANT SECURITY NOTE:**
- This key file grants access to your Google Cloud resources
- NEVER commit this file to version control
- Keep it secure and private
- It's already added to `.gitignore` ✅

---

### Step 5: Configure Environment Variable

Edit your `.env` file:

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
```

Update the `.env` file to uncomment and set the service account path:

```bash
# Google Cloud AI Platform Configuration
PROJECT_ID=project-c78515e0-ee8f-4282-a3c
ENDPOINT=us-east5-aiplatform.googleapis.com
REGION=us-east5

# Service Account (Production)
GOOGLE_APPLICATION_CREDENTIALS=/app/llama-service-account-key.json
```

---

### Step 6: Test the Service Account (Local)

Before using with Docker, test locally:

```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/Users/karthi/GA_ML_COURSE/CS-6440-O01/project/llama-service-account-key.json

# Run test script
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
python test_llama.py
```

**Expected Output:**
```
============================================================
LLAMA 4 API INTEGRATION TEST SUITE
============================================================

TEST 1: Basic Chat
✅ SUCCESS!

TEST 2: Medical Triage
✅ SUCCESS!

TEST 3: Medical Summary Generation
✅ SUCCESS!

============================================================
TEST SUMMARY
============================================================
Basic Chat: ✅ PASSED
Medical Triage: ✅ PASSED
Medical Summary: ✅ PASSED

🎉 All tests passed!
```

---

### Step 7: Update Application Dependencies

Install the new Google Auth libraries:

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project

# If running locally
pip install google-auth>=2.23.0 google-auth-oauthlib>=1.1.0 google-auth-httplib2>=0.1.1

# For Docker (already added to requirements.txt)
docker-compose down
docker-compose build fhir-chat-api
```

---

### Step 8: Deploy with Docker

Rebuild and restart your application:

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project

# Stop current containers
docker-compose down

# Rebuild the API container (includes new dependencies)
docker-compose build fhir-chat-api

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f fhir-chat-api
```

**Look for this in the logs:**
```
INFO:llama_service:LlamaService initialized with service account from: /app/llama-service-account-key.json
INFO:llama_service:LlamaService initialized with project: project-c78515e0-ee8f-4282-a3c, region: us-east5
```

---

### Step 9: Test the API Endpoints

```bash
# Test connection
curl http://localhost:8002/llama/test

# Test medical triage with service account
curl -X POST http://localhost:8002/llama/triage \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "High fever (103°F), severe headache, stiff neck, photophobia",
    "patient_history": {
      "age": "42",
      "allergies": "Penicillin"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "symptoms": "High fever (103°F), severe headache, stiff neck, photophobia",
  "triage_recommendation": "SEVERITY: EMERGENCY - IMMEDIATE EVALUATION REQUIRED\n\nRecommended Specialty: Emergency Medicine / Neurology\n\nKey Concerns:\n- Symptoms suggest possible meningitis...\n\nNext Steps:\n1. Immediate emergency department evaluation\n2. Blood work and lumbar puncture\n3. CT scan if indicated..."
}
```

---

## 🔄 How It Works

The application now has **dual authentication support**:

1. **Service Account (Production)**:
   - Uses `GOOGLE_APPLICATION_CREDENTIALS` environment variable
   - Loads credentials from JSON key file
   - Automatically refreshes tokens
   - No need for `gcloud` CLI in container

2. **gcloud CLI (Development)**:
   - Fallback if service account not configured
   - Uses `gcloud auth print-access-token`
   - Requires gcloud CLI installed

---

## 🔍 Verify Service Account is Working

Check application logs:

```bash
docker-compose logs fhir-chat-api | grep "LlamaService"
```

**You should see:**
```
INFO:llama_service:LlamaService initialized with service account from: /app/llama-service-account-key.json
```

**NOT:**
```
INFO:llama_service:No service account configured, using gcloud CLI authentication
```

---

## 📊 Comparison: Option 1 vs Option 2

| Feature | Option 1 (gcloud CLI) | Option 2 (Service Account) |
|---------|----------------------|----------------------------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Moderate |
| **Production Ready** | ❌ No | ✅ Yes |
| **Requires gcloud CLI** | ✅ Yes | ❌ No |
| **Token Refresh** | Manual re-login | Automatic |
| **Docker Compatible** | ⚠️ Limited | ✅ Full |
| **Security** | Personal credentials | Service account |
| **Best For** | Development/Testing | Production deployment |

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep service account keys secure
- Use separate keys for dev/staging/production
- Rotate keys regularly (every 90 days)
- Use least privilege (only required roles)
- Store keys in secure secret management (e.g., Google Secret Manager)
- Monitor service account usage in Cloud Console

### ❌ DON'T:
- Commit keys to version control (already in `.gitignore`)
- Share keys via email or Slack
- Use personal credentials in production
- Give service accounts more permissions than needed
- Store keys in public locations

---

## 🔐 Key Management

### List Service Account Keys

```bash
gcloud iam service-accounts keys list \
  --iam-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com
```

### Delete Old Keys

```bash
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com
```

### Rotate Keys

```bash
# Create new key
gcloud iam service-accounts keys create new-key.json \
  --iam-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com

# Update .env and restart application
# Then delete old key
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied" errors

**Solution:**
```bash
# Check service account permissions
gcloud projects get-iam-policy project-c78515e0-ee8f-4282-a3c \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:llama-api-service@*"
```

### Issue: Key file not found in container

**Solution:**
```bash
# Verify the key file exists
ls -l /Users/karthi/GA_ML_COURSE/CS-6440-O01/project/llama-service-account-key.json

# Check docker-compose.yml volume mount
docker-compose config | grep llama-service-account-key.json
```

### Issue: "Invalid grant" error

**Solution:** Key may be revoked or expired
```bash
# Create new key
gcloud iam service-accounts keys create llama-service-account-key.json \
  --iam-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com

# Restart application
docker-compose restart fhir-chat-api
```

### Issue: Service account not working, falling back to gcloud

**Check:**
1. Is `GOOGLE_APPLICATION_CREDENTIALS` set in `.env`?
2. Does the key file exist at the specified path?
3. Is the key file mounted in docker-compose.yml?
4. Are the file permissions correct (400)?

---

## 📈 Monitoring and Quotas

### Check API Usage

```bash
# View service account activity
gcloud logging read \
  "resource.type=service_account AND protoPayload.authenticationInfo.principalEmail=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com" \
  --limit 50 \
  --format json
```

### Set Quota Alerts

1. Go to Google Cloud Console
2. Navigate to: IAM & Admin → Quotas
3. Search for "Vertex AI API"
4. Set up alerts for your usage limits

---

## 🚀 Production Deployment Checklist

- [ ] Service account created
- [ ] Minimal permissions granted (roles/aiplatform.user)
- [ ] Key file generated and secured (chmod 400)
- [ ] Key file NOT committed to git
- [ ] `.env` updated with GOOGLE_APPLICATION_CREDENTIALS
- [ ] docker-compose.yml includes key mount
- [ ] Application rebuilt with new dependencies
- [ ] Tests pass with service account
- [ ] Logs show service account authentication
- [ ] API endpoints responding correctly
- [ ] Monitoring and alerts configured
- [ ] Key rotation schedule established

---

## 🎓 Next Steps

After successful setup:

1. **Integrate with Medical Assistant**: Add Llama 4 to your triage workflow
2. **A/B Testing**: Compare OpenAI vs Llama 4 performance
3. **Fine-tuning**: Customize prompts for medical domain
4. **Monitoring**: Track API usage and costs
5. **Optimization**: Adjust temperature and token limits

---

## 📞 Support Resources

- **Google Cloud Documentation**: https://cloud.google.com/iam/docs/service-accounts
- **Vertex AI API**: https://cloud.google.com/vertex-ai/docs/reference
- **Your Application Docs**: `LLAMA4_INTEGRATION_GUIDE.md`
- **Test Script**: `test_llama.py`

---

**Version**: 1.0
**Created**: January 2026
**Service Account**: `llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com`
