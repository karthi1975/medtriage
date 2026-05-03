/**
 * RightPanelContent — slots-only rail.
 *
 * Per the EPIC-style restructure: the right rail's single purpose is now
 * **what to book**. Patient identity, triage assessment, and order
 * requirements live in the ClinicalWorkspace above the chat. The rail
 * shows the slot recommendations (best-match + compact alternatives), or
 * the booked appointment confirmation, or a friendly empty state.
 *
 * The legacy chat shell still uses DetailsPanel directly — this only
 * affects the m3 path.
 */
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useChat } from '../../context/ChatContext';
import { SlotRecommendations } from '../SlotRecommendations';
import { AppointmentConfirmation } from '../AppointmentConfirmation';

export const RightPanelContent: React.FC = () => {
  const theme = useTheme();
  const { messages } = useChat();

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
  const confirmation = metadata?.appointmentConfirmation;
  const triage = metadata?.triage;

  if (confirmation) {
    return (
      <Box>
        <AppointmentConfirmation
          confirmationNumber={confirmation.confirmation_number}
          appointmentId={confirmation.patient_id}
          provider={confirmation.provider_name}
          facility={confirmation.facility_name}
          slotDatetime={`${confirmation.date} ${confirmation.time}`}
          patientName={confirmation.patient_id}
        />
      </Box>
    );
  }

  if (slots && slots.length > 0) {
    return (
      <SlotRecommendations
        slots={slots}
        urgency={triage?.urgency ?? triage?.priority}
        onBookSlot={(slot) => {
          console.log('Booking slot:', slot);
          // TODO: POST /api/v1/scheduling/book once wired up
        }}
      />
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
