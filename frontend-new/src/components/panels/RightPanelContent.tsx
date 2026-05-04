/**
 * RightPanelContent — slots-only rail.
 *
 * Renders one of three states:
 *   1. Booked → AppointmentConfirmation (either from chat metadata OR
 *      from a slot the MA just booked via this component)
 *   2. Slots available → SlotRecommendations with real /scheduling/book
 *      wiring (loading, success, error states all handled)
 *   3. Empty → friendly placeholder
 *
 * Patient identity, triage, and orders live in the ClinicalWorkspace above
 * the chat — this rail's single purpose is "what to book."
 */
import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert, useTheme } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useChat } from '../../context/ChatContext';
import { useMASession } from '../../context/MASessionContext';
import { SlotRecommendations } from '../SlotRecommendations';
import { AppointmentConfirmation } from '../AppointmentConfirmation';
import { apiService } from '../../services/api';
import { extractApiError } from '../../utils/apiError';

type LocalConfirmation = {
  confirmation_number: string;
  fhir_appointment_id?: string;
  date: string;
  time: string;
  provider_name: string;
  facility_name: string;
  patient_id: string;
};

export const RightPanelContent: React.FC = () => {
  const theme = useTheme();
  const { messages, currentPatient } = useChat();
  const { session } = useMASession();

  const [booking, setBooking] = useState(false);
  const [bookedLocal, setBookedLocal] = useState<LocalConfirmation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Latest assistant metadata — slots / confirmation accumulate here.
  let metadata: any = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && m.metadata) {
      metadata = m.metadata;
      break;
    }
  }

  const slots = metadata?.availableSlots;
  const remoteConfirmation = metadata?.appointmentConfirmation;
  const triage = metadata?.triage;

  // Local booking takes precedence over chat-supplied confirmation since
  // it represents the most recent action.
  const confirmation: LocalConfirmation | null =
    bookedLocal ||
    (remoteConfirmation
      ? {
          confirmation_number: remoteConfirmation.confirmation_number,
          fhir_appointment_id: remoteConfirmation.fhir_appointment_id,
          date: remoteConfirmation.date,
          time: remoteConfirmation.time,
          provider_name: remoteConfirmation.provider_name,
          facility_name: remoteConfirmation.facility_name,
          patient_id: remoteConfirmation.patient_id,
        }
      : null);

  const handleBook = async (slot: any) => {
    if (booking) return;
    if (!currentPatient?.id || !session?.specialty_id) {
      setErrorMsg('Missing patient or session context — please reload.');
      return;
    }
    setBooking(true);
    setErrorMsg(null);
    try {
      const result = await apiService.bookAppointment({
        provider_id: slot.provider?.provider_id,
        facility_id: slot.facility?.facility_id,
        specialty_id: session.specialty_id,
        patient_fhir_id: currentPatient.id,
        appointment_datetime: slot.slot_datetime,
        duration_minutes: slot.duration_minutes,
        urgency: triage?.urgency ?? triage?.priority ?? 'non-urgent',
        reason_for_visit: triage?.reasoning?.slice(0, 120),
        created_by: session.ma_name,
      });
      if (!result.success) {
        throw new Error(result.error || 'Booking failed');
      }
      const dt = new Date(slot.slot_datetime);
      setBookedLocal({
        confirmation_number: result.confirmation_number || 'PENDING',
        fhir_appointment_id: result.fhir_appointment_id,
        date: dt.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: dt.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        provider_name: slot.provider?.name,
        facility_name: slot.facility?.name,
        patient_id: currentPatient.id,
      });
    } catch (err) {
      const info = extractApiError(err, 'Could not book the slot');
      setErrorMsg(info.detail || info.message);
    } finally {
      setBooking(false);
    }
  };

  if (confirmation) {
    return (
      <Box>
        <AppointmentConfirmation
          confirmationNumber={confirmation.confirmation_number}
          appointmentId={confirmation.patient_id}
          provider={confirmation.provider_name}
          facility={confirmation.facility_name}
          slotDatetime={`${confirmation.date} ${confirmation.time}`}
          patientName={
            (currentPatient?.name && String(currentPatient.name).trim()) ||
            `Patient ${confirmation.patient_id}`
          }
        />
        <Snackbar
          open={Boolean(errorMsg)}
          autoHideDuration={6000}
          onClose={() => setErrorMsg(null)}
        >
          <Alert severity="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  if (slots && slots.length > 0) {
    return (
      <Box sx={{ position: 'relative' }}>
        <SlotRecommendations
          slots={slots}
          urgency={triage?.urgency ?? triage?.priority}
          onBookSlot={handleBook}
        />
        {booking && (
          <Box
            aria-live="polite"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              pt: 4,
              fontSize: 13,
              fontWeight: 600,
              color: 'primary.main',
              zIndex: 10,
              backdropFilter: 'blur(2px)',
            }}
          >
            Booking…
          </Box>
        )}
        <Snackbar
          open={Boolean(errorMsg)}
          autoHideDuration={6000}
          onClose={() => setErrorMsg(null)}
        >
          <Alert severity="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: 'text.secondary',
        py: 6,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: theme.palette.brand?.gradient ?? 'linear-gradient(135deg,#1A73E8,#34A853)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          mb: 1.5,
          opacity: 0.9,
        }}
      >
        <EventAvailableIcon />
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Available slots will appear here</Typography>
      <Typography sx={{ fontSize: 12, mt: 0.5, maxWidth: 260 }}>
        Once triage runs, the recommended appointment slots show up — you can book the best match in
        one tap.
      </Typography>
    </Box>
  );
};

export default RightPanelContent;
