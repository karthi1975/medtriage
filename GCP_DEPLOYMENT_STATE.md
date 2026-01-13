# GCP Deployment State - MediChat Application

**Project ID**: `project-c78515e0-ee8f-4282-a3c`
**Region**: `us-east5`
**Last Updated**: 2026-01-11

---

## Current Deployment Status

### ✅ Successfully Deployed Components

#### 1. Backend API (fhir-chat-api)
- **Service Name**: `fhir-chat-api`
- **URL**: `https://fhir-chat-api-tg3weve6aq-ul.a.run.app`
- **Status**: ✅ **HEALTHY**
- **Resources**: 2 GB RAM, 2 vCPUs
- **Image**: `gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest`
- **Platform**: linux/amd64
- **Service Account**: `llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com`
- **Features**:
  - Llama 4 API integration via Vertex AI
  - FastAPI backend
  - Chat endpoints
  - Patient data management

#### 2. Frontend (medichat-frontend)
- **Service Name**: `medichat-frontend`
- **URL**: `https://medichat-frontend-tg3weve6aq-ul.a.run.app`
- **Status**: ✅ **HEALTHY**
- **Resources**: 512 MB RAM, 1 vCPU
- **Image**: `gcr.io/project-c78515e0-ee8f-4282-a3c/medichat-frontend:latest`
- **Platform**: linux/amd64
- **Tech Stack**: React + Vite + Material-UI + Nginx
- **Features**:
  - Intelligent Medical Assistant chat interface
  - Appointment scheduling UI
  - Patient history display
  - Test ordering interface

#### 3. Cloud SQL Database
- **Instance Name**: `medichat-postgres`
- **Type**: PostgreSQL 15
- **Region**: `us-east5`
- **Status**: ✅ **RUNNABLE**
- **Connection Name**: `project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres`
- **Databases**:
  - `tribal_knowledge` - Chat history and workflows
  - `hapi` - FHIR data (for HAPI FHIR server)
- **Users**:
  - `tribaluser` - Backend API access
  - `hapiuser` - HAPI FHIR server access

---

### ⚠️ Pending Deployment

#### 4. HAPI FHIR Server (hapi-fhir)
- **Service Name**: `hapi-fhir`
- **Status**: ⚠️ **DEPLOYMENT IN PROGRESS**
- **Issue**: Startup timeout due to heavy Java/Spring Boot initialization
- **Resources Configured**: 4 GB RAM, 2 vCPUs
- **Image**: `gcr.io/project-c78515e0-ee8f-4282-a3c/hapi-fhir:latest` (✅ rebuilt for linux/amd64)
- **Cloud SQL Connection**: Configured to `medichat-postgres:hapi` database
- **Target URL**: `https://hapi-fhir-820444130598.us-east5.run.app/fhir`

**Latest Fix Applied**:
- ✅ Rebuilt Docker image for correct platform (linux/amd64)
- ✅ Configured CPU boost for faster startup
- ✅ Increased memory to 4GB
- ✅ Added database auto-schema creation
- 🔄 Requires manual deployment (auth token expired)

**Next Step**: Run `./deploy-hapi-fhir.sh` after `gcloud auth login`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 Google Cloud Platform                           │
│                 Project: project-c78515e0-ee8f-4282-a3c         │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Frontend        │         │  Backend API     │             │
│  │  Cloud Run       │────────▶│  Cloud Run       │             │
│  │                  │   API   │                  │             │
│  │  medichat-       │         │  fhir-chat-api   │             │
│  │  frontend        │         │                  │             │
│  │                  │         │  ┌─────────────┐ │             │
│  │  ✅ HEALTHY      │         │  │ Llama 4 API │ │             │
│  │                  │         │  └─────────────┘ │             │
│  └──────────────────┘         │  ✅ HEALTHY      │             │
│           │                    └──────────────────┘             │
│           │                             │                       │
│           │                             ▼                       │
│           │                    ┌──────────────────┐            │
│           │                    │  Cloud SQL       │            │
│           │                    │  PostgreSQL 15   │            │
│           │                    │                  │            │
│           │                    │  - tribal_       │            │
│           │                    │    knowledge     │            │
│           │                    │  - hapi          │            │
│           │                    │                  │            │
│           │                    │  ✅ RUNNABLE     │            │
│           │                    └──────────────────┘            │
│           │                             ▲                       │
│           │                             │                       │
│           │                    ┌──────────────────┐            │
│           └───────────────────▶│  HAPI FHIR       │            │
│                                 │  Cloud Run       │            │
│                                 │                  │            │
│                                 │  hapi-fhir       │            │
│                                 │                  │            │
│                                 │  ⚠️ DEPLOYING    │            │
│                                 └──────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Container Registry

All Docker images are stored in Google Container Registry:

```
gcr.io/project-c78515e0-ee8f-4282-a3c/
├── fhir-chat-api:latest       ✅ linux/amd64
├── medichat-frontend:latest   ✅ linux/amd64
└── hapi-fhir:latest           ✅ linux/amd64 (rebuilt)
```

---

## Service Accounts

### 1. llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com
- **Purpose**: Backend API authentication to Vertex AI (Llama 4)
- **Attached To**: `fhir-chat-api` Cloud Run service
- **Roles**:
  - Vertex AI User
  - Cloud SQL Client (if needed)

