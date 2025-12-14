# MediChat Phase 2: Expansion & Enhancement Plan

## Executive Summary

Phase 2 builds upon the fully functional Phase 1 system to expand capabilities, improve user experience, and add enterprise features. This phase focuses on scalability, additional specialties, enhanced features, and production readiness.

**Timeline:** 8-12 weeks
**Phase 1 Foundation:** 5 specialties, 500 patients, 50 providers, 21 facilities

---

## Phase 2 Objectives

1. **Expand Medical Coverage** - Add 15 specialties (total 20)
2. **Patient Self-Service** - Patient portal for self-scheduling
3. **Communication Layer** - SMS/Email notifications
4. **Authentication & Authorization** - Role-based access control
5. **Real-time Updates** - WebSocket for live slot availability
6. **Provider Tools** - Provider dashboard for schedule management
7. **Analytics & Reporting** - Triage insights, appointment metrics
8. **ML Enhancement** - Predictive triage and slot optimization

---

## Phase 2.1: Additional Specialties (Weeks 1-2)

### New Specialties (15)

**Currently:** 5 specialties (Family Medicine, Cardiology, Orthopedics, Dermatology, Mental Health)

**Add:**
6. Pediatrics
7. OB/GYN (Obstetrics & Gynecology)
8. Neurology
9. Gastroenterology
10. Pulmonology
11. Endocrinology
12. Ophthalmology
13. ENT (Ear, Nose, Throat)
14. Urology
15. Nephrology
16. Rheumatology
17. Hematology/Oncology
18. Infectious Disease
19. Physical Medicine & Rehabilitation
20. Allergy & Immunology

### Implementation Tasks

1. **Update Configuration Files**
   ```json
   // data_generation/config/specialties.json
   {
     "specialties": [
       ...existing 5...,
       {
         "id": 6,
         "name": "Pediatrics",
         "snomed_code": "394537008",
         "common_conditions": [
           {"code": "J06.9", "display": "Upper respiratory infection"},
           {"code": "A49.9", "display": "Bacterial infection"},
           {"code": "H66.90", "display": "Otitis media"}
         ],
         "age_groups": ["0-17"],
         "visit_duration_minutes": {"new": 30, "followup": 15}
       },
       ...14 more...
     ]
   }
   ```

2. **Expand Provider Pool**
   - Generate 150 new providers (10 per specialty)
   - Total providers: 200 (current 50 + new 150)

3. **Expand Facilities**
   - Add 2 specialized facilities per region (14 total)
   - Total facilities: 35 (current 21 + new 14)

4. **Update Triage Logic**
   - Enhance `triage_service.py` specialty recommendation
   - Add specialty-specific red flags
   - Update RAG knowledge base with specialty guidelines

5. **Frontend Updates**
   - Update specialty selector in SchedulingPanel
   - Add specialty filter to provider search
   - Update specialty icons/badges

**Success Criteria:**
- ✅ 20 specialties seeded in database
- ✅ 200 providers active
- ✅ 35 facilities operational
- ✅ Triage recommends correct specialty 90%+ accuracy

---

## Phase 2.2: Patient Self-Scheduling Portal (Weeks 3-5)

### Features

**Patient Portal:**
1. User registration/login (email + password)
2. Personal health dashboard
3. View upcoming appointments
4. Schedule new appointments (self-triage or direct booking)
5. Cancel/reschedule appointments
6. View medical history
7. Manage profile and preferences

### Implementation

#### Backend Components

**1. Authentication Service**
```python
# auth_service.py
- register_patient()
- login_patient()
- refresh_token()
- reset_password()
- verify_email()
```

**2. Patient Session Management**
```python
# session_service.py
- create_session()
- validate_session()
- end_session()
- get_active_appointments()
```

**3. Appointment Management**
```python
# appointment_service.py
- get_my_appointments()
- cancel_appointment()
- reschedule_appointment()
- request_appointment()
```

**4. New API Endpoints**
```python
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/reset-password
GET    /api/v1/patient/dashboard
GET    /api/v1/patient/appointments
DELETE /api/v1/patient/appointments/{id}
PUT    /api/v1/patient/appointments/{id}/reschedule
POST   /api/v1/patient/triage/self-assess
```

#### Frontend Components

