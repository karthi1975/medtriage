/**
 * Chat Messages Component
 * Displays conversation thread with embedded data panels
 */
import React, { useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Avatar, Stack, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import { SlotRecommendations } from '../SlotRecommendations';
import { AppointmentConfirmation } from '../AppointmentConfirmation';

export const ChatMessages: React.FC = () => {
  const { messages, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        p={4}
      >
        <SmartToyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Welcome to MediChat MA Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Start by entering a patient ID or describing symptoms.
          <br />
          I'll help you with triage, testing requirements, and appointment scheduling.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} p={2} sx={{ overflowY: 'auto', flex: 1 }}>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const timestamp = msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : '';

        return (
          <Box
            key={msg.id}
            display="flex"
            justifyContent={isUser ? 'flex-end' : 'flex-start'}
          >
            <Box
              display="flex"
              alignItems="flex-start"
              gap={1}
              maxWidth="75%"
              flexDirection={isUser ? 'row-reverse' : 'row'}
            >
              {/* Avatar */}
              <Avatar
                sx={{
                  bgcolor: isUser ? 'primary.main' : 'secondary.main',
                  width: 32,
                  height: 32,
                }}
              >
                {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
              </Avatar>

              {/* Message Card */}
              <Card
                sx={{
                  bgcolor: isUser ? 'primary.main' : 'background.paper',
                  color: isUser ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                  {/* Message Content */}
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>

                  {/* Embedded Metadata Panels */}
                  {msg.metadata?.triage && (
                    <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={2}>
                      <Typography variant="caption" fontWeight="bold">
                        Triage Assessment
                      </Typography>
                      <Chip
                        label={msg.metadata.triage.priority.toUpperCase()}
                        size="small"
                        color={
                          msg.metadata.triage.priority === 'emergency'
                            ? 'error'
                            : msg.metadata.triage.priority === 'urgent'
                            ? 'warning'
                            : 'success'
                        }
                        sx={{ ml: 1 }}
                      />
                      <Typography variant="body2" mt={1}>
                        {msg.metadata.triage.reasoning}
                      </Typography>
                    </Box>
                  )}

                  {msg.metadata?.testingStatus && (
                    <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={2}>
                      <Typography variant="caption" fontWeight="bold">
                        Testing Requirements
                      </Typography>
                      <Typography variant="body2" mt={1} sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.metadata.testingStatus.formatted_message}
                      </Typography>
                    </Box>
                  )}

                  {/* Appointment Slots */}
                  {msg.metadata?.availableSlots && msg.metadata.availableSlots.length > 0 && (
                    <Box sx={{ color: 'text.primary' }}>
                      <SlotRecommendations slots={msg.metadata.availableSlots} />
                    </Box>
                  )}

                  {/* Appointment Confirmation */}
                  {msg.metadata?.appointmentConfirmation && (
                    <Box sx={{ color: 'text.primary' }}>
                      <AppointmentConfirmation
                        confirmationNumber={msg.metadata.appointmentConfirmation.confirmation_number}
                        appointmentId={msg.metadata.appointmentConfirmation.patient_id}
                        provider={msg.metadata.appointmentConfirmation.provider_name}
                        facility={msg.metadata.appointmentConfirmation.facility_name}
                        slotDatetime={`${msg.metadata.appointmentConfirmation.date} ${msg.metadata.appointmentConfirmation.time}`}
                        patientName={msg.metadata.appointmentConfirmation.patient_id}
                      />
                    </Box>
                  )}

                  {/* Timestamp */}
                  <Typography variant="caption" display="block" mt={1} sx={{ opacity: 0.7 }}>
                    {timestamp}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );
      })}

      {/* Loading indicator */}
      {isLoading && (
        <Box display="flex" justifyContent="flex-start">
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <div ref={messagesEndRef} />
    </Stack>
  );
};
