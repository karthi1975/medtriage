/**
 * Main Chat View Page
 * Primary MA interface with chat and context panels
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useMASession } from '../context/MASessionContext';
import { useChat } from '../context/ChatContext';
import { useWorkflow } from '../context/WorkflowContext';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';
import { PatientSummaryPanel } from '../components/panels/PatientSummaryPanel';
import ProtocolActivationCard from '../components/intelligent-triage/ProtocolActivationCard';
import TestOrderingTimeline from '../components/intelligent-triage/TestOrderingTimeline';
import { AppointmentSchedulingPanel } from '../components/intelligent-triage/AppointmentSchedulingPanel';
import intelligentTriageApi from '../services/intelligentTriageApi';

export const ChatView: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Top App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MediChat MA Assistant
          </Typography>

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

        {/* Right: Context Panels (40%) */}
        <Box
          flex={2}
          p={2}
          bgcolor="background.default"
          sx={{ overflowY: 'auto' }}
        >
          {/* Show Intelligent Triage Components if Protocol Activated */}
          {workflowState.activeWorkflow && workflowState.showProtocolCard && (
            <ProtocolActivationCard
              triageResult={workflowState.activeWorkflow}
              onActionComplete={markActionComplete}
              completedActions={workflowState.completedActions}
            />
          )}

          {workflowState.activeWorkflow && workflowState.showTestOrdering && !workflowState.showAppointmentScheduling && (
            <TestOrderingTimeline
              triageResult={workflowState.activeWorkflow}
              scheduledTests={workflowState.scheduledTests}
              completedTests={workflowState.completedTests}
              onScheduleTest={(test, date, time) => {
                console.log('✅ Scheduling test:', test.test, date, time);

                // Add to scheduled tests in WorkflowContext
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

                // Show confirmation (you can add a toast/snackbar here)
                alert(`✅ Scheduled: ${test.test}\nDate: ${date}\nTime: ${time}\n\nTest has been added to your workflow.`);
              }}
              onMarkTestComplete={(test) => {
                console.log('✅ Marking test complete:', test.test_name);
                markTestComplete(test);
                alert(`✅ Test Completed: ${test.test_name}\n\nTest has been marked as complete.`);
              }}
              onEmailInstructions={() => {
                console.log('📧 Emailing instructions to patient');
                alert('📧 Patient instructions have been emailed!\n\n(Email functionality to be implemented)');
              }}
            />
          )}

          {/* Show Appointment Scheduling when all tests complete */}
          {workflowState.activeWorkflow && workflowState.showAppointmentScheduling && (
            <AppointmentSchedulingPanel
              triageResult={workflowState.activeWorkflow}
              onAppointmentBooked={(appointment) => {
                console.log('✅ Appointment booked:', appointment);
                setSelectedAppointment(appointment);
              }}
            />
          )}

          {/* Show Patient Summary if no workflow active */}
          {!workflowState.activeWorkflow && currentPatient && (
            <PatientSummaryPanel patient={currentPatient} />
          )}

          {/* Show welcome message if nothing to display */}
          {!workflowState.activeWorkflow && !currentPatient && (
            <Box textAlign="center" mt={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Patient Selected
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a conversation to look up a patient or describe symptoms
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
