# Railway Quick Start - 5 Minutes to Deploy

This guide gets you up and running on Railway in 5 minutes.

## Before You Start

You need:
- Railway account: https://railway.app
- OpenAI API key
- GitHub repository with this code

## Step-by-Step Deployment

### 1. Push to GitHub (if not done already)

```bash
git init
git add .
git commit -m "Deploy to Railway"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway will create a service automatically

### 3. Add PostgreSQL Databases

Add **TWO** PostgreSQL databases:

**First Database (Tribal Knowledge):**
1. Click "+ New" → "Database" → "PostgreSQL"
2. Name: `postgres-tribal`
3. Copy the connection variables

**Second Database (FHIR - for HAPI server):**
1. Click "+ New" → "Database" → "PostgreSQL"
2. Name: `postgres-fhir`
3. Copy the connection variables

### 4. Configure Backend Environment Variables

Click on your main service → "Variables" tab → Add:

```
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
USE_RAG=True
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
TRIBAL_DB_HOST=${{postgres-tribal.PGHOST}}
TRIBAL_DB_PORT=${{postgres-tribal.PGPORT}}
TRIBAL_DB_NAME=${{postgres-tribal.PGDATABASE}}
TRIBAL_DB_USER=${{postgres-tribal.PGUSER}}
TRIBAL_DB_PASSWORD=${{postgres-tribal.PGPASSWORD}}
```

Note: We're using a public FHIR server initially. You can deploy your own HAPI FHIR later.

### 5. Deploy Backend

1. Click "Deploy" in Railway
2. Wait for build to complete (~2-3 minutes)
3. Click "Settings" → "Generate Domain"
4. Copy your backend URL (e.g., `https://medichat-backend.railway.app`)

### 6. Deploy Frontend (Optional)

To deploy the frontend:

1. Click "+ New" → "GitHub Repo"
2. Select same repository
3. Set "Root Directory" to `frontend`
4. Add environment variable:
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```
5. Click "Settings" → "Generate Domain"
6. Your frontend is now live

### 7. Initialize Database

Connect to postgres-tribal and run initialization:

1. Click on `postgres-tribal` service
2. Click "Data" tab
3. Click "Query"
4. Run your schema initialization SQL from `postgres-init/` directory

Or use the Railway CLI:
```bash
railway connect postgres-tribal
# Then run your SQL scripts
```

### 8. Test Your Deployment

Visit your backend URL + `/docs` to see the API documentation:
```
https://your-backend-url.railway.app/docs
```

Test the health endpoint:
```
https://your-backend-url.railway.app/health
```

## Quick Reference: Environment Variables

### Required Backend Variables
```
OPENAI_API_KEY          # Your OpenAI API key
FHIR_SERVER_URL         # FHIR server URL
TRIBAL_DB_HOST          # From Railway postgres-tribal
TRIBAL_DB_PORT          # From Railway postgres-tribal
TRIBAL_DB_NAME          # From Railway postgres-tribal
TRIBAL_DB_USER          # From Railway postgres-tribal
TRIBAL_DB_PASSWORD      # From Railway postgres-tribal
```

### Optional Backend Variables
```
OPENAI_MODEL            # Default: gpt-3.5-turbo
USE_RAG                 # Default: True
```

### Frontend Variables
```
REACT_APP_API_URL       # Your backend Railway URL
```

## Using Railway Variable References

Railway lets you reference other services' variables:
```
${{service-name.VARIABLE_NAME}}
```

Example:
```
TRIBAL_DB_HOST=${{postgres-tribal.PGHOST}}
```

This automatically uses the correct value from the postgres-tribal service.

## Deploying HAPI FHIR (Optional)

If you want your own HAPI FHIR server instead of the public one:

1. Click "+ New" → "Empty Service"
2. Name: `hapi-fhir`
3. Go to "Settings" → "Deploy"
4. Set "Source Image": `hapiproject/hapi:latest`
5. Add environment variables:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://${{postgres-fhir.PGHOST}}:${{postgres-fhir.PGPORT}}/${{postgres-fhir.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{postgres-fhir.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{postgres-fhir.PGPASSWORD}}
SPRING_DATASOURCE_DRIVERCLASSNAME=org.postgresql.Driver
SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect
```
6. Generate domain
7. Update backend's `FHIR_SERVER_URL` to this new domain + `/fhir`

## Viewing Logs

Click on any service → "Logs" tab to see real-time logs.

## Common Issues

**Backend won't start:**
- Check all environment variables are set
- View logs for specific error
- Ensure OpenAI API key is valid

**Database connection failed:**
- Verify database service is running
- Check variable references use `${{...}}` syntax
- Ensure postgres services are healthy

**Frontend can't connect:**
- Verify `REACT_APP_API_URL` is correct
- Check backend CORS settings
- Ensure backend is running

## Cost

Railway offers:
- $5 free credit per month
- Pay-as-you-go after that
- Typical cost for this app: $5-10/month

## Next Steps

1. Load sample patient data into FHIR server
2. Initialize tribal knowledge database
3. Set up custom domain
4. Configure CI/CD
5. Add monitoring

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Help: https://help.railway.app

## Files Created for Railway

This deployment includes:
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration
- `Procfile` - Start command
- Updated `config.py` - Railway-compatible settings

You're all set! Your application should now be running on Railway.
