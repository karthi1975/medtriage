#!/bin/bash
# Deploy HAPI FHIR to Cloud Run
# Project: project-c78515e0-ee8f-4282-a3c

set -e

echo "Deploying HAPI FHIR to Cloud Run..."

gcloud run deploy hapi-fhir \
  --image gcr.io/project-c78515e0-ee8f-4282-a3c/hapi-fhir:latest \
  --region us-east5 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 300 \
  --cpu-boost \
  --add-cloudsql-instances project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres \
  --update-env-vars "spring.datasource.url=jdbc:postgresql://localhost/hapi?socketFactory=com.google.cloud.sql.postgres.SocketFactory&cloudSqlInstance=project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres,spring.datasource.username=hapiuser,spring.datasource.password=HapiSecure2026!,spring.datasource.driverClassName=org.postgresql.Driver,spring.jpa.properties.hibernate.dialect=ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect,hapi.fhir.allow_external_references=true,spring.jpa.hibernate.ddl-auto=update" \
  --project project-c78515e0-ee8f-4282-a3c

echo ""
echo "Deployment complete! Testing HAPI FHIR service..."

# Get the service URL
SERVICE_URL=$(gcloud run services describe hapi-fhir --region us-east5 --format 'value(status.url)' --project project-c78515e0-ee8f-4282-a3c)

echo "HAPI FHIR URL: $SERVICE_URL"
echo "Testing metadata endpoint: $SERVICE_URL/fhir/metadata"

# Wait a bit for the service to be ready
sleep 10

# Test the endpoint
curl -s "$SERVICE_URL/fhir/metadata" | head -20

echo ""
echo "✅ HAPI FHIR deployment script completed!"
