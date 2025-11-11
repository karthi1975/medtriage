#!/bin/bash

# FHIR Chat API Startup Script

echo "=================================="
echo "FHIR Chat API - Startup Script"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your OpenAI API key."
    echo ""
    echo "Example .env file:"
    echo "OPENAI_API_KEY=your_key_here"
    exit 1
fi

echo "✓ .env file found"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✓ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed!"
    echo "Please install Docker Compose"
    exit 1
fi

echo "✓ Docker Compose is installed"
echo ""

# Build and start the containers
echo "🔨 Building and starting containers..."
echo ""

docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ FHIR Chat API is running!"
    echo "=================================="
    echo ""
    echo "📍 API URL: http://localhost:8000"
    echo "📚 Swagger Docs: http://localhost:8000/docs"
    echo "📖 ReDoc: http://localhost:8000/redoc"
    echo ""
    echo "Useful commands:"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop: docker-compose down"
    echo "  • Restart: docker-compose restart"
    echo "  • Run tests: python test_api.py"
    echo ""
else
    echo ""
    echo "❌ Error: Failed to start containers"
    echo "Check the logs with: docker-compose logs"
    exit 1
fi
