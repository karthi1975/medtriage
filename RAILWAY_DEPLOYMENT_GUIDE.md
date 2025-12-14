# Railway Deployment Guide - MediChat FHIR Application

This guide walks you through deploying the MediChat FHIR application to Railway.

## Architecture Overview

The application consists of:
1. **Backend API** (FastAPI) - main service
2. **Frontend** (React) - static site
3. **PostgreSQL - FHIR Database** - Railway PostgreSQL plugin
4. **PostgreSQL - Tribal Knowledge Database** - Railway PostgreSQL plugin
5. **HAPI FHIR Server** - External or Railway deployment

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub account (to connect your repository)
3. OpenAI API key

## Deployment Steps

### Step 1: Prepare Your Repository

1. Push your code to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit for Railway deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Create a New Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway will create a project for you

### Step 3: Add PostgreSQL Databases

You need TWO PostgreSQL databases:

#### Database 1: FHIR Database (for HAPI FHIR)
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Name it "postgres-fhir"
4. Note the connection details

#### Database 2: Tribal Knowledge Database
1. Click "+ New" again
2. Select "Database" → "PostgreSQL"
3. Name it "postgres-tribal"
4. Railway will provide connection variables

### Step 4: Deploy Backend API Service

1. In your Railway project, you should see a service created from your repo
2. Click on the service
3. Go to "Settings" → "Environment"
4. Add the following environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# FHIR Server Configuration
FHIR_SERVER_URL=http://localhost:8080/fhir

# Tribal Knowledge Database (from Railway postgres-tribal service)
TRIBAL_DB_HOST=${{postgres-tribal.PGHOST}}
TRIBAL_DB_PORT=${{postgres-tribal.PGPORT}}
TRIBAL_DB_NAME=${{postgres-tribal.PGDATABASE}}
TRIBAL_DB_USER=${{postgres-tribal.PGUSER}}
TRIBAL_DB_PASSWORD=${{postgres-tribal.PGPASSWORD}}

# RAG Configuration
USE_RAG=True

