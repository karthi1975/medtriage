#!/bin/bash
# Quick database init via existing backend container

gcloud run jobs create db-init \
  --image=gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  --region=us-east5 \
  --service-account=llama-api-service@project-c78515e0-ee8f-4282-a3c.iam.gserviceaccount.com \
  --set-cloudsql-instances=project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres \
  --set-env-vars="TRIBAL_DB_HOST=/cloudsql/project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres,TRIBAL_DB_PORT=5432,TRIBAL_DB_NAME=hapi,TRIBAL_DB_USER=hapiuser,TRIBAL_DB_PASSWORD=HapiSecure2026!,OPENAI_API_KEY=not-using,FHIR_SERVER_URL=http://34.162.139.26:8080/fhir" \
  --command=python3 \
  --args=init_database.py \
  --execute-now

