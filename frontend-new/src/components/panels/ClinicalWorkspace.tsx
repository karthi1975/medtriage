/**
 * ClinicalWorkspace — context-sensitive surface above the chat.
 *
 *   - When NO patient is in context: today's appointments horizontal strip
 *     (the MA's shift agenda).
 *   - When a patient IS in context: a slim PatientBanner + a 2-column grid
 *     of TriagePanel | OrdersPanel.
 *
 * Sized to ~280-300px tall so the chat below stays usable. Below the `md`
 * breakpoint the two clinical panels stack vertically.
 */
import React from 'react';
import { Box, Stack } from '@mui/material';
import { useChat } from '../../context/ChatContext';
import { TodayAppointmentsPane } from './TodayAppointmentsPane';
import { TriagePanel } from './TriagePanel';
import { OrdersPanel } from './OrdersPanel';
import { PatientCard } from './PatientCard';
import type { ChatMessage } from '../../types';

export const ClinicalWorkspace: React.FC = () => {
  const { messages, currentPatient } = useChat();

  // Pull the latest assistant message metadata — that's where triage +
  // testingStatus + slots accumulate. Walking from the end is cheaper than
  // .reverse() for typical short threads.
  const latestMetadata = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.metadata) return m.metadata;
    }
    return undefined;
  })() as ChatMessage['metadata'] | undefined;

  // No patient context → show the agenda strip (Sarah picks the next one).
  if (!currentPatient) {
    return <TodayAppointmentsPane height={196} />;
  }

  // Patient in context → comprehensive PatientCard + Triage | Orders side-by-side.
  return (
    <Stack spacing={0.75} sx={{ flexShrink: 0 }}>
      <PatientCard patient={currentPatient} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 0.75,
        }}
      >
        <TriagePanel triage={latestMetadata?.triage} height={210} />
        <OrdersPanel testingStatus={latestMetadata?.testingStatus} height={210} />
      </Box>
    </Stack>
  );
};

export default ClinicalWorkspace;