**1. Patient Portal Pages**
- `PatientLogin.js` - Login/registration form
- `PatientDashboard.js` - Overview of appointments, health summary
- `MyAppointments.js` - List of past/future appointments
- `SelfTriage.js` - Patient-facing triage assessment
- `BookAppointment.js` - Patient direct booking
- `Profile.js` - Manage patient information

**2. Authentication Context**
```javascript
// AuthContext.js
- useAuth() hook
- <AuthProvider> wrapper
- Protected route component
```

**Dependencies:**
- JWT for tokens (pyjwt)
- Bcrypt for password hashing (bcrypt)
- Email service (SendGrid or AWS SES)

**Success Criteria:**
- ✅ Patients can self-register
- ✅ Secure login with JWT
- ✅ Patients view their appointments
- ✅ Patients schedule without MA assistance
- ✅ Session management (30-minute expiry)

---

## Phase 2.3: Communication & Notifications (Weeks 4-6)

### Features

1. **SMS Notifications**
   - Appointment confirmation
   - Appointment reminder (24h before)
   - Cancellation confirmation
   - Waitlist notification

2. **Email Notifications**
   - Appointment confirmation email
   - Appointment details with calendar invite (.ics)
   - Reminder emails (24h + 2h before)
   - Pre-visit instructions

3. **In-App Notifications**
   - Real-time appointment status updates
   - Message center for provider communications

### Implementation

#### Backend

**1. Notification Service**
```python
# notification_service.py
class NotificationService:
    def send_appointment_confirmation(appointment_id)
    def send_appointment_reminder(appointment_id)
    def send_cancellation_notice(appointment_id)
    def send_waitlist_alert(patient_id, slot)
```

**2. SMS Integration (Twilio)**
```python
# sms_service.py
from twilio.rest import Client

class SMSService:
    def __init__(self, account_sid, auth_token)
    def send_sms(to_number, message)
    def send_bulk_sms(recipients, message)
```

**3. Email Integration (SendGrid)**
```python
# email_service.py
from sendgrid import SendGridAPIClient

class EmailService:
    def send_appointment_email(patient_email, appointment_data)
    def generate_calendar_invite(appointment_data) # .ics file
    def send_reminder_email(patient_email, appointment_data)
```

**4. Scheduled Jobs**
```python
# scheduler.py (using APScheduler)
- Daily job: Send reminders for appointments tomorrow
- Hourly job: Send 2-hour reminders
- Weekly job: Send follow-up surveys
```

#### Database

**New Tables:**
```sql
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    type VARCHAR(50), -- sms, email, in_app
    status VARCHAR(20), -- pending, sent, failed
    message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_patient ON notifications(patient_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'pending';
```

#### Frontend

**1. Notification Components**
- `NotificationBadge.js` - Unread count
- `NotificationList.js` - List all notifications
- `NotificationSettings.js` - Preferences (SMS/Email on/off)

**Success Criteria:**
- ✅ Appointment confirmation sent within 1 minute
- ✅ SMS delivery rate >95%
- ✅ Email delivery rate >98%
- ✅ 24h reminders reduce no-shows by 30%+

---

## Phase 2.4: Real-time Slot Updates (Week 5-6)

### Features

- Live slot availability updates
- Concurrent booking prevention (enhanced)
- Real-time waitlist alerts
- Provider schedule changes reflected immediately

### Implementation

#### Backend

**1. WebSocket Server**
```python
# websocket_server.py
from fastapi import WebSocket

@app.websocket("/ws/slots/{specialty_id}")
async def slot_updates(websocket: WebSocket, specialty_id: int):
    await websocket.accept()
    # Subscribe to slot changes for specialty
    # Broadcast updates when slots change
```

**2. Redis Pub/Sub**
```python
# redis_pubsub.py
import redis

class SlotUpdatePublisher:
    def __init__(self, redis_client):
        self.redis = redis_client

    def publish_slot_update(specialty_id, slot_data):
        self.redis.publish(f"slots:{specialty_id}", json.dumps(slot_data))
```

**3. Event-Driven Updates**
```python
# When appointment is booked/cancelled:
@app.post("/api/v1/scheduling/book")
async def book_appointment(...):
    # ... existing booking logic ...

    # Trigger slot update event
    slot_publisher.publish_slot_update(
        specialty_id=request.specialty_id,
        slot_data={"action": "booked", "slot_datetime": ...}
    )
```

#### Frontend

