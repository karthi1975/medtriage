/**
 * Today's Appointments pane — top-left region of the v2 3-region layout.
 *
 * Subscribes to `useTodayAppointments` (shared with the welcome hero stats)
 * so both surfaces show the same numbers and refresh in lockstep.
 *
 * Design principles encoded here:
 *   - A schedule fetch failure is recoverable, so we never red-alert. A
 *     compact amber strip sits *above* whatever data we have, the body stays
 *     usable, and "Why?" reveals the backend's actual reason for diagnosis.
 *   - Emergency / urgent rows float to the top so Sarah sees them first.
 *   - Click feedback is instant via a local `selectedId` — the chat round
 *     trip can take seconds, but the row reads as "selected" the moment she
 *     clicks.
 *   - "Updated 12s ago" gives Sarah confidence the data is fresh, even when
 *     no new appointments have arrived.
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

// Lower number = floats higher in the sort.
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

interface RowProps {
  appt: Appointment;
  selected: boolean;
  onSelect: (appt: Appointment) => void;
}

const AppointmentRow: React.FC<RowProps> = ({ appt, selected, onSelect }) => {
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
      aria-label={`Open patient ${appt.patient_fhir_id} at ${hhmm} ${ampm}`}
      aria-current={selected ? 'true' : undefined}
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '54px 1fr 110px 76px',
        alignItems: 'center',
        columnGap: 1.25,
        px: 1.25,
        py: 1,
        bgcolor: selected ? 'rgba(26,115,232,0.06)' : 'background.paper',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: borderColor || 'divider',
        borderRadius: 1,
        textAlign: 'left',
        transition: 'all 0.18s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box>
        <Typography
          sx={{
            fontFamily: '"Roboto Mono", monospace',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.1,
            color: theme.palette.brand?.navy ?? 'text.primary',
          }}
        >
          {hhmm}
        </Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 400, color: 'text.secondary', lineHeight: 1.1 }}>
          {ampm}
        </Typography>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: 13,
            lineHeight: 1.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Patient {appt.patient_fhir_id}
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {appt.reason_for_visit}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {appt.provider.name}
      </Typography>

      <Box
        sx={{
          justifySelf: 'end',
          px: 1,
          py: 0.25,
          borderRadius: '999px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          bgcolor: pillBg,
          color: borderColor,
          whiteSpace: 'nowrap',
        }}
      >
        {URGENCY_LABEL[appt.urgency]}
      </Box>
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
  /** Pixel height of the pane (default 340 per spec). */
  height?: number | string;
}

export const TodayAppointmentsPane: React.FC<TodayAppointmentsPaneProps> = ({
  height = 340,
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

  // Optimistic selection: highlight immediately on click; clear when chat
  // round-trip is in flight isn't tracked here — the highlight just persists,
  // which matches "this is the patient we're working on now."
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Tick a "now" so "Updated 12s ago" stays fresh without re-rendering rows.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Sort: emergency/urgent float to top, then by time ascending.
  const sorted = React.useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const r = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
        if (r !== 0) return r;
        return (
          new Date(a.appointment_datetime).getTime() -
          new Date(b.appointment_datetime).getTime()
        );
      }),
    [appointments],
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

  const pendingCount = sorted.filter(
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
          py: 1.25,
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
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.75, py: 1.25 }}>
        {/* Soft amber error strip — sits ABOVE data, never replaces it */}
        {error && (
          <SoftErrorStrip
            message={error.message}
            detail={error.detail}
            onRetry={refresh}
            isRetrying={isRefreshing}
            isStale={isStale}
          />
        )}

        {isLoading && appointments.length === 0 ? (
          <Stack spacing={0.75}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={52} />
            ))}
          </Stack>
        ) : sorted.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'text.secondary',
              py: 3,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              {error
                ? "We couldn't load today's schedule yet"
                : 'No appointments today'}
            </Typography>
            <Typography sx={{ fontSize: 11, mt: 0.5, maxWidth: 260 }}>
              {error
                ? "We'll keep trying. You can still pull up patients from chat."
                : 'Walk-ins and triage from chat will appear here once scheduled.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0.75}>
            {sorted.map((appt) => (
              <AppointmentRow
                key={appt.appointment_id}
                appt={appt}
                selected={selectedId === appt.appointment_id}
                onSelect={handleSelect}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default TodayAppointmentsPane;
