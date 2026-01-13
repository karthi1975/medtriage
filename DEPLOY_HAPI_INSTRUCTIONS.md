# Deploy HAPI FHIR to Cloud Run - Instructions

## Issue Summary
- ✅ Docker image rebuilt for correct platform (linux/amd64)
- ✅ All configuration prepared
- ⚠️ Need to authenticate gcloud to complete deployment

---

## Step 1: Authenticate with GCP

Open your terminal and run:

```bash
gcloud auth login
```

**Important**: Select **karthi@kpitechllc.com** when prompted.

---

## Step 2: Deploy HAPI FHIR

Navigate to the project directory and run the deployment script:

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
./deploy-hapi-fhir.sh
```

This will:
- Deploy HAPI FHIR to Cloud Run
- Configure 4GB RAM + 2 CPUs
- Enable CPU boost for faster startup
- Connect to Cloud SQL database
- Test the deployment

---

## Step 3: (Optional) Keep HAPI Always Warm

If you want to avoid cold starts (recommended for demos):

```bash
gcloud run services update hapi-fhir \
  --min-instances=1 \
  --region=us-east5 \
  --project=project-c78515e0-ee8f-4282-a3c
```

**Cost**: ~$15/month to keep 1 instance always running
**Benefit**: No 2-3 minute cold starts

---

## Expected Results

### Successful Deployment

You should see:
```
Deploying container to Cloud Run service [hapi-fhir]...
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [hapi-fhir] revision [hapi-fhir-00004-xxx] has been deployed
```

### HAPI FHIR URL

After deployment, you'll get:
```
HAPI FHIR URL: https://hapi-fhir-820444130598.us-east5.run.app
```

### Test the Service

The script will automatically test:
```bash
curl https://hapi-fhir-820444130598.us-east5.run.app/fhir/metadata
```

You should see FHIR CapabilityStatement JSON response.

---

## Troubleshooting

### If Deployment Takes Long Time

**Normal**: First startup takes 2-3 minutes (Java/Spring Boot initialization)
- Cloud Run will show "Creating Revision..." for a while
- This is expected
- Be patient!

### If Deployment Fails with Timeout

Try deploying with even longer timeout:

```bash
gcloud run deploy hapi-fhir \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/hapi-fhir:latest \
  --region us-east5 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 600 \
  --cpu-boost \
  --min-instances=1 \
  --add-cloudsql-instances project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres \
  --update-env-vars "spring.datasource.url=jdbc:postgresql://localhost/hapi?socketFactory=com.google.cloud.sql.postgres.SocketFactory&cloudSqlInstance=project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres,spring.datasource.username=hapiuser,spring.datasource.password=HapiSecure2026!,spring.datasource.driverClassName=org.postgresql.Driver,spring.jpa.properties.hibernate.dialect=ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect,hapi.fhir.allow_external_references=true,spring.jpa.hibernate.ddl-auto=update" \
  --project project-c78515e0-ee8f-4282-a3c
```

Note: `--min-instances=1` keeps it always warm

### If Database Connection Fails

Check Cloud SQL status:
```bash
gcloud sql instances describe medichat-postgres \
  --project=project-c78515e0-ee8f-4282-a3c
```

Should show: `state: RUNNABLE`

---

## After Successful Deployment

### Next Steps

1. **Update Backend API** with HAPI FHIR URL:
   ```bash
   gcloud run services update fhir-chat-api \
     --region=us-east5 \
     --update-env-vars="FHIR_SERVER_URL=https://hapi-fhir-820444130598.us-east5.run.app/fhir" \
     --project=project-c78515e0-ee8f-4282-a3c
   ```

2. **Test End-to-End**:
   - Open frontend: https://medichat-frontend-tg3weve6aq-ul.a.run.app
   - Try chat functionality
   - Verify FHIR data integration

3. **Monitor Logs**:
   ```bash
   gcloud run services logs tail hapi-fhir \
     --region=us-east5 \
     --project=project-c78515e0-ee8f-4282-a3c
   ```

---

## Configuration Details

### Resources Allocated
- **Memory**: 4 GB (HAPI FHIR needs heavy memory)
- **CPU**: 2 vCPUs
- **Timeout**: 300 seconds (5 minutes)
- **CPU Boost**: Enabled (faster cold starts)
- **Platform**: linux/amd64

### Environment Variables Set
```
spring.datasource.url=jdbc:postgresql://localhost/hapi?socketFactory=com.google.cloud.sql.postgres.SocketFactory&cloudSqlInstance=project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres
spring.datasource.username=hapiuser
spring.datasource.password=HapiSecure2026!
spring.datasource.driverClassName=org.postgresql.Driver
spring.jpa.properties.hibernate.dialect=ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect
hapi.fhir.allow_external_references=true
spring.jpa.hibernate.ddl-auto=update
```

### Cloud SQL Connection
- **Instance**: project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres
- **Database**: hapi
- **User**: hapiuser
- **Connection Method**: Cloud SQL Proxy (automatic via Cloud Run)

---

## Complete Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud Platform (Cloud Run)              │
│              project-c78515e0-ee8f-4282-a3c                 │
│                                                              │
│  Frontend ───────► Backend API ───────► HAPI FHIR          │
│  (React)           (FastAPI)            (Java/Spring)       │
│                        │                     │               │
│                        │                     │               │
│                        ▼                     ▼               │
│                   Llama 4 API      Cloud SQL PostgreSQL     │
│                   (Vertex AI)      (medichat-postgres)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### All Service URLs

| Service | URL |
|---------|-----|
| Frontend | https://medichat-frontend-tg3weve6aq-ul.a.run.app |
| Backend | https://fhir-chat-api-tg3weve6aq-ul.a.run.app |
| HAPI FHIR | https://hapi-fhir-820444130598.us-east5.run.app/fhir |

### Health Checks

```bash
# Frontend
curl https://medichat-frontend-tg3weve6aq-ul.a.run.app/health

# Backend
curl https://fhir-chat-api-tg3weve6aq-ul.a.run.app/health

# HAPI FHIR
curl https://hapi-fhir-820444130598.us-east5.run.app/fhir/metadata
```

---

## Summary

1. Run: `gcloud auth login` (select karthi@kpitechllc.com)
2. Run: `./deploy-hapi-fhir.sh`
3. Wait 2-3 minutes for deployment
4. (Optional) Add `--min-instances=1` to avoid cold starts
5. Update backend with FHIR URL
6. Test end-to-end!

**Ready to deploy!** 🚀