**1. WebSocket Client**
```javascript
// useSlotUpdates.js
export const useSlotUpdates = (specialtyId) => {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8002/ws/slots/${specialtyId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setSlots(prevSlots => updateSlots(prevSlots, update));
    };

    return () => ws.close();
  }, [specialtyId]);

  return slots;
};
```

**2. Live Slot Display**
- Green indicator for "Just became available!"
- Red indicator for "Just booked"
- Auto-refresh recommendation list

**Dependencies:**
- Redis (for pub/sub)
- WebSocket support in FastAPI
- React WebSocket hooks

**Success Criteria:**
- ✅ Slot updates delivered <1 second
- ✅ No double-bookings under concurrent load
- ✅ WebSocket connection stable >24 hours

---

## Phase 2.5: Provider Dashboard (Weeks 7-8)

### Features

1. **Schedule Management**
   - View daily/weekly/monthly schedule
   - Block time slots (vacation, meetings)
   - Add custom availability
   - Set recurring schedules

2. **Patient Management**
   - View upcoming patients
   - Access patient history before appointment
   - Add clinical notes after visit
   - Flag patients for follow-up

3. **Preferences**
   - Update urgency slot quotas
   - Set patient type preferences
   - Configure appointment types

4. **Analytics**
   - Appointment volume trends
   - No-show rates
   - Patient satisfaction scores
   - Revenue metrics

### Implementation

#### Backend

**New Endpoints:**
```python
GET    /api/v1/provider/schedule/{date}
POST   /api/v1/provider/schedule/block-time
PUT    /api/v1/provider/schedule/availability
GET    /api/v1/provider/patients/upcoming
POST   /api/v1/provider/patients/{id}/notes
GET    /api/v1/provider/analytics/dashboard
```

**New Services:**
```python
# provider_service.py
class ProviderService:
    def get_schedule(provider_id, date_range)
    def block_time_slot(provider_id, datetime, duration, reason)
    def update_availability(provider_id, schedule_data)
    def get_upcoming_patients(provider_id, days_ahead)
    def add_clinical_note(provider_id, patient_id, note)
```

#### Frontend

**New Pages:**
- `ProviderLogin.js`
- `ProviderDashboard.js`
- `ScheduleView.js` (calendar component)
- `PatientQueue.js`
- `ProviderSettings.js`
- `ProviderAnalytics.js`

**Dependencies:**
- FullCalendar.js or React-Big-Calendar
- Chart.js for analytics

**Success Criteria:**
- ✅ Providers can block 95%+ of desired time slots
- ✅ Schedule view loads <500ms
- ✅ Providers access patient history seamlessly

---

## Phase 2.6: Analytics & Reporting (Week 9)

### Features

**Admin Dashboard:**
1. System-wide metrics
   - Total appointments (by status, specialty, urgency)
   - Average wait times
   - Slot utilization rates
   - Geographic distribution

2. Triage Analytics
   - Priority distribution over time
   - Specialty recommendation accuracy
   - Most common symptoms
   - Red flag frequency

3. Scheduling Analytics
   - Booking conversion rates
   - Average match scores
   - Slots filled vs available
   - Peak booking times

4. Provider Performance
   - Appointment volume per provider
   - No-show rates by provider
   - Patient ratings
   - Schedule adherence

### Implementation

**Backend:**
```python
# analytics_service.py
class AnalyticsService:
    def get_system_metrics(date_range)
    def get_triage_insights(date_range)
    def get_scheduling_metrics(specialty_id, date_range)
    def get_provider_performance(provider_id, date_range)
    def export_report(report_type, format='csv')
```

**Frontend:**
- `AdminDashboard.js`
- `TriageAnalytics.js`
- `SchedulingMetrics.js`
- `ProviderPerformance.js`

**Visualizations:**
- Line charts (trend over time)
- Pie charts (distribution)
- Heat maps (geographic, time-of-day)
- Tables (detailed data)

---

## Phase 2.7: ML Enhancements (Weeks 10-12)

### Features

1. **Predictive Triage**
   - Train model on historical triage data
   - Predict urgency level from symptoms
   - Suggest specialty based on patterns
   - Confidence scoring

2. **Slot Optimization**
   - ML-based slot scoring (replace rule-based)
   - Learn from booking patterns
   - Predict no-show likelihood
   - Optimize slot allocation

3. **Chatbot Enhancement**
   - Fine-tune GPT on medical triage data
   - Multi-turn conversation support
   - Contextual follow-up questions
   - Symptom clarification

### Implementation

