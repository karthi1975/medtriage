/**
 * M3 chat thread — opt-in variant used when themeMode === 'm3'.
 *
 * Preserves all legacy message rendering (triage, testing, slot notifications,
 * appointment confirmation, loading spinner) and restyles with Material 3
 * tokens:
 *   - Bubble surfaces use theme.palette.chat.{assistant,user}
 *   - Asymmetric corner radius signals "tail" direction (M3 chat pattern)
 *   - Sub-panels on surfaceContainerLowest instead of rgba-black tint
 *   - Typography on M3 variants (bodyMedium / labelSmall)
 */
import React, { useEffect, useRef } from 'react';
import { Box, Typography, Avatar, Stack, useTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import { AppointmentConfirmation } from '../AppointmentConfirmation';
import { PriorityChip } from '../md3/Chips';
import type { PriorityChipLevel } from '../md3/Chips';

const PRIORITY_MAP: Record<string, PriorityChipLevel> = {
  emergency: 'emergency',
  critical: 'emergency',
  urgent: 'urgent',
  high: 'urgent',
  'semi-urgent': 'semiUrgent',
  semi_urgent: 'semiUrgent',
  medium: 'semiUrgent',
  moderate: 'semiUrgent',
  routine: 'nonUrgent',
  low: 'nonUrgent',
};

export const ChatMessagesM3: React.FC = () => {
  const { messages, isLoading } = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const subPanelBg = theme.palette.m3?.surfaceContainerLowest ?? 'rgba(0,0,0,0.04)';

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
        <Typography variant="titleLarge" color="text.secondary" gutterBottom>
          Welcome to SynaptixSchedule
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" textAlign="center" maxWidth={420}>
          Start by entering a patient ID or describing symptoms. I'll help with
          triage, order requirements, and appointment scheduling.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} p={2} sx={{ overflowY: 'auto', flex: 1 }}>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const timestamp = msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : '';
        const bubbleBg = isUser ? theme.palette.chat.user : theme.palette.chat.assistant;
        const bubbleRadius = isUser
          ? `${theme.corner.large}px ${theme.corner.large}px ${theme.corner.extraSmall}px ${theme.corner.large}px`
          : `${theme.corner.large}px ${theme.corner.large}px ${theme.corner.large}px ${theme.corner.extraSmall}px`;
        const triagePriority = msg.metadata?.triage?.priority;
        const priorityLevel: PriorityChipLevel | undefined = triagePriority
          ? PRIORITY_MAP[triagePriority.toLowerCase()] ?? 'semiUrgent'
          : undefined;

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
              maxWidth="78%"
              flexDirection={isUser ? 'row-reverse' : 'row'}
            >
              <Avatar
                sx={{
                  bgcolor: isUser ? 'primary.main' : 'secondary.main',
                  color: isUser ? 'primary.contrastText' : 'secondary.contrastText',
                  width: 32,
                  height: 32,
                }}
              >
                {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
              </Avatar>

              <Box
                sx={{
                  bgcolor: bubbleBg,
                  color: 'text.primary',
                  borderRadius: bubbleRadius,
                  px: 2,
                  py: 1.25,
                  boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
                  minWidth: 0,
                  animation: `sx-msg-in ${theme.motion.duration.medium2}ms ${theme.motion.easing.emphasizedDecel}`,
                  '@keyframes sx-msg-in': {
                    from: { opacity: 0, transform: `translateY(4px)` },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Typography variant="bodyMedium" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>

                {msg.metadata?.triage && (
                  <Box
                    mt={1.5}
                    sx={{
                      bgcolor: subPanelBg,
                      borderRadius: `${theme.corner.small}px`,
                      p: 1.5,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="labelLarge">Triage assessment</Typography>
                      {priorityLevel && (
                        <PriorityChip
                          level={priorityLevel}
                          label={triagePriority}
                          size="small"
                        />
                      )}
                    </Stack>
                    <Typography variant="bodySmall" color="text.secondary">
                      {msg.metadata.triage.reasoning}
                    </Typography>
                  </Box>
                )}

                {msg.metadata?.testingStatus && (
                  <Box
                    mt={1.5}
                    sx={{
                      bgcolor: subPanelBg,
                      borderRadius: `${theme.corner.small}px`,
                      p: 1.5,
                    }}
                  >
                    <Typography variant="labelLarge" sx={{ mb: 0.5, display: 'block' }}>
                      Order requirements
                    </Typography>
                    <Typography variant="bodySmall" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.metadata.testingStatus.formatted_message}
                    </Typography>
                  </Box>
                )}

                {msg.metadata?.availableSlots &&
                  msg.metadata.availableSlots.length > 0 && (
                    <Box
                      mt={1.5}
                      sx={{
                        bgcolor: theme.palette.m3?.primaryContainer ?? theme.palette.info.lighter,
                        color: theme.palette.m3?.onPrimaryContainer,
                        borderRadius: `${theme.corner.small}px`,
                        p: 1.5,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventAvailableIcon fontSize="small" />
                        <Typography variant="labelLarge">
                          {msg.metadata.availableSlots.length} appointment slot
                          {msg.metadata.availableSlots.length > 1 ? 's' : ''} found
                        </Typography>
                      </Stack>
                      <Typography
                        variant="bodySmall"
                        sx={{ mt: 0.5, opacity: 0.85 }}
                      >
                        View and book appointments in the right panel
                        {msg.metadata.testingStatus?.needs_urgent_testing &&
                          ' (complete required tests first)'}
                      </Typography>
                    </Box>
                  )}

                {msg.metadata?.appointmentConfirmation && (
                  <Box mt={1.5}>
                    <AppointmentConfirmation
                      confirmationNumber={
                        msg.metadata.appointmentConfirmation.confirmation_number
                      }
                      appointmentId={msg.metadata.appointmentConfirmation.patient_id}
                      provider={msg.metadata.appointmentConfirmation.provider_name}
                      facility={msg.metadata.appointmentConfirmation.facility_name}
                      slotDatetime={`${msg.metadata.appointmentConfirmation.date} ${msg.metadata.appointmentConfirmation.time}`}
                      patientName={msg.metadata.appointmentConfirmation.patient_id}
                    />
                  </Box>
                )}

                <Typography
                  variant="labelSmall"
                  display="block"
                  mt={1}
                  sx={{ opacity: 0.6 }}
                >
                  {timestamp}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}

      {isLoading && (
        <Box display="flex" justifyContent="flex-start">
          <Box
            sx={{
              bgcolor: theme.palette.chat.assistant,
              borderRadius: `${theme.corner.large}px ${theme.corner.large}px ${theme.corner.large}px ${theme.corner.extraSmall}px`,
              px: 2,
              py: 1.25,
            }}
          >
            <Typography variant="bodyMedium" color="text.secondary">
              Thinking…
            </Typography>
          </Box>
        </Box>
      )}

      <div ref={endRef} />
    </Stack>
  );
};
