/**
 * Main Chat View Page
 * Primary MA interface with chat and context panels.
 *
 * Hooks + effects are shared across both rendering paths. The component
 * branches at the return on theme mode: m3 renders a Material-3 shell using
 * the md3 primitives (TopAppBarSmall, SideSheet, M3 chat bubbles/composer);
 * legacy renders the original MUI layout unchanged.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { useTheme } from '@mui/material/styles';
import { useMASession } from '../context/MASessionContext';
import { useChat } from '../context/ChatContext';
import { useWorkflow } from '../context/WorkflowContext';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatMessagesM3 } from '../components/chat/ChatMessagesM3';
import { ChatInputM3 } from '../components/chat/ChatInputM3';
import { PatientSummaryPanel } from '../components/panels/PatientSummaryPanel';
import { DetailsPanel } from '../components/panels/DetailsPanel';
import { RightPanelContent } from '../components/panels/RightPanelContent';
import ProtocolActivationCard from '../components/intelligent-triage/ProtocolActivationCard';
import TestOrderingTimeline from '../components/intelligent-triage/TestOrderingTimeline';
import { AppointmentSchedulingPanel } from '../components/intelligent-triage/AppointmentSchedulingPanel';
import intelligentTriageApi from '../services/intelligentTriageApi';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { TopAppBarSmall, SideSheet } from '../components/md3';

export const ChatView: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const theme = useTheme();
  const [rightSheetOpen, setRightSheetOpen] = useState(true);
  const { session, logout } = useMASession();
  const { currentPatient, clearChat, messages } = useChat();
  const { state: workflowState, markActionComplete, setActiveWorkflow, addScheduledTest, markTestComplete, setSelectedAppointment, resetWorkflow } = useWorkflow();

  // Track which messages have been triaged to prevent duplicate processing
  const processedMessageIds = useRef<Set<number>>(new Set());

  // Track the current patient ID to detect changes
  const prevPatientIdRef = useRef<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Reset workflow when patient changes
  useEffect(() => {
    const currentPatientId = currentPatient?.id || null;

    // If patient changed (and it's not the initial load)
    if (prevPatientIdRef.current !== null && prevPatientIdRef.current !== currentPatientId) {
      console.log('[Workflow] Patient changed from', prevPatientIdRef.current, 'to', currentPatientId, '- resetting workflow');
      resetWorkflow();
      processedMessageIds.current.clear(); // Also clear processed messages
    }

    // Update the ref for next comparison
    prevPatientIdRef.current = currentPatientId;
  }, [currentPatient, resetWorkflow]);

  // Detect symptoms and trigger intelligent triage
  useEffect(() => {
    const detectAndTriageSymptoms = async () => {
      // Check if we have a patient and recent triage message
      if (!currentPatient || !session || messages.length === 0) return;

      const lastMessage = messages[messages.length - 1];
      const messageIndex = messages.length - 1;

      // Guard: Only process each message once
      if (processedMessageIds.current.has(messageIndex)) {
        console.log('[Intelligent Triage] Already processed message', messageIndex, '- skipping');
        return;
      }

      // Check if this is a triage response (contains triage metadata)
      if (lastMessage.role === 'assistant' && lastMessage.metadata?.triage) {
        // Mark this message as processed BEFORE triggering triage
        processedMessageIds.current.add(messageIndex);
        console.log('[Intelligent Triage] Processing new message', messageIndex);

        // Trigger intelligent triage
        try {
          const triageResult = await intelligentTriageApi.triggerIntelligentTriageFromChat(
            // Get the user's message that triggered this (second to last)
            messages.length > 1 ? messages[messages.length - 2].content : '',
            currentPatient,
            'Dr. Alexander Mitchell', // Provider name from facility context
            session.specialty_name
          );

          // Update workflow context
          setActiveWorkflow(triageResult);
        } catch (error) {
          console.error('Error triggering intelligent triage:', error);
          // Remove from processed set if it failed so it can be retried
          processedMessageIds.current.delete(messageIndex);
        }
      }
    };

    detectAndTriageSymptoms();
  }, [messages, currentPatient, session, setActiveWorkflow]);

  const handleLogout = () => {
    clearChat();
    logout();
    navigate('/');
  };

  if (!session) {
    return null;
  }

  if (mode === 'm3') {
    const canvasBg = theme.palette.m3?.surfaceContainerLow ?? theme.palette.background.default;
    return (
      <Box display="flex" flexDirection="column" height="100vh" sx={{ bgcolor: canvasBg }}>
        <Box sx={{ position: 'relative' }}>
          <TopAppBarSmall
          leading={
            <Box
              component="img"
              src="/synaptix-mark.svg"
              alt=""
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                boxShadow: '0 2px 6px -1px rgba(26,115,232,0.35)',
              }}
            />
          }
          title={
            <Typography variant="titleLarge" component="div" sx={{ letterSpacing: 0.5, lineHeight: 1 }}>
              <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>Synaptix</Box>
              <Box component="span" sx={{ fontWeight: 400, color: 'text.primary' }}>Schedule</Box>
            </Typography>
          }
          trailing={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="bodyMedium">{session.ma_name}</Typography>
                <Typography variant="labelSmall" color="text.secondary">
                  {session.facility_name} • {session.specialty_name}
                </Typography>
              </Box>
              {!rightSheetOpen && (
                <IconButton
                  onClick={() => setRightSheetOpen(true)}
                  aria-label="Open context panel"
                  title="Open context panel"
                >
                  <MenuOpenIcon />
                </IconButton>
              )}
              <IconButton onClick={handleLogout} aria-label="End shift" title="End shift">
                <LogoutIcon />
              </IconButton>
            </Stack>
          }
        />
          <Box
            aria-hidden
            sx={{
              height: 2,
              background: 'linear-gradient(90deg, #1A73E8 0%, #34A853 100%)',
              opacity: 0.85,
            }}
          />
        </Box>

        <Box display="flex" flex={1} overflow="hidden">
          <Box
            flex={1}
            display="flex"
            flexDirection="column"
            minWidth={0}
            sx={{ bgcolor: canvasBg }}
          >
            <ChatMessagesM3 />
            <ChatInputM3 />
          </Box>
          <SideSheet
            open={rightSheetOpen}
            onClose={() => setRightSheetOpen(false)}
            title="Patient context"
            width={420}
            headerTint
          >
            <RightPanelContent />
          </SideSheet>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Top App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              component="img"
              src="/synaptix-mark.svg"
              alt=""
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                boxShadow: '0 2px 6px -1px rgba(26,115,232,0.35)',
              }}
            />
            <Typography variant="h6" component="div" sx={{ letterSpacing: 0.5, lineHeight: 1 }}>
              <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>Synaptix</Box>
              <Box component="span" sx={{ fontWeight: 400, color: 'text.primary' }}>Schedule</Box>
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <Typography variant="body2">{session.ma_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {session.facility_name} • {session.specialty_name}
              </Typography>
            </Box>

            <IconButton color="inherit" onClick={handleLogout} title="End Shift">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box display="flex" flex={1} overflow="hidden">
        {/* Left: Chat Thread (60%) */}
        <Box
          flex={3}
          display="flex"
          flexDirection="column"
          borderRight="1px solid"
          borderColor="divider"
        >
          <ChatMessages />
          <ChatInput />
        </Box>

        {/* Right: Details Panel (40%) - Shows Triage, Tests, Scheduling */}
        <Box
          flex={2}
          p={2}
          bgcolor="background.default"
          sx={{ overflowY: 'auto' }}
        >
          {(() => {
            // Get the last assistant message with metadata
            const lastMessageWithMetadata = [...messages]
              .reverse()
              .find(msg => msg.role === 'assistant' && msg.metadata);

            // If we have metadata, show the DetailsPanel
            if (lastMessageWithMetadata?.metadata) {
              const metadata = lastMessageWithMetadata.metadata;

              return (
                <>
                  {/* Header with patient name if available */}
                  {metadata.patient?.patient && (
                    <Box mb={2} pb={2} borderBottom="1px solid" borderColor="divider">
                      <Typography variant="h5" gutterBottom>
                        {metadata.patient.patient.name ?? 'Patient Details'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {metadata.patient.patient.id} • {metadata.patient.patient.age ?? 'Unknown'}y • {metadata.patient.patient.gender ?? 'Unknown'}
                      </Typography>
                    </Box>
                  )}

                  {/* Show unified DetailsPanel with all metadata */}
                  <DetailsPanel metadata={metadata} />

                  {/* Legacy workflow components - keep for advanced triage workflows */}
                  {workflowState.activeWorkflow && workflowState.showProtocolCard && (
                    <Box mt={3}>
                      <ProtocolActivationCard
                        triageResult={workflowState.activeWorkflow}
                        onActionComplete={markActionComplete}
                        completedActions={workflowState.completedActions}
                      />
                    </Box>
                  )}

                  {workflowState.activeWorkflow && workflowState.showTestOrdering && !workflowState.showAppointmentScheduling && (
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
                            scheduled_at: new Date().toISOString()
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

            // Fallback: Show Patient Summary if patient selected but no metadata
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

            // Welcome message
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
          })()}
        </Box>
      </Box>
    </Box>
  );
};
