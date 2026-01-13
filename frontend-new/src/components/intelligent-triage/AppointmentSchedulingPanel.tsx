/**
 * Appointment Scheduling Panel
 * Allows MA to schedule provider appointment after all tests are complete
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { SlotRecommendations } from '../SlotRecommendations';
import { AppointmentConfirmation } from '../AppointmentConfirmation';
import type { TriageResult } from '../../context/WorkflowContext';
import { useMASession } from '../../context/MASessionContext';
import { useChat } from '../../context/ChatContext';

interface AppointmentSchedulingPanelProps {
  triageResult: TriageResult;
  onAppointmentBooked?: (appointment: any) => void;
}

export const AppointmentSchedulingPanel: React.FC<AppointmentSchedulingPanelProps> = ({
  triageResult,
  onAppointmentBooked,
}) => {
  const { session } = useMASession();
  const { currentPatient } = useChat();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [showSlots, setShowSlots] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  const handleFindSlots = async () => {
    if (!currentPatient || !session) return;

    setLoading(true);
    try {
      // Map urgency to triage priority STRING (API expects string not number)
      const urgency = triageResult.urgency || 'non-urgent';
      let triagePriority = 'non-urgent';
      if (urgency === 'emergency') triagePriority = 'emergency';
      else if (urgency === 'urgent') triagePriority = 'urgent';
      else if (urgency === 'semi-urgent') triagePriority = 'semi-urgent';

      // Calculate preferred date range based on urgency
      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(today);

      if (urgency === 'emergency' || urgency === 'urgent') {
        endDate.setDate(endDate.getDate() + 2); // Next 2 days
      } else if (urgency === 'semi-urgent') {
        endDate.setDate(endDate.getDate() + 7); // Next week
      } else {
        endDate.setDate(endDate.getDate() + 14); // Next 2 weeks
      }

      const requestBody = {
        specialty_id: session.specialty_id,
        triage_priority: triagePriority,
        patient_fhir_id: currentPatient.id,  // ✅ Fixed: use .id not .fhir_id
        patient_region: 'Salt Lake',
        preferred_date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      };

      console.log('🔍 Searching for slots:', requestBody);

      // Call scheduling recommendation API
      const response = await fetch('http://localhost:8002/api/v1/scheduling/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('📅 Slot search response:', data);

      // Extract slot recommendations from response
      if (data.recommendations && data.recommendations.length > 0) {
        setAvailableSlots(data.recommendations);
        setShowSlots(true);
      } else {
        alert('No available slots found. Please try different criteria.');
      }
    } catch (error) {
      console.error('Error finding slots:', error);
      alert('Failed to find available slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: any) => {
    if (!currentPatient || !session) return;

    setLoading(true);
    try {
      const requestBody = {
        patient_fhir_id: currentPatient.id,  // ✅ Fixed: use .id not .fhir_id
        provider_id: slot.provider.provider_id,
        facility_id: slot.facility.facility_id,
        specialty_id: session.specialty_id,
        appointment_datetime: slot.slot_datetime,
        duration_minutes: slot.duration_minutes,
        urgency: triageResult.urgency || 'routine',
        reason_for_visit: triageResult.ma_summary || 'Follow-up appointment',
        created_by: session.ma_name || 'MA User',
      };

      console.log('📅 Booking appointment with request:', JSON.stringify(requestBody, null, 2));

      // Call appointment booking API
      const response = await fetch('http://localhost:8002/api/v1/scheduling/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log('📅 Booking response:', { status: response.status, data });

      if (!response.ok) {
        console.error('❌ Booking failed:', data);
        // Extract validation errors if they exist
        let errorMsg = 'Unknown error';
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
          } else {
            errorMsg = data.detail;
          }
        } else if (data.message) {
          errorMsg = data.message;
        }
        console.error('❌ Validation errors:', errorMsg);
        alert('Failed to book appointment: ' + errorMsg);
        return;
      }

      if (data.success) {
        setBookedAppointment({
          confirmationNumber: data.confirmation_number,
          appointmentId: data.appointment_id,
          provider: slot.provider,
          facility: slot.facility,
          slotDatetime: slot.slot_datetime,
          patientName: currentPatient.name,
        });
        setShowSlots(false);

        if (onAppointmentBooked) {
          onAppointmentBooked(data);
        }
      } else {
        alert('Failed to book appointment: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (bookedAppointment) {
    return (
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <AppointmentConfirmation {...bookedAppointment} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, boxShadow: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon sx={{ fontSize: 36, color: 'success.main', mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              ✅ Ready to Schedule Appointment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All required tests are complete
            </Typography>
          </Box>
        </Box>

        {/* Test Completion Status */}
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
          <Typography variant="body2" fontWeight={600}>
            All required pre-appointment tests have been completed successfully.
          </Typography>
        </Alert>

        {/* Patient and Provider Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {currentPatient?.name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Specialty
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {session?.specialty_name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Priority
              </Typography>
              <Chip
                label={triageResult.urgency?.toUpperCase() || 'ROUTINE'}
                size="small"
                color={
                  triageResult.urgency === 'emergency'
                    ? 'error'
                    : triageResult.urgency === 'urgent'
                    ? 'warning'
                    : 'success'
                }
              />
            </Box>
          </Stack>
        </Box>

        {/* Find Slots Button */}
        {!showSlots && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleFindSlots}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CalendarIcon />}
            sx={{ mb: 2 }}
          >
            {loading ? 'Finding Available Slots...' : 'Find Available Appointment Slots'}
          </Button>
        )}

        {/* Slot Recommendations */}
        {showSlots && availableSlots.length > 0 && (
          <Box>
            <SlotRecommendations slots={availableSlots} onBookSlot={handleBookSlot} />
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setShowSlots(false)}
              sx={{ mt: 2 }}
            >
              Search Again
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
