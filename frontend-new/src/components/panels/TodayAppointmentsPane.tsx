/**
 * Today's Appointments pane — horizontal calendar-agenda strip above the chat.
 *
 * Each appointment is a 160×110 card, laid out left-to-right and horizontally
 * scrollable when there are more than fit. Past appointments dim + line-
 * through the time so the MA can scan for "what's next" at a glance.
 * Click a card → the patient enters chat context.
 *
 * Subscribes to `useTodayAppointments` (shared with the welcome hero stat
 * tiles) so both surfaces show the same numbers and refresh in lockstep.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Skeleton,
  Button,
  ButtonBase,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useChat } from '../../context/ChatContext';
import {
  useTodayAppointments,
  formatLastUpdated,
} from '../../hooks/useTodayAppointments';
import type { Appointment } from '../../types/appointment';

type Urgency = Appointment['urgency'];

const URGENCY_LABEL: Record<Urgency, string> = {
  emergency: 'EMERG',
  urgent: 'URGENT',
  'semi-urgent': 'SEMI',
  'non-urgent': 'ROUTINE',
};

// Lower number = floats higher in the sort (within the upcoming bucket).
const URGENCY_RANK: Record<Urgency, number> = {
  emergency: 0,
  urgent: 1,
  'semi-urgent': 2,
  'non-urgent': 3,
};

function formatTime(datetimeStr: string): { hhmm: string; ampm: string } {
  const d = new Date(datetimeStr);
  const h12 = d.getHours() % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return { hhmm: `${h12}:${mm}`, ampm };
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface CardProps {
  appt: Appointment;
  selected: boolean;
  isPast: boolean;
  onSelect: (appt: Appointment) => void;
}

const AppointmentCard: React.FC<CardProps> = ({ appt, selected, isPast, onSelect }) => {
  const theme = useTheme();
  const { hhmm, ampm } = formatTime(appt.appointment_datetime);
  const p = theme.palette.priority;
  const borderColor =
    appt.urgency === 'emergency'
      ? p?.emergency
      : appt.urgency === 'urgent'
      ? p?.urgent
      : appt.urgency === 'semi-urgent'
      ? p?.semiUrgent
      : p?.nonUrgent;

  const pillBg =
    appt.urgency === 'emergency'
      ? 'rgba(220,53,69,0.10)'
      : appt.urgency === 'urgent'
      ? 'rgba(253,126,20,0.12)'
      : appt.urgency === 'semi-urgent'
      ? 'rgba(255,193,7,0.18)'
      : 'rgba(40,167,69,0.10)';

  return (
    <ButtonBase
      focusRipple
      onClick={() => onSelect(appt)}
      aria-label={`Open patient ${appt.patient_fhir_id} at ${hhmm} ${ampm}${isPast ? ' (past)' : ''}`}
      aria-current={selected ? 'true' : undefined}
      sx={{
        flex: '0 0 168px',
        minWidth: 168,
        maxWidth: 168,
        height: 116,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        textAlign: 'left',
        opacity: isPast ? 0.55 : 1,
        bgcolor: selected ? 'rgba(26,115,232,0.06)' : 'background.paper',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: borderColor || 'divider',
        borderRadius: 1.5,
        px: 1.25,
        py: 1,
        transition: 'all 0.18s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
          transform: 'translateY(-2px)',
          opacity: 1,
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      {/* Top: time + urgency pill */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={0.5}>
        <Box>
          <Typography
            sx={{
              fontFamily: '"Roboto Mono", monospace',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.05,
              color: theme.palette.brand?.navy ?? 'text.primary',
              textDecoration: isPast ? 'line-through' : 'none',
            }}
          >
            {hhmm}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.05 }}>
            {ampm}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 0.75,
            py: 0.15,
            borderRadius: '999px',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.04em',
            bgcolor: pillBg,
            color: borderColor,
            whiteSpace: 'nowrap',
          }}
        >
          {URGENCY_LABEL[appt.urgency]}
        </Box>
      </Stack>

      {/* Middle: patient + reason */}
      <Box sx={{ minWidth: 0, mt: 0.75, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 12,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Patient {appt.patient_fhir_id}
        </Typography>
        <Typography
          sx={{
            fontSize: 10.5,
            color: 'text.secondary',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {appt.reason_for_visit}
        </Typography>
      </Box>

      {/* Bottom: provider */}
      <Typography
        sx={{
          fontSize: 10,
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mt: 'auto',
        }}
      >
        {appt.provider.name}
      </Typography>
    </ButtonBase>
  );
};

interface SoftErrorStripProps {
  message: string;
  detail?: string;
  onRetry: () => void;
  isRetrying: boolean;
  isStale: boolean;
}

const SoftErrorStrip: React.FC<SoftErrorStripProps> = ({
  message,
  detail,
  onRetry,
  isRetrying,
  isStale,
}) => {
  const [showDetail, setShowDetail] = useState(false);
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        bgcolor: 'rgba(253,126,20,0.08)',
        border: '1px solid rgba(253,126,20,0.25)',
        borderRadius: 1.5,
        px: 1.25,
        py: 0.75,
        mb: 1,
        fontSize: 12,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <WarningAmberRoundedIcon sx={{ fontSize: 16, color: 'priority.urgent' }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }} noWrap>
            {isStale ? 'Schedule may be stale' : message}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }} noWrap>
            {isStale
              ? "We'll keep retrying in the background."
              : "We'll auto-retry; tap if you can't wait."}
          </Typography>
        </Box>
        {detail && (
          <IconButton
            size="small"
            onClick={() => setShowDetail((v) => !v)}
            aria-label={showDetail ? 'Hide details' : 'Show why'}
            sx={{ p: 0.25 }}
          >
            <ExpandMoreRoundedIcon
              fontSize="small"
              sx={{
                transition: 'transform .15s',
                transform: showDetail ? 'rotate(180deg)' : 'none',
              }}
            />
          </IconButton>
        )}
        <Button
          size="small"
          onClick={onRetry}
          disabled={isRetrying}
          sx={{ minWidth: 0, px: 1, fontSize: 11 }}
        >
          {isRetrying ? 'Retrying…' : 'Retry'}
        </Button>
      </Stack>
      <Collapse in={showDetail} unmountOnExit>
        <Typography
          sx={{
            mt: 0.75,
            fontFamily: '"Roboto Mono", monospace',
            fontSize: 10.5,
            color: 'text.secondary',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {detail}
        </Typography>
      </Collapse>
    </Box>
  );
};

