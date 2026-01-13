# GCP Deployment Guide - No Service Account Keys Needed!

## 🎯 Understanding the Authentication Methods

Your organization has blocked service account key creation (for security). This is **actually better** because you'll use more secure methods!

### Authentication Summary

| Environment | Method | Key File Needed? | How It Works |
|------------|--------|------------------|--------------|
| **Local Dev** | gcloud CLI | ❌ No | Uses `~/.config/gcloud/application_default_credentials.json` |
| **Cloud Run** | Attached SA | ❌ No | GCP metadata service provides credentials automatically |
| **Compute Engine** | Attached SA | ❌ No | GCP metadata service provides credentials automatically |
| **GKE** | Workload Identity | ❌ No | Binds K8s SA to GCP SA |
| **App Engine** | Attached SA | ❌ No | Uses App Engine service account |

---

## 🚀 Deployment Option 1: Cloud Run (Recommended)

### Why Cloud Run?
- ✅ Fully managed (no servers to manage)
- ✅ Auto-scaling (0 to millions of requests)
- ✅ Pay per use (only when serving requests)
- ✅ Service account attached automatically
- ✅ Perfect for APIs

### Step-by-Step Deployment

#### **Step 1: Prepare Environment Variables**

Create a `.env.production` file:

```bash
PROJECT_ID=project-c78515e0-ee8f-4282-a3c
ENDPOINT=us-east5-aiplatform.googleapis.com
REGION=us-east5
OPENAI_API_KEY=your-openai-key-here
FHIR_SERVER_URL=https://your-fhir-server.com/fhir
TRIBAL_DB_HOST=your-db-host
TRIBAL_DB_PORT=5432
TRIBAL_DB_NAME=tribal_knowledge
TRIBAL_DB_USER=tribaluser
TRIBAL_DB_PASSWORD=tribalpassword
```

#### **Step 2: Build and Push Container**

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project

# Set project
gcloud config set project project-c78515e0-ee8f-4282-a3c

# Build container using Cloud Build
gcloud builds submit \
  --tag gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  --dockerfile Dockerfile.cloudrun

# Or build locally and push
docker build -f Dockerfile.cloudrun -t gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest .
docker push gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest
```

#### **Step 3: Deploy to Cloud Run**

```bash
# Deploy with attached service account (NO KEY FILE NEEDED!)
gcloud run deploy fhir-chat-api \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  --service-account llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com \
  --region us-east5 \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars="PROJECT_ID=project-c78515e0-ee8f-4282-a3c" \
  --set-env-vars="ENDPOINT=us-east5-aiplatform.googleapis.com" \
  --set-env-vars="REGION=us-east5" \
  --set-env-vars="OPENAI_API_KEY=${OPENAI_API_KEY}"
```

**Key point**: The `--service-account` flag attaches your service account to the Cloud Run service. **No key file needed!**

#### **Step 4: Verify Deployment**

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe fhir-chat-api --region us-east5 --format 'value(status.url)')

# Test the API
curl $SERVICE_URL/health
curl $SERVICE_URL/llama/test
```

---

## 🖥️ Deployment Option 2: Compute Engine VM

### Step-by-Step

#### **Step 1: Create VM with Attached Service Account**

```bash
# Create VM (service account attached - NO KEY NEEDED!)
gcloud compute instances create fhir-api-vm \
  --zone=us-east5-a \
  --machine-type=e2-standard-2 \
  --service-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server

# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:8000 \
  --target-tags http-server
```

#### **Step 2: Deploy Application on VM**

```bash
# SSH into VM
gcloud compute ssh fhir-api-vm --zone=us-east5-a

# On the VM, install dependencies
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git

# Clone your repo or copy files
# (In production, use Cloud Build or deployment pipeline)

# Run with docker-compose
# The VM's service account is automatically available via metadata service
docker-compose up -d
```

**Key point**: The VM has the service account attached. Your code will use Application Default Credentials from the metadata service.

---

## ☸️ Deployment Option 3: Google Kubernetes Engine (GKE)

### Step-by-Step

#### **Step 1: Create GKE Cluster with Workload Identity**

```bash
# Create cluster
gcloud container clusters create fhir-api-cluster \
  --region us-east5 \
  --num-nodes 2 \
  --machine-type e2-standard-2 \
  --workload-pool=project-c78515e0-ee8f-4282-a3c.svc.id.goog \
  --enable-autorepair \
  --enable-autoupgrade
```

#### **Step 2: Configure Workload Identity**