**1. Triage Prediction Model**
```python
# ml_models/triage_predictor.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

class TriagePredictor:
    def __init__(self):
        self.model = RandomForestClassifier()

    def train(self, historical_data):
        # Features: symptoms, age, existing conditions
        # Target: priority level
        X, y = self.preprocess(historical_data)
        self.model.fit(X, y)

    def predict(self, symptoms, patient_context):
        features = self.extract_features(symptoms, patient_context)
        prediction = self.model.predict_proba(features)
        return {
            'priority': self.model.classes_[prediction.argmax()],
            'confidence': prediction.max()
        }
```

**2. Slot Optimization Model**
```python
# ml_models/slot_optimizer.py
class SlotOptimizer:
    def score_slot(self, slot, patient, context):
        # Learn weights from historical bookings
        # Predict patient satisfaction
        # Predict no-show likelihood
        return composite_score
```

**3. RAG Enhancement**
```python
# Expand RAG knowledge base
- Add 10,000+ medical guidelines
- Specialty-specific protocols
- Tribal knowledge documents
- Historical successful bookings
```

**Success Criteria:**
- ✅ Triage prediction accuracy >85%
- ✅ Slot recommendation satisfaction >90%
- ✅ No-show prediction precision >70%

---

## Phase 2 Infrastructure Requirements

### New Services

1. **Redis** - Caching, pub/sub, session storage
2. **Celery** - Background jobs (notifications, reminders)
3. **RabbitMQ** - Message queue for async tasks
4. **Elasticsearch** - Full-text search (patient records, notes)
5. **Prometheus + Grafana** - Monitoring and metrics

### Updated docker-compose.yml

```yaml
services:
  # Existing services...

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  celery-worker:
    build: .
    command: celery -A celery_app worker --loglevel=info
    depends_on: [redis, postgres-tribal]

  celery-beat:
    build: .
    command: celery -A celery_app beat --loglevel=info
    depends_on: [redis]

  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
    ports: ["9200:9200"]

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
    depends_on: [prometheus]
```

---

## Phase 2 Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Additional Specialties | 15 specialties, 150 providers, 14 facilities |
| 3-5 | Patient Portal | Auth, self-scheduling, dashboard |
| 4-6 | Notifications | SMS/Email integration, reminders |
| 5-6 | Real-time Updates | WebSocket, Redis pub/sub |
| 7-8 | Provider Dashboard | Schedule mgmt, patient queue, analytics |
| 9 | Analytics & Reporting | Admin dashboard, insights |
| 10-12 | ML Enhancements | Predictive models, RAG expansion |

---

## Phase 2 Success Metrics

**User Adoption:**
- 1,000+ registered patients
- 500+ self-scheduled appointments
- 200 active providers using dashboard

**System Performance:**
- API latency <200ms (p95)
- WebSocket uptime >99.5%
- Notification delivery rate >97%

**Clinical Quality:**
- Triage accuracy >90%
- Scheduling satisfaction >4.5/5
- No-show rate <15%

**Technical:**
- Zero critical bugs
- Test coverage >80%
- Documentation complete

---

## Phase 2 Cost Estimate

**Development:**
- Backend engineer (12 weeks × $8k/week): $96k
- Frontend engineer (12 weeks × $7k/week): $84k
- ML engineer (4 weeks × $10k/week): $40k
- QA engineer (8 weeks × $5k/week): $40k
**Total Development:** $260k

**Infrastructure (Monthly):**
- AWS EC2 (3× t3.medium): $150
- RDS PostgreSQL (db.t3.medium): $100
- Redis ElastiCache: $50
- SendGrid (10k emails): $15
- Twilio (5k SMS): $40
- OpenAI API: $200
**Total Infrastructure:** $555/month

**Grand Total:** $260k + $7k/year

---

## Phase 2 Risks & Mitigation

**Risk 1: ML Model Accuracy**
- Mitigation: Start with rule-based, gradually introduce ML, A/B test

**Risk 2: Notification Delivery Failures**
- Mitigation: Implement retry logic, use multiple providers

**Risk 3: WebSocket Scalability**
- Mitigation: Horizontal scaling, load balancer, connection pooling

**Risk 4: Patient Portal Adoption**
- Mitigation: MA training, patient education, incentives

---

**Phase 2 Status:** 📋 Planning Complete | Ready for Implementation

**Next Step:** Get approval for Phase 2 budget and timeline, then begin with 2.1 (Additional Specialties)
