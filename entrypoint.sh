#!/bin/sh
# Entrypoint script for Cloud Run deployment
# Uses PORT environment variable set by Cloud Run

PORT=${PORT:-8080}
echo "Starting uvicorn on port $PORT"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
