/**
 * EHR-Style Appointments Management Page
 * Displays appointments with filtering, search, and detail view capabilities
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Badge,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  EventNote as EventNoteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Fab, useTheme } from '@mui/material';
import { apiService } from '../services/api';
import { useThemeMode } from '../theme/ThemeModeProvider';
import type { Appointment, AppointmentFilters, AppointmentStats } from '../types/appointment';
import { AppointmentDetailModal } from '../components/appointments/AppointmentDetailModal';

// Status badge configuration
const STATUS_CONFIG = {
  scheduled: { color: 'info', label: 'Scheduled' },
  confirmed: { color: 'primary', label: 'Confirmed' },
  'checked-in': { color: 'warning', label: 'Checked In' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'error', label: 'Cancelled' },
  'no-show': { color: 'default', label: 'No Show' },
} as const;

// Urgency badge configuration
const URGENCY_CONFIG = {
  emergency: { color: 'error', label: 'Emergency', priority: 1 },
  urgent: { color: 'warning', label: 'Urgent', priority: 2 },
  'semi-urgent': { color: 'info', label: 'Semi-Urgent', priority: 3 },
  'non-urgent': { color: 'default', label: 'Routine', priority: 4 },
} as const;

export const AppointmentsPage: React.FC = () => {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isM3 = mode === 'm3';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AppointmentFilters>({
    limit: 50,
    offset: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters
      const apiFilters: AppointmentFilters = { ...filters };

      if (statusFilter !== 'all') {
        apiFilters.status = statusFilter;
      }

      // Date filter handling
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        apiFilters.start_date = todayStart.toISOString();
        apiFilters.end_date = todayEnd.toISOString();
      } else if (dateFilter === 'week') {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        apiFilters.start_date = weekStart.toISOString();
        apiFilters.end_date = weekEnd.toISOString();
      } else if (dateFilter === 'upcoming') {
        apiFilters.start_date = new Date().toISOString();
      }

      const response = await apiService.getAppointments(apiFilters);

      let filteredAppointments = response.appointments;

      // Client-side urgency filter (if not supported by backend)
      if (urgencyFilter !== 'all') {
        filteredAppointments = filteredAppointments.filter(
          (appt) => appt.urgency === urgencyFilter
        );
      }

      setAppointments(filteredAppointments);

      // Fetch stats
      const statsData = await apiService.getAppointmentStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter, urgencyFilter]);

  // Format date/time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    const dateFormatted = date.toLocaleDateString('en-US', dateOptions);
    const timeFormatted = date.toLocaleTimeString('en-US', timeOptions);

    // Check if today or tomorrow
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    let dateLabel = dateFormatted;
    if (isToday) dateLabel = 'Today';
    else if (isTomorrow) dateLabel = 'Tomorrow';

    return { dateLabel, timeFormatted, fullDate: dateFormatted };
  };

  // Render appointment card
  const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const { dateLabel, timeFormatted, fullDate } = formatDateTime(appointment.appointment_datetime);
    const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.scheduled;
    const urgencyConfig = URGENCY_CONFIG[appointment.urgency] || URGENCY_CONFIG['non-urgent'];

    return (
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          },
          borderLeft: `4px solid`,
          borderLeftColor: `${urgencyConfig.color}.main`,
        }}
        onClick={() => setSelectedAppointment(appointment.appointment_id)}
      >
        <CardContent>
          <Grid container spacing={2}>
            {/* Left: Date/Time */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Stack spacing={0.5}>
                <Chip
                  icon={<TodayIcon />}
                  label={dateLabel}
                  size="small"
                  color={dateLabel === 'Today' ? 'primary' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {timeFormatted}
                </Typography>
                {dateLabel !== fullDate && (
                  <Typography variant="caption" color="text.secondary">
                    {fullDate}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {appointment.duration_minutes} min
                </Typography>
              </Stack>
            </Grid>

            {/* Middle: Patient & Provider Info */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Patient
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    <PersonIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Patient ID: {appointment.patient_fhir_id}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Provider
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {appointment.provider.name}
                  </Typography>
                  {appointment.provider.credentials && (
                    <Typography variant="caption" color="text.secondary">
                      {appointment.provider.credentials}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Location
                  </Typography>
                  <Typography variant="body2">
                    <LocationIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    {appointment.facility.name}
                  </Typography>
                  {appointment.facility.city && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {appointment.facility.city}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <EventNoteIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    {appointment.reason_for_visit}
                  </Typography>
                  {appointment.chief_complaint && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Chief Complaint: {appointment.chief_complaint}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Grid>

            {/* Right: Status & Specialty */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Stack spacing={1} alignItems="flex-end">
                <Chip
                  label={statusConfig.label}
                  color={statusConfig.color as any}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={urgencyConfig.label}
                  color={urgencyConfig.color as any}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={appointment.specialty.name}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  Confirmation: {appointment.confirmation_number}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ bgcolor: isM3 ? theme.palette.m3?.surfaceContainerLow : 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative' }}>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant={isM3 ? 'headlineSmall' : 'h4'} fontWeight={isM3 ? 400 : 700}>
              <CalendarIcon sx={{ fontSize: 32, verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
              Appointments
            </Typography>
            {isM3 && (
              <Typography variant="bodyMedium" color="text.secondary" sx={{ ml: 5 }}>
                Today's schedule and upcoming visits
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchAppointments} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant={showFilters ? (isM3 ? 'tonal' : 'contained') : 'outlined'}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Appointments
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {stats.by_status.completed || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight={700}>
                  {stats.by_urgency.urgent + stats.by_urgency.emergency || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Urgent/Emergency
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight={700}>
                  {stats.by_status.scheduled + stats.by_status.confirmed || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={2}>Filter Appointments</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="checked-in">Checked In</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="no-show">No Show</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    label="Urgency"
                  >
                    <MenuItem value="all">All Urgencies</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="semi-urgent">Semi-Urgent</MenuItem>
                    <MenuItem value="non-urgent">Routine</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    label="Date Range"
                  >
                    <MenuItem value="all">All Dates</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : appointments.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No appointments found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Try adjusting your filters or create a new appointment
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.appointment_id} appointment={appointment} />
          ))}
        </Stack>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointmentId={selectedAppointment}
          open={Boolean(selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
      </Container>

      {isM3 && (
        <Fab
          color="primary"
          variant="extended"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            textTransform: 'none',
            paddingX: 3,
            boxShadow: '0 4px 12px rgba(26,115,232,0.35)',
          }}
          onClick={fetchAppointments}
          aria-label="New appointment"
        >
          <AddIcon sx={{ mr: 1 }} />
          New appointment
        </Fab>
      )}
    </Box>
  );
};