export interface TodayAppointmentsPaneProps {
  /** Pixel height of the pane (default 196 — header + horizontal card row). */
  height?: number | string;
}

export const TodayAppointmentsPane: React.FC<TodayAppointmentsPaneProps> = ({
  height = 196,
}) => {
  const theme = useTheme();
  const { sendMessage } = useChat();
  const {
    appointments,
    isLoading,
    isRefreshing,
    error,
    isStale,
    lastUpdated,
    refresh,
  } = useTodayAppointments();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Re-tick "Updated 12s ago" without re-rendering rows.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Sort: upcoming (urgency desc, then time asc) first, then past (most recent
  // first). Past = appt time is more than 5 min ago — small grace window so a
  // 10:00 appt at 10:03 still reads as "now."
  const nowMs = Date.now();
  const sorted = React.useMemo(() => {
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];
    for (const a of appointments) {
      const t = new Date(a.appointment_datetime).getTime();
      if (t + 5 * 60_000 >= nowMs) upcoming.push(a);
      else past.push(a);
    }
    upcoming.sort((a, b) => {
      const r = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (r !== 0) return r;
      return (
        new Date(a.appointment_datetime).getTime() -
        new Date(b.appointment_datetime).getTime()
      );
    });
    past.sort(
      (a, b) =>
        new Date(b.appointment_datetime).getTime() -
        new Date(a.appointment_datetime).getTime(),
    );
    return [...upcoming, ...past];
  }, [appointments, nowMs]);

  const pastSet = React.useMemo(
    () =>
      new Set(
        appointments
          .filter((a) => new Date(a.appointment_datetime).getTime() + 5 * 60_000 < nowMs)
          .map((a) => a.appointment_id),
      ),
    [appointments, nowMs],
  );

  const handleSelect = useCallback(
    (appt: Appointment) => {
      setSelectedId(appt.appointment_id);
      sendMessage(
        `Pull up patient ${appt.patient_fhir_id} for ${appt.reason_for_visit}`,
      );
    },
    [sendMessage],
  );

  const pendingCount = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  ).length;

  const subline =
    isLoading && appointments.length === 0
      ? 'Loading…'
      : appointments.length === 0
      ? 'No appointments'
      : `${appointments.length} appointment${appointments.length === 1 ? '' : 's'}${
          pendingCount > 0 ? ` · ${pendingCount} pending` : ''
        }`;

  const updatedLabel = lastUpdated ? formatLastUpdated(lastUpdated) : '';

  return (
    <Box
      role="region"
      aria-label="Today's appointments"
      sx={{
        height,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.m3?.surfaceContainerLow ?? '#F8FAFD',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.75,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>
            Today · {todayLabel()}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }} noWrap>
            {subline}
            {updatedLabel && !isLoading ? ` · ${updatedLabel}` : ''}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={refresh}
          startIcon={
            <RefreshIcon
              fontSize="small"
              sx={{
                animation: isRefreshing ? 'sx-spin 0.9s linear infinite' : 'none',
                '@keyframes sx-spin': {
                  from: { transform: 'rotate(0deg)' },
                  to: { transform: 'rotate(360deg)' },
                },
              }}
            />
          }
          disabled={isRefreshing}
          sx={{ minWidth: 0, px: 1, fontSize: 12 }}
        >
          {isRefreshing ? 'Refreshing' : 'Refresh'}
        </Button>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Soft amber error strip — sits above data, never replaces it */}
        {error && (
          <Box sx={{ px: 1.75, pt: 1 }}>
            <SoftErrorStrip
              message={error.message}
              detail={error.detail}
              onRetry={refresh}
              isRetrying={isRefreshing}
              isStale={isStale}
            />
          </Box>
        )}

        {isLoading && appointments.length === 0 ? (
          <Box sx={{ display: 'flex', gap: 1, px: 1.75, py: 1.25, overflowX: 'hidden' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" sx={{ flex: '0 0 168px', height: 116 }} />
            ))}
          </Box>
        ) : sorted.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'text.secondary',
              px: 2,
              py: 1,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              {error
                ? "We couldn't load today's schedule yet"
                : 'No appointments today'}
            </Typography>
            <Typography sx={{ fontSize: 11, mt: 0.5, maxWidth: 320 }}>
              {error
                ? "We'll keep trying. You can still pull up patients from chat."
                : 'Walk-ins and triage from chat will appear here once scheduled.'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'stretch',
              gap: 1,
              px: 1.75,
              py: 1.25,
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x proximity',
              // Slim scrollbar that doesn't dominate the strip.
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(0,0,0,0.18)',
                borderRadius: 999,
              },
            }}
          >
            {sorted.map((appt) => (
              <AppointmentCard
                key={appt.appointment_id}
                appt={appt}
                selected={selectedId === appt.appointment_id}
                isPast={pastSet.has(appt.appointment_id)}
                onSelect={handleSelect}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TodayAppointmentsPane;
