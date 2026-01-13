# Backend Performance Issue - Critical Finding

## 🔴 Root Cause Identified

The timeout issue is NOT just a frontend timeout problem. The **backend is extremely slow**.

### Test Results

| Endpoint | Response Time | Status |
|----------|--------------|--------|
| `/health` | 0.2s | ✅ Fast |
| `/api/v1/facilities` | **127 seconds (2min 7s)** | ❌ **CRITICAL** |
| `/api/v1/specialties` | Still running after 2+ minutes | ❌ **CRITICAL** |
| `/llama/test` | 60+ seconds (timed out) | ❌ **VERY SLOW** |
| HAPI FHIR (direct) | 0.9s | ✅ Fast |

**The backend facilities endpoint alone takes over 2 minutes to respond!**

---

## What's Wrong

### Current Situation
1. **Frontend timeout was 30 seconds** - Too short ❌
2. **Backend responses take 2+ minutes** - Way too slow ❌
3. **Database queries are hanging** - Needs investigation ❌

### What I Did

#### Round 1: Increased Frontend Timeout to 120s
- **Result**: Still not enough! Backend takes 127+ seconds

#### Round 2: Increased Frontend Timeout to 300s (5 minutes)
- **Files Modified**:
  - `frontend-new/src/services/api.ts` - timeout: 300000 (5 minutes)
  - `frontend-new/src/services/intelligentTriageApi.ts` - timeout: 300000 (5 minutes)
- **Built**: ✅ `index-DO08tUUY.js` (new build ready)
- **Status**: Ready to deploy

---

## How to Deploy the 5-Minute Timeout Fix

You'll need to re-authenticate and deploy:

```bash
# 1. Re-authenticate
gcloud auth login

# 2. Navigate to frontend directory
cd frontend-new

# 3. Build and push container
gcloud builds submit \
  --tag=us-east5-docker.pkg.dev/project-c78515e0-ee8f-4282-a3c/cloud-run-source-deploy/medichat-frontend:5min-timeout \
  --project=project-c78515e0-ee8f-4282-a3c

# 4. Deploy to Cloud Run
gcloud run deploy medichat-frontend \
  --image=us-east5-docker.pkg.dev/project-c78515e0-ee8f-4282-a3c/cloud-run-source-deploy/medichat-frontend:5min-timeout \
  --region=us-east5 \
  --project=project-c78515e0-ee8f-4282-a3c \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080
```

This will **temporarily fix** the timeout errors, but **won't solve the root cause**.

---

## 🎯 Real Solution: Fix Backend Performance

The backend is the bottleneck. Here's what needs to be fixed:

### Issue 1: Database Connection is Slow

The `/api/v1/facilities` endpoint queries the database:

```python
facilities = db.query(Facility).filter(Facility.active == True).all()
```

**This takes 2+ minutes!**

**Possible Causes**:
1. Cloud SQL connection from Cloud Run is slow
2. Database doesn't have proper indexes
3. Connection pooling not configured
4. Cold start loading all ORM models

### Issue 2: Llama API Calls Timeout

The `/llama/test` endpoint took 60+ seconds before timing out.

**Possible Causes**:
1. Llama 4 API is genuinely slow
2. Network issues to Vertex AI
3. Rate limiting
4. Backend timeout settings too short

---

## Immediate Fixes to Try

### Option 1: Keep Backend Warm (Eliminates Cold Starts)

```bash
gcloud run services update fhir-chat-api \
  --region=us-east5 \
  --min-instances=1
```

**Cost**: ~$35-50/month
**Benefit**: Eliminates 2+ minute cold starts

### Option 2: Add Caching

Add response caching for slow endpoints:

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Cache facilities for 5 minutes
_facilities_cache = None
_facilities_cache_time = None

@app.get("/api/v1/facilities")
async def get_facilities(db: Session = Depends(get_db)):
    global _facilities_cache, _facilities_cache_time

    # Return cached data if less than 5 minutes old
    if _facilities_cache and _facilities_cache_time:
        if datetime.now() - _facilities_cache_time < timedelta(minutes=5):
            return _facilities_cache

    # Otherwise, fetch fresh data
    facilities = db.query(Facility).filter(Facility.active == True).all()
    _facilities_cache = [/* format data */]
    _facilities_cache_time = datetime.now()

    return _facilities_cache
```

### Option 3: Optimize Database Connection

Check backend environment variables:

```bash
gcloud run services describe fhir-chat-api \
  --region=us-east5 \
  --format="value(spec.template.spec.containers[0].env)"
```

Look for:
- `DATABASE_URL` - Is it configured correctly?
- Connection pool settings
- Timeout configurations

### Option 4: Add Database Indexes

If facilities table doesn't have an index on `active`:

```sql
CREATE INDEX idx_facility_active ON facilities(active);
```

---

## Testing After Deployment

### 1. Test with 5-Minute Timeout

```bash
# Should now complete (slowly, but no timeout)
curl -w "\nTime: %{time_total}s\n" \
  https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/facilities
```

### 2. Monitor Logs

```bash
# Watch backend logs
gcloud run services logs tail fhir-chat-api --region=us-east5
```

Look for:
- Database connection errors
- Slow query warnings
- Timeout messages

### 3. Check Database Performance

```bash
# SSH into HAPI FHIR VM (which has database access)
gcloud compute ssh hapi-fhir-vm --zone=us-east5-a

# Check PostgreSQL
docker exec -it cloud-sql-proxy psql -h localhost -U hapiuser -d hapi

# Run query to check facilities
SELECT COUNT(*) FROM facilities;
SELECT * FROM facilities LIMIT 5;
```

---

## Summary

### Current Status
- ✅ Frontend timeout fix ready (5 minutes)
- ❌ Backend is extremely slow (2+ minutes per query)
- ⚠️ Temporary workaround ready, but root cause needs fixing

### What You Should Do

**Short Term** (Do this now):
1. Re-authenticate: `gcloud auth login`
2. Deploy the 5-minute timeout fix (commands above)
3. Test - timeouts should stop, but app will be very slow

**Long Term** (Fix the real issue):
1. Set `--min-instances=1` on backend to eliminate cold starts
2. Add caching for facilities and specialties endpoints
3. Investigate database connection performance
4. Optimize slow database queries
5. Check Llama API performance

### Expected Results

| Action | Timeout Errors | Response Time | Cost |
|--------|----------------|---------------|------|
| **5-min timeout** | ✅ Fixed | ❌ Still 2+ minutes | Free |
| **+ min-instances=1** | ✅ Fixed | ✅ Sub-second (after warm) | +$35-50/mo |
| **+ caching** | ✅ Fixed | ✅ Instant (cached) | Free |
| **+ DB optimization** | ✅ Fixed | ✅ <1 second | Free |

---

## Files Modified (Ready to Deploy)

1. `frontend-new/src/services/api.ts` - timeout: 300s
2. `frontend-new/src/services/intelligentTriageApi.ts` - timeout: 300s
3. `frontend-new/dist/assets/index-DO08tUUY.js` - new build with 5-min timeout

**Next Step**: Run the deployment commands above after `gcloud auth login`

---

**Priority**: 🔴 **HIGH** - Deploy 5-min timeout immediately, then optimize backend performance.