### 2. Default Cloud Run Service Account
- Used by frontend and HAPI FHIR services

---

## Environment Variables Configuration

### Backend API (fhir-chat-api)
```env
PROJECT_ID=project-c78515e0-ee8f-4282-a3c
ENDPOINT=us-east5-aiplatform.googleapis.com
REGION=us-east5
FHIR_SERVER_URL=<to be set after HAPI deployment>
```

### Frontend (medichat-frontend)
```env
VITE_API_URL=https://fhir-chat-api-tg3weve6aq-ul.a.run.app
```
*(Baked into build)*

### HAPI FHIR (hapi-fhir)
```env
spring.datasource.url=jdbc:postgresql://localhost/hapi?socketFactory=com.google.cloud.sql.postgres.SocketFactory&cloudSqlInstance=project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres
spring.datasource.username=hapiuser
spring.datasource.password=HapiSecure2026!
spring.datasource.driverClassName=org.postgresql.Driver
spring.jpa.properties.hibernate.dialect=ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect
hapi.fhir.allow_external_references=true
spring.jpa.hibernate.ddl-auto=update
```

---

## Deployment Scripts

### Available Scripts

1. **check-gcp-resources.sh** - Verify all GCP resources
   ```bash
   ./check-gcp-resources.sh
   ```

2. **deploy-hapi-fhir.sh** - Deploy HAPI FHIR server
   ```bash
   gcloud auth login  # First authenticate
   ./deploy-hapi-fhir.sh
   ```

3. **quick-cloudrun-test.sh** - Quick health checks
   ```bash
   ./quick-cloudrun-test.sh
   ```

4. **test-cloudrun-deployment.sh** - Comprehensive tests
   ```bash
   ./test-cloudrun-deployment.sh
   ```

---

## Access URLs

### Production URLs

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | https://medichat-frontend-tg3weve6aq-ul.a.run.app | ✅ Live |
| **Backend API** | https://fhir-chat-api-tg3weve6aq-ul.a.run.app | ✅ Live |
| **HAPI FHIR** | https://hapi-fhir-820444130598.us-east5.run.app/fhir | ⚠️ Deploying |

### Health Check Endpoints

```bash
# Frontend
curl https://medichat-frontend-tg3weve6aq-ul.a.run.app/health

# Backend
curl https://fhir-chat-api-tg3weve6aq-ul.a.run.app/health

# HAPI FHIR (after deployment)
curl https://hapi-fhir-820444130598.us-east5.run.app/fhir/metadata
```

---

## Cost Tracking

### Estimated Monthly Costs

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| Frontend Cloud Run | 512MB, 1 CPU | $0-3 |
| Backend Cloud Run | 2GB, 2 CPU | $0-7 |
| HAPI FHIR Cloud Run | 4GB, 2 CPU | $0-15 |
| Cloud SQL PostgreSQL | Standard, us-east5 | $25-50 |
| Llama 4 API (Vertex AI) | Pay per token | $10-100 |
| Container Registry | Storage | $0-2 |
| **Total** | | **$35-177/month** |

*Note: Development usage typically stays within free tier for Cloud Run*

---

## Next Steps

### Immediate Actions Required

1. **Complete HAPI FHIR Deployment**
   ```bash
   gcloud auth login
   ./deploy-hapi-fhir.sh
   ```

2. **Update Backend API with FHIR URL**
   After HAPI deploys successfully, update backend:
   ```bash
   gcloud run services update fhir-chat-api \
     --region=us-east5 \
     --set-env-vars="FHIR_SERVER_URL=https://hapi-fhir-820444130598.us-east5.run.app/fhir"
   ```

3. **Test End-to-End Flow**
   - Verify frontend can reach backend
   - Test chat with Llama 4
   - Verify FHIR data integration
   - Test appointment scheduling

### Future Enhancements

- [ ] Set up Cloud Monitoring alerts
- [ ] Configure custom domain names
- [ ] Implement CI/CD pipeline
- [ ] Add rate limiting
- [ ] Configure Cloud Armor (DDoS protection)
- [ ] Set up automated backups
- [ ] Implement proper secrets management (Secret Manager)

---

## Troubleshooting

### Common Issues

**Issue**: HAPI FHIR startup timeout
- **Cause**: Java/Spring Boot takes 2-3 minutes to start
- **Solution**: Using CPU boost, 4GB RAM, and extended timeout

**Issue**: Authentication errors
- **Cause**: Expired gcloud credentials
- **Solution**: Run `gcloud auth login`

**Issue**: Database connection errors
- **Cause**: Cloud SQL instance not accessible
- **Solution**: Verify Cloud SQL connector is configured in Cloud Run

---

## Support & Documentation

- **GCP Console**: https://console.cloud.google.com/run?project=project-c78515e0-ee8f-4282-a3c
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **HAPI FHIR Docs**: https://hapifhir.io/hapi-fhir/docs/
- **Vertex AI Docs**: https://cloud.google.com/vertex-ai/docs

---

**Project Owner**: karthi@kpitechllc.com
**Project Type**: Medical AI Assistant with FHIR Integration
**Deployment Platform**: Google Cloud Platform (Serverless)
