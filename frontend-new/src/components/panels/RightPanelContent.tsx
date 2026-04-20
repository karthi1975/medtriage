/**
 * ChatView right-panel content.
 *
 * Extracted from ChatView.tsx so both the legacy and the M3 chat shells
 * render the same workflow surfaces (DetailsPanel, ProtocolActivationCard,
 * TestOrderingTimeline, AppointmentSchedulingPanel, PatientSummaryPanel).
 *
 * This component is render-only — all state comes from contexts, so it has
 * no props. Drop it inside whatever layout container the shell provides.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useChat } from '../../context/ChatContext';
import { useWorkflow } from '../../context/WorkflowContext';
import { PatientSummaryPanel } from './PatientSummaryPanel';
import { DetailsPanel } from './DetailsPanel';
import ProtocolActivationCard from '../intelligent-triage/ProtocolActivationCard';
import TestOrderingTimeline from '../intelligent-triage/TestOrderingTimeline';
import { AppointmentSchedulingPanel } from '../intelligent-triage/AppointmentSchedulingPanel';

export const RightPanelContent: React.FC = () => {
  const { messages, currentPatient } = useChat();
  const {
    state: workflowState,
    markActionComplete,
    addScheduledTest,
    markTestComplete,
    setSelectedAppointment,
  } = useWorkflow();

  const lastMessageWithMetadata = [...messages]
    .reverse()
    .find((msg) => msg.role === 'assistant' && msg.metadata);

  if (lastMessageWithMetadata?.metadata) {
    const metadata = lastMessageWithMetadata.metadata;
    return (
      <>
        {metadata.patient?.patient && (
          <Box mb={2} pb={2} borderBottom="1px solid" borderColor="divider">
            <Typography variant="h5" gutterBottom>
              {metadata.patient.patient.name ?? 'Patient Details'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {metadata.patient.patient.id} • {metadata.patient.patient.age ?? 'Unknown'}y •{' '}
              {metadata.patient.patient.gender ?? 'Unknown'}
            </Typography>
          </Box>
        )}

        <DetailsPanel metadata={metadata} />

        {workflowState.activeWorkflow && workflowState.showProtocolCard && (
          <Box mt={3}>
            <ProtocolActivationCard
              triageResult={workflowState.activeWorkflow}
              onActionComplete={markActionComplete}
              completedActions={workflowState.completedActions}
            />
          </Box>
        )}

        {workflowState.activeWorkflow &&
          workflowState.showTestOrdering &&
          !workflowState.showAppointmentScheduling && (
            <Box mt={3}>
              <TestOrderingTimeline
                triageResult={workflowState.activeWorkflow}
                scheduledTests={workflowState.scheduledTests}
                completedTests={workflowState.completedTests}
                onScheduleTest={(test, date, time) => {
                  addScheduledTest({
                    test_name: test.test,
                    test_type: test.type || 'laboratory',
                    scheduled_date: date,
                    scheduled_time: time,
                    fasting_required: test.fasting || false,
                    reason: test.reason,
                    status: 'scheduled',
                    scheduled_at: new Date().toISOString(),
                  });
                }}
                onMarkTestComplete={markTestComplete}
                onEmailInstructions={() => console.log('Email instructions')}
              />
            </Box>
          )}

        {workflowState.activeWorkflow && workflowState.showAppointmentScheduling && (
          <Box mt={3}>
            <AppointmentSchedulingPanel
              triageResult={workflowState.activeWorkflow}
              onAppointmentBooked={setSelectedAppointment}
            />
          </Box>
        )}
      </>
    );
  }

  if (currentPatient) {
    return (
      <>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Patient Summary
        </Typography>
        <PatientSummaryPanel patient={currentPatient} />
      </>
    );
  }

  return (
    <Box textAlign="center" mt={8}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No Patient Selected
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Start a conversation to look up a patient or describe symptoms
      </Typography>
    </Box>
  );
};

export default RightPanelContent;
