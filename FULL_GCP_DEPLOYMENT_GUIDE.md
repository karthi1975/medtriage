# Complete GCP Deployment Guide - MediChat Application

## 🎯 Overview

This guide covers the full deployment of your MediChat application to Google Cloud Platform:

- **Backend API** → Cloud Run
- **Frontend UI** → Cloud Run
- **Database** → Cloud SQL / External FHIR Server

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Google Cloud Platform                  │
│                                                           │
│  ┌─────────────────────┐       ┌────────────────────┐   │
│  │   Frontend          │       │   Backend API      │   │
│  │   (Cloud Run)       │──────▶│   (Cloud Run)      │   │
│  │                     │       │                    │   │
│  │   React/Vite        │       │   FastAPI          │   │
│  │   + Nginx           │       │   + Llama 4        │   │
│  │   Port: 8080        │       │   Port: 8000       │   │
│  └─────────────────────┘       └────────────────────┘   │
│           │                             │                │
│           │                             ▼                │
│           │                    ┌────────────────────┐   │
│           │                    │   Vertex AI        │   │
│           │                    │   Llama 4 API      │   │
│           │                    └────────────────────┘   │
│           │                             │                │
│           ▼                             ▼                │
│  ┌─────────────────────────────────────────────────┐   │
│  │         External FHIR Server                     │   │
│  │         (HAPI FHIR)                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Backend Deployment (COMPLETED)

### Status: ✅ DEPLOYED

- **Service Name**: fhir-chat-api
- **URL**: https://fhir-chat-api-820444130598.us-east5.run.app
- **Region**: us-east5
- **Image**: gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest
- **Status**: Healthy and operational

### Environment Variables
```
PROJECT_ID=project-c78515e0-ee8f-4282-a3c
ENDPOINT=us-east5-aiplatform.googleapis.com
REGION=us-east5
```

---

## 🚀 Frontend Deployment (IN PROGRESS)

### Deployment Steps

#### 1. Build Frontend Docker Image (IN PROGRESS)
```bash
cd frontend-new
docker buildx build --platform linux/amd64 \
  -t gcr.io/project-c78515e0-ee8f-4282-a3c/medichat-frontend:latest \
  . --push
```

#### 2. Deploy to Cloud Run
```bash
gcloud run deploy medichat-frontend \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/medichat-frontend:latest \
  --region us-east5 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

#### 3. Enable Public Access
```bash
gcloud run services add-iam-policy-binding medichat-frontend \
  --region=us-east5 \
  --member=allUsers \
  --role=roles/run.invoker
```

---

## 📝 Files Created for Deployment

### Frontend Files
1. **Dockerfile** - Multi-stage build with Node + Nginx
2. **nginx.conf** - Nginx configuration for SPA routing
3. **.env.production** - Production environment variables
4. **.dockerignore** - Excludes unnecessary files from build

### Backend Files (Already Created)
1. **Dockerfile.cloudrun** - Backend container
2. **cloudbuild.yaml** - Cloud Build configuration
3. **.gcloudignore** - Excludes files from deployment

---

## 🔧 Configuration Details

### Frontend Configuration

**Environment Variables** (baked into build):
```env
VITE_API_URL=https://fhir-chat-api-820444130598.us-east5.run.app
```

**Nginx Settings**:
- Port: 8080
- SPA routing enabled
- Static asset caching
- Gzip compression
- Health check endpoint: `/health`

### Backend Configuration

**Service Account**: llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com

**Resources**:
- Memory: 2 GiB
- CPU: 2 vCPUs
- Max instances: 10

---

## 🌐 Final URLs (After Frontend Deploys)

### Production URLs
- **Frontend**: https://medichat-frontend-820444130598.us-east5.run.app
- **Backend**: https://fhir-chat-api-820444130598.us-east5.run.app

### API Endpoints
- Health: `https://fhir-chat-api-820444130598.us-east5.run.app/health`
- Llama Test: `https://fhir-chat-api-820444130598.us-east5.run.app/llama/test`
- Chat: `https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/chat`

---

## 🧪 Testing Deployment

### After Frontend Deploys

```bash
# 1. Test frontend health
curl https://medichat-frontend-820444130598.us-east5.run.app/health

# 2. Access frontend in browser
open https://medichat-frontend-820444130598.us-east5.run.app

# 3. Test backend
curl https://fhir-chat-api-820444130598.us-east5.run.app/health
```

---

## 🔐 Security Configuration

