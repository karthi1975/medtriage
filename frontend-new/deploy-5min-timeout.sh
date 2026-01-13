#!/bin/bash

echo "========================================"
echo "Deploying Frontend with 5-Minute Timeout"
echo "========================================"
echo ""

# Check if authenticated
echo "Checking authentication..."
if ! gcloud auth application-default print-access-token > /dev/null 2>&1; then
    echo "❌ Not authenticated. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Build container
echo "Building container image..."
gcloud builds submit \
  --tag=us-east5-docker.pkg.dev/project-c78515e0-ee8f-4282-a3c/cloud-run-source-deploy/medichat-frontend:5min-timeout \
  --project=project-c78515e0-ee8f-4282-a3c

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build succeeded"
echo ""

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy medichat-frontend \
  --image=us-east5-docker.pkg.dev/project-c78515e0-ee8f-4282-a3c/cloud-run-source-deploy/medichat-frontend:5min-timeout \
  --region=us-east5 \
  --project=project-c78515e0-ee8f-4282-a3c \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "Frontend URL: https://medichat-frontend-820444130598.us-east5.run.app"
echo ""
echo "⚠️  NOTE: This fixes timeouts but backend is still slow (2+ minutes)."
echo "    See BACKEND_PERFORMANCE_ISSUE.md for performance optimization."
echo ""
