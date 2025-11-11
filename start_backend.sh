#!/bin/bash
# Start Backend API Server

echo "========================================="
echo "Starting Medical Triage Backend API"
echo "========================================="
echo ""
echo "Port: 8002"
echo "Docs: http://localhost:8002/docs"
echo ""
echo "Press CTRL+C to stop"
echo "========================================="
echo ""

# Activate virtual environment and start server
source venv/bin/activate
python main.py