### CORS Settings
Backend allows all origins for development. For production, update `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://medichat-frontend-820444130598.us-east5.run.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Service Accounts
- **Backend**: Uses attached service account (no keys!)
- **Frontend**: Runs as default Cloud Run service account

---

## 💰 Cost Estimation

### Monthly Costs (Low Usage)

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| **Frontend (Cloud Run)** | 2M requests, 360K GiB-seconds | $0-2 |
| **Backend (Cloud Run)** | 2M requests, 360K GiB-seconds | $0-5 |
| **Llama 4 API** | Pay per token | $5-50 |
| **Data Transfer** | 1GB free | $0-5 |
| **Total** | - | **$5-60/month** |

Most usage will stay in free tier for development/demo!

---

## 🔄 CI/CD Pipeline (Future Enhancement)

### Automated Deployment
```yaml
# cloudbuild-frontend.yaml
steps:
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/medichat-frontend', 'frontend-new']

  # Push to GCR
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/medichat-frontend']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'medichat-frontend'
      - '--image=gcr.io/$PROJECT_ID/medichat-frontend'
      - '--region=us-east5'
      - '--platform=managed'
```

---

## 📋 Post-Deployment Checklist

### Immediate Tasks
- [ ] Frontend Docker image built
- [ ] Frontend deployed to Cloud Run
- [ ] Public access enabled for frontend
- [ ] Test frontend URL in browser
- [ ] Verify frontend connects to backend

### Configuration Tasks
- [ ] Configure FHIR server URL
- [ ] Set up custom domain (optional)
- [ ] Configure Cloud Monitoring
- [ ] Set up alerting
- [ ] Configure backups

### Security Tasks
- [ ] Review CORS settings
- [ ] Set up rate limiting
- [ ] Configure WAF rules (optional)
- [ ] Review IAM policies
- [ ] Enable audit logging

---

## 🐛 Troubleshooting

### Frontend Issues

**Issue**: 404 on routes
```
Solution: Check nginx.conf has try_files directive for SPA routing
```

**Issue**: API calls fail
```
Solution: Check VITE_API_URL in .env.production
Verify: curl https://fhir-chat-api-820444130598.us-east5.run.app/health
```

**Issue**: Build fails
```
Solution: Check node_modules are excluded (.dockerignore)
Run: npm ci --legacy-peer-deps locally first
```

### Backend Issues

**Issue**: FHIR data not loading
```
Solution: Set FHIR_SERVER_URL environment variable
gcloud run services update fhir-chat-api --set-env-vars="FHIR_SERVER_URL=https://..."
```

**Issue**: Llama API errors
```
Solution: Verify service account permissions
Check: Service account has aiplatform.user role
```

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Frontend logs
gcloud run services logs tail medichat-frontend --region=us-east5

# Backend logs
gcloud run services logs tail fhir-chat-api --region=us-east5
```

### Cloud Console
- Frontend: https://console.cloud.google.com/run/detail/us-east5/medichat-frontend
- Backend: https://console.cloud.google.com/run/detail/us-east5/fhir-chat-api

---

## 🔄 Update Deployment

### Update Frontend
```bash
# 1. Make changes to code
# 2. Rebuild and push
docker buildx build --platform linux/amd64 \
  -t gcr.io/project-c78515e0-ee8f-4282-a3c/medichat-frontend:latest \
  frontend-new --push

# 3. Deploy
gcloud run deploy medichat-frontend \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/medichat-frontend:latest \
  --region us-east5
```

### Update Backend
```bash
# Same process as frontend, use Dockerfile.cloudrun
docker buildx build --platform linux/amd64 \
  -f Dockerfile.cloudrun \
  -t gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  . --push

gcloud run deploy fhir-chat-api \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  --region us-east5
```

---

## 🎯 Success Criteria

### Frontend Deployment Success
- ✅ Docker image builds successfully
- ✅ Image pushed to GCR
- ✅ Cloud Run service deployed
- ✅ Public access enabled
- ✅ URL returns 200 on `/health`
- ✅ UI loads in browser
- ✅ Can navigate between pages

### Backend Integration Success
- ✅ Frontend makes API calls to backend
- ✅ Chat functionality works
- ✅ Llama 4 responses received
- ✅ Patient data loads (when FHIR configured)

---

## 📞 Support Resources

- **GCP Documentation**: https://cloud.google.com/run/docs
- **Project Console**: https://console.cloud.google.com/run?project=project-c78515e0-ee8f-4282-a3c
- **Logs**: Use `gcloud run services logs tail` commands above

---

**Deployment Started**: January 10, 2026
**Status**: Backend ✅ Complete | Frontend 🔄 In Progress
**Project**: project-c78515e0-ee8f-4282-a3c