# Port (Railway sets this automatically)
PORT=${{PORT}}
```

5. Go to "Settings" → "Networking"
6. Click "Generate Domain" to get a public URL for your backend

### Step 5: Initialize Tribal Knowledge Database

After the backend is deployed, you need to initialize the tribal knowledge database:

1. Go to the postgres-tribal service in Railway
2. Click on "Data" tab
3. Run the initialization scripts from `postgres-init/` directory
4. Or connect using the provided connection string and run:

```sql
-- Your initialization SQL here
-- (from postgres-init files)
```

### Step 6: Deploy HAPI FHIR Server

You have two options:

#### Option A: Deploy HAPI FHIR on Railway (Recommended)

1. Click "+ New" in your Railway project
2. Select "Empty Service"
3. Name it "hapi-fhir"
4. Go to "Settings" → "Environment"
5. Add these variables:

```env
# PostgreSQL Configuration (from postgres-fhir service)
SPRING_DATASOURCE_URL=jdbc:postgresql://${{postgres-fhir.PGHOST}}:${{postgres-fhir.PGPORT}}/${{postgres-fhir.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{postgres-fhir.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{postgres-fhir.PGPASSWORD}}
SPRING_DATASOURCE_DRIVERCLASSNAME=org.postgresql.Driver
SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect
HAPI_FHIR_ALLOW_EXTERNAL_REFERENCES=true
HAPI_FHIR_ALLOW_MULTIPLE_DELETE=true
HAPI_FHIR_ALLOW_PLACEHOLDER_REFERENCES=true
```

6. Go to "Settings" → "Deploy"
7. Set Docker image: `hapiproject/hapi:latest`
8. Generate a public domain for this service
9. Update the backend's `FHIR_SERVER_URL` to point to this domain

#### Option B: Use External HAPI FHIR Server

If you have an existing HAPI FHIR server, just update the backend's `FHIR_SERVER_URL` to point to it.

### Step 7: Deploy Frontend

1. Click "+ New" in your Railway project
2. Select "GitHub Repo" and choose your repository
3. Set root directory to `/frontend`
4. Go to "Settings" → "Environment"
5. Add:

```env
REACT_APP_API_URL=https://your-backend-domain.railway.app
```

6. Go to "Settings" → "Build"
7. Ensure build command is: `npm run build`
8. Set install command: `npm install`
9. Go to "Settings" → "Deploy"
10. Railway will detect the Dockerfile and build it
11. Generate a public domain for the frontend

### Step 8: Configure Service Communication

Update your backend environment variables:

1. Go to your backend service
2. Update `FHIR_SERVER_URL` to use the HAPI FHIR Railway domain:
```env
FHIR_SERVER_URL=https://hapi-fhir-production.railway.app/fhir
```

3. Enable internal networking between services:
   - Railway automatically provides private networking
   - Services can communicate using service names

### Step 9: Database Initialization

1. Connect to the tribal knowledge database and run initialization scripts
2. You can use Railway's built-in database client or connect via:
```bash
psql ${{postgres-tribal.DATABASE_URL}}
```

3. Load the FHIR server with sample patient data (if needed):
```bash
# Use the API or FHIR client to load data
```

### Step 10: Verify Deployment

1. Open your frontend URL
2. Test the application:
   - Patient lookup
   - Symptom extraction
   - Triage functionality
   - Appointment scheduling

## Environment Variables Reference

### Backend Service

| Variable | Description | Example |
|----------|-------------|---------|
| OPENAI_API_KEY | OpenAI API key | sk-... |
| OPENAI_MODEL | Model to use | gpt-3.5-turbo |
| FHIR_SERVER_URL | HAPI FHIR server URL | https://hapi.railway.app/fhir |
| TRIBAL_DB_HOST | Tribal DB host | postgres-tribal |
| TRIBAL_DB_PORT | Tribal DB port | 5432 |
| TRIBAL_DB_NAME | Database name | railway |
| TRIBAL_DB_USER | Database user | postgres |
| TRIBAL_DB_PASSWORD | Database password | *** |
| USE_RAG | Enable RAG features | True |

### Frontend Service

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | https://api.railway.app |

### HAPI FHIR Service

| Variable | Description | Example |
|----------|-------------|---------|
| SPRING_DATASOURCE_URL | JDBC URL | jdbc:postgresql://... |
| SPRING_DATASOURCE_USERNAME | DB username | postgres |
| SPRING_DATASOURCE_PASSWORD | DB password | *** |

## Service Dependencies

```
Frontend → Backend API → HAPI FHIR Server → PostgreSQL (FHIR)
                      → PostgreSQL (Tribal Knowledge)
```

## Monitoring and Logs

1. Each service has a "Logs" tab in Railway
2. View real-time logs for debugging
3. Set up health checks for each service

## Troubleshooting

### Backend fails to start
- Check environment variables are set correctly
- Verify database connections
- Check logs for specific errors

### Frontend can't connect to backend
- Verify REACT_APP_API_URL is correct
- Check CORS settings in backend
- Ensure backend service is running

### HAPI FHIR connection issues
- Verify FHIR_SERVER_URL is accessible
- Check HAPI FHIR service logs
- Ensure PostgreSQL database is initialized

### Database connection errors
- Verify Railway PostgreSQL services are running
- Check connection string format
- Ensure database credentials are correct

## Cost Optimization

1. Railway offers $5 free credit per month
2. Use the "Hobby" plan for development
3. Monitor resource usage in Railway dashboard
4. Consider scaling down services when not in use

## Next Steps

1. Set up custom domains (optional)
2. Configure CI/CD with GitHub Actions
3. Set up monitoring and alerts
4. Configure backups for databases
5. Implement proper secrets management

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- HAPI FHIR Documentation: https://hapifhir.io

## Support

For issues specific to this deployment:
1. Check Railway logs
2. Review environment variables
3. Verify all services are running
4. Check database connections

For Railway-specific issues, visit: https://help.railway.app
