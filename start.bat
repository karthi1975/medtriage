@echo off
REM FHIR Chat API Startup Script for Windows

echo ==================================
echo FHIR Chat API - Startup Script
echo ==================================
echo.

REM Check if .env file exists
if not exist .env (
    echo Error: .env file not found!
    echo Please create a .env file with your OpenAI API key.
    echo.
    echo Example .env file:
    echo OPENAI_API_KEY=your_key_here
    exit /b 1
)

echo [OK] .env file found

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker is not running!
    echo Please start Docker Desktop
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Build and start the containers
echo Building and starting containers...
echo.

docker-compose up --build -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================
    echo [SUCCESS] FHIR Chat API is running!
    echo ==================================
    echo.
    echo API URL: http://localhost:8000
    echo Swagger Docs: http://localhost:8000/docs
    echo ReDoc: http://localhost:8000/redoc
    echo.
    echo Useful commands:
    echo   - View logs: docker-compose logs -f
    echo   - Stop: docker-compose down
    echo   - Restart: docker-compose restart
    echo   - Run tests: python test_api.py
    echo.
) else (
    echo.
    echo Error: Failed to start containers
    echo Check the logs with: docker-compose logs
    exit /b 1
)
