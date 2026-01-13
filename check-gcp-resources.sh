#!/bin/bash
# Check all GCP resources for project-c78515e0-ee8f-4282-a3c

PROJECT_ID="project-c78515e0-ee8f-4282-a3c"
REGION="us-east5"

echo "======================================"
echo "GCP Resources for MediChat Project"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "======================================"
echo ""

echo "1. Cloud Run Services:"
echo "----------------------"
gcloud run services list --region=$REGION --project=$PROJECT_ID --format="table(name,status.url,status.conditions[0].status)"
echo ""

echo "2. Cloud SQL Instances:"
echo "----------------------"
gcloud sql instances list --project=$PROJECT_ID --format="table(name,region,databaseVersion,state,ipAddresses[0].ipAddress)"
echo ""

echo "3. Container Images in GCR:"
echo "----------------------"
gcloud container images list --project=$PROJECT_ID --format="table(name)"
echo ""

echo "4. Service Accounts:"
echo "----------------------"
gcloud iam service-accounts list --project=$PROJECT_ID --format="table(email,displayName)"
echo ""

echo "5. Cloud Run Service Details:"
echo "----------------------"
echo ""
echo "Frontend (medichat-frontend):"
gcloud run services describe medichat-frontend --region=$REGION --project=$PROJECT_ID --format="value(status.url)" 2>/dev/null && echo "  Status: ✅ Deployed" || echo "  Status: ❌ Not deployed"
echo ""
echo "Backend (fhir-chat-api):"
gcloud run services describe fhir-chat-api --region=$REGION --project=$PROJECT_ID --format="value(status.url)" 2>/dev/null && echo "  Status: ✅ Deployed" || echo "  Status: ❌ Not deployed"
echo ""
echo "HAPI FHIR (hapi-fhir):"
gcloud run services describe hapi-fhir --region=$REGION --project=$PROJECT_ID --format="value(status.url)" 2>/dev/null && echo "  Status: ⚠️  Deployed but unhealthy" || echo "  Status: ❌ Not deployed"
echo ""

echo "======================================"
echo "Summary"
echo "======================================"
echo "All resources should be in: $PROJECT_ID"
echo "Primary region: $REGION"
echo ""
