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
import { Box, Typography, Avatar, Stack, useTheme, ButtonBase } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useChat } from '../../context/ChatContext';
import { useMASession } from '../../context/MASessionContext';
import { useTodayAppointments } from '../../hooks/useTodayAppointments';
import { format } from 'date-fns';

/**
 * Parse a backend timestamp safely. FastAPI's `datetime.utcnow().isoformat()`
 * returns a naive ISO string (no Z, no offset) — JS's Date constructor treats
 * that as LOCAL time, which makes a UTC backend show 6-7 hours off in MST.
 * Defensive fix: when no timezone marker is present, append 'Z' so it's
 * always interpreted as UTC, then `format` converts to the browser's local
 * time correctly.
 */
function parseChatTimestamp(ts: string): Date {
  const hasTzMarker = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(ts);
  return new Date(hasTzMarker ? ts : ts + 'Z');
}
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

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const WelcomeHero: React.FC = () => {
  const theme = useTheme();
  const { session } = useMASession();
  const { sendMessage } = useChat();
  // Subscribed to the same source as the appointments pane — both surfaces
  // refresh in lockstep, no duplicate request.
  const {
    appointments,
    isLoading: apptsLoading,
    error: apptsError,
  } = useTodayAppointments();
  const firstName = (session?.ma_name || '').split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const navy = theme.palette.brand?.navy ?? '#0B1340';

  const quickActions = [
    { icon: <PersonSearchIcon />, label: 'Pull up a patient', hint: 'by ID, name, or DOB', prompt: 'Pull up patient ' },
    { icon: <MedicalServicesIcon />, label: 'Run a protocol', hint: 'chest pain, stroke, dyspnea', prompt: 'Run chest pain protocol' },
    { icon: <EventNoteIcon />, label: "Today's schedule", hint: 'review queued appointments', prompt: "Show today's schedule" },
    { icon: <AutoAwesomeIcon />, label: 'Suggest follow-ups', hint: 'patients due for outreach', prompt: 'Suggest follow-up patients' },
  ];

  // Real numbers from the shared hook. We swap "This week" (would need a
  // separate stats fetch) for "Urgent" — same source, more actionable for an
  // MA scanning their shift.
  const todayCount = appointments.length;
  const pendingCount = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  ).length;
  const urgentCount = appointments.filter(
    (a) => a.urgency === 'emergency' || a.urgency === 'urgent',
  ).length;

  // When data hasn't arrived yet we show a tasteful em-dash; when it errored
  // we show "—" with the same treatment so nothing screams. The pane handles
  // surfacing the actual error.
  const fmt = (n: number) => (apptsLoading || apptsError ? '—' : String(n));

  const stats = [
    {
      label: 'Today',
      value: fmt(todayCount),
      sub: 'appointments',
      tone: theme.palette.primary.main,
    },
    {
      label: 'Pending',
      value: fmt(pendingCount),
      sub: 'pre-visit tasks',
      tone: theme.palette.priority?.urgent ?? theme.palette.warning.main,
    },
    {
      label: 'Urgent',
      value: fmt(urgentCount),
      sub: 'flagged today',
      // Only burn the eye with red when there's actually something urgent.
      tone:
        !apptsLoading && !apptsError && urgentCount > 0
          ? theme.palette.priority?.emergency ?? theme.palette.error.main
          : theme.palette.success.main,
    },
  ];

  return (
    <Box
      role="region"
      aria-label="Welcome"
      sx={{
        position: 'relative',
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, sm: 4 },
        py: { xs: 4, sm: 5 },
        background: `linear-gradient(180deg, ${theme.palette.m3?.surfaceContainerLow ?? '#F8FAFD'} 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      {/* Soft animated background blobs (respect prefers-reduced-motion) */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          '@media (prefers-reduced-motion: reduce)': { '& > *': { animation: 'none !important' } },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '55%',
            height: '70%',
            background: 'radial-gradient(circle, rgba(26,115,232,0.16), transparent 65%)',
            filter: 'blur(20px)',
            animation: 'sx-float1 14s ease-in-out infinite',
            '@keyframes sx-float1': {
              '0%,100%': { transform: 'translate(0,0) scale(1)' },
              '50%': { transform: 'translate(30px,20px) scale(1.08)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-20%',
            right: '-15%',
            width: '60%',
            height: '70%',
            background: 'radial-gradient(circle, rgba(52,168,83,0.14), transparent 65%)',
            filter: 'blur(20px)',
            animation: 'sx-float2 18s ease-in-out infinite',
            '@keyframes sx-float2': {
              '0%,100%': { transform: 'translate(0,0) scale(1)' },
              '50%': { transform: 'translate(-40px,-20px) scale(1.10)' },
            },
          }}
        />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 760, width: '100%' }}>
        {/* Synapse hero glyph */}
        <Box display="flex" justifyContent="center" mb={2.25}>
          <Box
            component="svg"
            width={92}
            height={92}
            viewBox="0 0 92 92"
            aria-hidden
            sx={{
              '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } },
            }}
          >
            <defs>
              <radialGradient id="sxHaloHero" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.35" />
                <stop offset="60%" stopColor={theme.palette.success.main} stopOpacity="0.12" />
                <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="46" cy="46" r="44" fill="url(#sxHaloHero)" />
            <Box
              component="circle"
              cx="28"
              cy="32"
              r="6"
              fill={theme.palette.primary.main}
              sx={{
                animation: 'sx-pulse 2.6s ease-in-out infinite',
                '@keyframes sx-pulse': {
                  '0%,100%': { opacity: 0.55, transform: 'scale(1)', transformOrigin: '28px 32px' },
                  '50%': { opacity: 1, transform: 'scale(1.18)', transformOrigin: '28px 32px' },
                },
              }}
            />
            <Box
              component="circle"
              cx="64"
              cy="60"
              r="6"
              fill={theme.palette.success.main}
              sx={{
                animation: 'sx-pulse2 2.6s ease-in-out 1.3s infinite',
                '@keyframes sx-pulse2': {
                  '0%,100%': { opacity: 0.55, transform: 'scale(1)', transformOrigin: '64px 60px' },
                  '50%': { opacity: 1, transform: 'scale(1.18)', transformOrigin: '64px 60px' },
                },
              }}
            />
            <Box
              component="path"
              d="M 28 38 C 28 56, 64 44, 64 54"
              stroke={theme.palette.primary.main}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="60"
              sx={{
                animation: 'sx-synapse 3s ease-in-out infinite',
                '@keyframes sx-synapse': {
                  '0%': { strokeDashoffset: 60, opacity: 0.2 },
                  '40%': { strokeDashoffset: 0, opacity: 1 },
                  '100%': { strokeDashoffset: -60, opacity: 0.2 },
                },
              }}
            />
          </Box>
        </Box>

        <Box textAlign="center" mb={1}>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: { xs: 26, sm: 32 },
              letterSpacing: '-0.02em',
              color: navy,
              lineHeight: 1.15,
            }}
          >
            {timeOfDayGreeting()}, {firstName}
          </Typography>
          <Typography variant="bodyMedium" color="text.secondary" sx={{ mt: 0.75 }}>
            {today} · Ready when you are.
          </Typography>
        </Box>

        {/* Stat tiles */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            mt: 3.5,
            mb: 3,
            mx: 'auto',
            maxWidth: 520,
          }}
        >
          {stats.map((s) => (
            <Box
              key={s.label}
              sx={{
                bgcolor: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.75,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Typography
                variant="labelSmall"
                component="div"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.10em', color: 'text.secondary' }}
              >
                {s.label}
              </Typography>
              <Typography
                component="div"
                sx={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontSize: 28,
                  fontWeight: 700,
                  color: s.tone,
                  lineHeight: 1.1,
                }}
              >
                {s.value}
              </Typography>
              <Typography variant="bodySmall" component="div" color="text.secondary">
                {s.sub}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Quick action tiles */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.25,
            maxWidth: 560,
            mx: 'auto',
          }}
        >
          {quickActions.map((q) => (
            <ButtonBase
              key={q.label}
              focusRipple
              onClick={() => sendMessage(q.prompt)}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                bgcolor: 'rgba(255,255,255,0.92)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.75,
                gap: 1.5,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 10px 24px -8px rgba(26,115,232,0.25), 0 2px 4px rgba(60,64,67,0.10)',
                  borderColor: 'primary.main',
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #E8F0FE 0%, #E8F5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  flexShrink: 0,
                }}
              >
                {q.icon}
              </Box>
              <Box
                sx={{
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                }}
              >
                <Typography
                  variant="bodyMedium"
                  component="div"
                  sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.25 }}
                >
                  {q.label}
                </Typography>
                <Typography
                  variant="bodySmall"
                  component="div"
                  color="text.secondary"
                  sx={{ lineHeight: 1.3 }}
                >
                  {q.hint}
                </Typography>
              </Box>
            </ButtonBase>
          ))}
        </Box>

        <Typography
          variant="bodySmall"
          color="text.disabled"
          textAlign="center"
          sx={{ mt: 3.5, display: 'block' }}
        >
          Or just type a message below — patient ID, symptoms, or scheduling request.
        </Typography>
      </Box>
    </Box>
  );
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
    return <WelcomeHero />;
  }

  return (
    <Stack spacing={2} p={2} sx={{ overflowY: 'auto', flex: 1 }}>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const timestamp = msg.timestamp ? format(parseChatTimestamp(msg.timestamp), 'h:mm a') : '';
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
