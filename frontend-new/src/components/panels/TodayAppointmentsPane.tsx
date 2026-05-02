/**
 * Today's Appointments pane — top-left region of the v2 3-region layout.
 *
 * Source of truth: GET /api/v1/appointments/today/list (filtered by facility),
 * polled once on mount. Click a row to open that patient in chat (sends a
 * lookup message via ChatContext.sendMessage). All states handled: loading
 * skeleton, empty, fetch error with retry, long-name truncation, keyboard
 * activation.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Skeleton,
  Alert,
  Button,
  ButtonBase,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { apiService } from '../../services/api';
import { useMASession } from '../../context/MASessionContext';
import { useChat } from '../../context/ChatContext';
import type { Appointment } from '../../types/appointment';

type Urgency = Appointment['urgency'];

const URGENCY_LABEL: Record<Urgency, string> = {
  emergency: 'EMERG',
  urgent: 'URGENT',
  'semi-urgent': 'SEMI',
  'non-urgent': 'ROUTINE',
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
  onSelect: (appt: Appointment) => void;
}

const AppointmentRow: React.FC<RowProps> = ({ appt, onSelect }) => {
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
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '54px 1fr 110px 76px',
        alignItems: 'center',
        columnGap: 1.25,
        rowGap: 0,
        px: 1.25,
        py: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
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
      {/* Time block */}
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
        <Typography
          sx={{ fontSize: 10, fontWeight: 400, color: 'text.secondary', lineHeight: 1.1 }}
        >
          {ampm}
        </Typography>
      </Box>

      {/* Patient + reason */}
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

      {/* Provider */}
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

      {/* Urgency pill */}
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

export interface TodayAppointmentsPaneProps {
  /** Pixel height of the pane (default 340 per spec). */
  height?: number | string;
}

export const TodayAppointmentsPane: React.FC<TodayAppointmentsPaneProps> = ({
  height = 340,
}) => {
  const theme = useTheme();
  const { session } = useMASession();
  const { sendMessage } = useChat();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getTodaysAppointments(session?.facility_id);
      // Sort by datetime ascending — earliest first.
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.appointment_datetime).getTime() -
          new Date(b.appointment_datetime).getTime(),
      );
      setAppts(sorted);
    } catch (err) {
      console.error('[TodayAppointments] fetch failed', err);
      setError("Couldn't load today's schedule.");
    } finally {
      setLoading(false);
    }
  }, [session?.facility_id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = useCallback(
    (appt: Appointment) => {
      // Send a lookup message — chat flow will fetch & set patient context.
      sendMessage(
        `Pull up patient ${appt.patient_fhir_id} for ${appt.reason_for_visit}`,
      );
    },
    [sendMessage],
  );

  const pendingCount = appts.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  ).length;

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
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>
            Today · {todayLabel()}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
            {loading
              ? 'Loading…'
              : appts.length === 0
              ? 'No appointments'
              : `${appts.length} appointment${appts.length === 1 ? '' : 's'}${
                  pendingCount > 0 ? ` · ${pendingCount} pending` : ''
                }`}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={load}
          startIcon={<RefreshIcon fontSize="small" />}
          disabled={loading}
          sx={{ minWidth: 0, px: 1, fontSize: 12 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.75, py: 1.25 }}>
        {loading ? (
          <Stack spacing={0.75}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={52} />
            ))}
          </Stack>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={load}>
                Retry
              </Button>
            }
            sx={{ fontSize: 12 }}
          >
            {error}
          </Alert>
        ) : appts.length === 0 ? (
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
              No appointments today
            </Typography>
            <Typography sx={{ fontSize: 11, mt: 0.5, maxWidth: 240 }}>
              Walk-ins and triage from chat will appear here once scheduled.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0.75}>
            {appts.map((appt) => (
              <AppointmentRow
                key={appt.appointment_id}
                appt={appt}
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