```bash
# Create Kubernetes service account
kubectl create serviceaccount fhir-api-ksa --namespace default

# Bind K8s SA to GCP SA
gcloud iam service-accounts add-iam-policy-binding \
  llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:project-c78515e0-ee8f-4282-a3c.svc.id.goog[default/fhir-api-ksa]"

# Annotate K8s SA
kubectl annotate serviceaccount fhir-api-ksa \
  iam.gke.io/gcp-service-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com
```

#### **Step 3: Deploy Application**

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fhir-chat-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fhir-chat-api
  template:
    metadata:
      labels:
        app: fhir-chat-api
    spec:
      serviceAccountName: fhir-api-ksa  # Uses Workload Identity
      containers:
      - name: api
        image: gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: PROJECT_ID
          value: "project-c78515e0-ee8f-4282-a3c"
        - name: ENDPOINT
          value: "us-east5-aiplatform.googleapis.com"
        - name: REGION
          value: "us-east5"
```

```bash
kubectl apply -f k8s-deployment.yaml
```

---

## 🔐 How Authentication Works in Each Environment

### Local Development
```
Your Code → gcloud CLI → ~/.config/gcloud/application_default_credentials.json → Access Token
```

### Cloud Run / Compute Engine
```
Your Code → google.auth.default() → GCP Metadata Service → Service Account Token
                                   (via 169.254.169.254)
```

### GKE with Workload Identity
```
Your Code → google.auth.default() → K8s Service Account → Workload Identity → GCP Service Account Token
```

---

## 📝 Code Flow (What Happens in Your Application)

When deployed to GCP, your `llama_service.py` does this:

```python
def get_access_token(self):
    # Step 1: Check for service account key file (none exists - skip)
    if self.credentials:  # False - no key file
        return use_key_file()

    # Step 2: Try Application Default Credentials ✅ THIS WORKS!
    try:
        credentials, project = google.auth.default()  # Gets from metadata service
        credentials.refresh(Request())
        return credentials.token  # SUCCESS!
    except:
        pass

    # Step 3: Fallback to gcloud CLI (not available in container - skip)
    ...
```

**On Cloud Run/Compute Engine:**
- `google.auth.default()` automatically finds credentials from the metadata service
- The attached service account provides the token
- **No key file needed!**

---

## 🧪 Testing Deployment

### Test Authentication Method

Add this endpoint to test which auth method is being used:

```python
@router.get("/llama/auth-info")
async def get_auth_info():
    """Debug endpoint to see which authentication method is being used"""
    llama = get_llama_service()

    auth_method = "unknown"
    if llama.credentials:
        auth_method = "service_account_key_file"
    else:
        try:
            import google.auth
            credentials, project = google.auth.default()
            if isinstance(credentials, google.auth.compute_engine.Credentials):
                auth_method = "gcp_metadata_service"
            else:
                auth_method = "application_default_credentials"
        except:
            auth_method = "gcloud_cli"

    return {
        "auth_method": auth_method,
        "project_id": llama.project_id,
        "region": llama.region,
        "service_account_path": llama.service_account_path
    }
```

**Expected response on Cloud Run:**
```json
{
  "auth_method": "gcp_metadata_service",
  "project_id": "project-c78515e0-ee8f-4282-a3c",
  "region": "us-east5",
  "service_account_path": null
}
```

---

## 🎯 Summary: No Keys Required!

| ❌ Old Way (Blocked by Org) | ✅ New Way (What You'll Use) |
|----------------------------|------------------------------|
| Download service account key | Attach service account to compute resource |
| Store key in container | No key needed - uses metadata service |
| Risk of key theft | More secure - no keys to steal |
| Manual key rotation | Automatic credential management |

---

## 🚀 Quick Start Deployment

For your investor demo, use **Cloud Run** (easiest):

```bash
# 1. Build
gcloud builds submit --tag gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api

# 2. Deploy
gcloud run deploy fhir-chat-api \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api \
  --service-account llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com \
  --region us-east5 \
  --allow-unauthenticated

# 3. Test
curl $(gcloud run services describe fhir-chat-api --region us-east5 --format 'value(status.url)')/llama/test
```

**Done!** Your service is deployed with full Llama 4 API access, and **no service account keys were harmed in the making of this deployment** 🎉

---

## 📞 Need Help?

- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Workload Identity**: https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
- **Application Default Credentials**: https://cloud.google.com/docs/authentication/application-default-credentials

---

**Version**: 1.0
**Last Updated**: January 2026
**Service Account**: llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com
