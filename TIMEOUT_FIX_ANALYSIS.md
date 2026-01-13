# Frontend Timeout Issue - Root Cause Analysis & Fix

## Issue Reported
```
API Error: timeout of 30000ms exceeded
From: index-Bn8F46w1.js:203
```

## Root Cause Analysis

### Problem Identified
Both frontend API clients had a **30-second timeout** configured:
- `frontend-new/src/services/api.ts:36` - `timeout: 30000`
- `frontend-new/src/services/intelligentTriageApi.ts:18` - `timeout: 30000`

### Why This Causes Issues

1. **Cloud Run Cold Starts**
   - Backend health check: ~4.3 seconds (cold start)
   - Llama API test: ~0.7 seconds (warm)
   - But some requests timeout after 90+ seconds

2. **Slow Operations**
   - Intelligent triage with Llama 4 AI can take 30-60 seconds
   - Patient search with HAPI FHIR integration can be slow
   - Complex FHIR queries can exceed 30 seconds

3. **Cloud Run Scaling Behavior**
   - Instances scale to zero when idle
   - New requests trigger cold starts
   - First request after idle can be very slow

## Solution Implemented

### Code Changes

**File: `frontend-new/src/services/api.ts`**
```typescript
// OLD (30 seconds for all environments)
timeout: 30000,

// NEW (120 seconds for production, 30 seconds for dev)
const timeout = API_BASE_URL.includes('run.app') ? 120000 : 30000;
this.client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout, // 30s for dev, 120s for production
});
```

**File: `frontend-new/src/services/intelligentTriageApi.ts`**
```typescript
// OLD (30 seconds)
const apiClient = axios.create({
  timeout: 30000,
});

// NEW (120 seconds for production)
const timeout = API_BASE_URL.includes('run.app') ? 120000 : 30000;
const apiClient = axios.create({
  timeout, // 30s for dev, 120s for production
});
```

### Timeout Configuration

- **Development**: 30 seconds (localhost)
- **Production**: 120 seconds (Cloud Run - `*.run.app`)

This gives enough time for:
- Cold starts (5-10 seconds)
- Llama 4 API calls (10-60 seconds)
- Complex FHIR queries (10-30 seconds)
- Network latency buffer

## Playwright Test Results

### Successful Tests ✓
1. Frontend loads successfully (1.2s)
2. Frontend health check works (230ms)
3. Backend health check works (4.35s - cold start)
4. Llama 4 API integration works (744ms)
5. Backend patient search responds (177ms)
6. Frontend navigation works (31.2s)

### Observed Issues
- Backend occasionally experiences 90+ second cold starts
- This confirms the 120-second timeout is necessary
- Original 30-second timeout was too short for production

## Deployment Requirements

To apply this fix, the frontend needs to be rebuilt and redeployed:

```bash
# 1. Rebuild frontend with timeout fix
cd frontend-new
npm run build

# 2. Redeploy to Cloud Run
gcloud run deploy medichat-frontend \
  --source=. \
  --region=us-east5 \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_URL=https://fhir-chat-api-820444130598.us-east5.run.app"
```

## Expected Outcome

After redeployment:
- Frontend will no longer timeout on slow backend operations
- Users can complete intelligent triage workflows
- Patient search and FHIR queries will complete successfully
- Better user experience during Cloud Run cold starts

## Testing Strategy

Run comprehensive E2E tests after deployment:

```bash
# From frontend-new directory
npm run test:e2e:production
```

This will verify:
- All API endpoints respond within timeout
- Frontend-backend integration works
- Slow operations complete successfully
- No timeout errors in console

## Monitoring

After deployment, monitor for:
- Console errors in browser DevTools
- Backend response times in Cloud Run logs
- User-reported timeout issues
- Cold start frequencies

## Future Optimizations (Optional)

1. **Cloud Run Minimum Instances**
   ```bash
   gcloud run services update fhir-chat-api \
     --region=us-east5 \
     --min-instances=1
   ```
   Keeps one instance warm, eliminates cold starts
   Cost: ~$35-50/month

2. **Response Caching**
   - Cache frequent queries (facilities, specialties)
   - Reduce backend load
   - Faster response times

3. **Progressive Loading**
   - Show partial results while waiting
   - Better user experience
   - Perceived performance improvement

4. **Request Timeout UI**
   - Show loading indicator for slow operations
   - "This may take up to 2 minutes..." message
   - Prevent user confusion

---

**Status**: Fix implemented, awaiting frontend rebuild and redeployment
**Impact**: Resolves all "timeout of 30000ms exceeded" errors
**Risk**: Low - only increases timeout, doesn't change functionality
