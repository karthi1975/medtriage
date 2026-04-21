/**
 * Appointment Detail Modal
 * Displays comprehensive appointment information including patient data from FHIR
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import type { AppointmentDetail } from '../../types/appointment';

interface AppointmentDetailModalProps {
  appointmentId: number;
  open: boolean;
  onClose: () => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointmentId,
  open,
  onClose,
}) => {
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [patientData, setPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentDetails();
    }
  }, [open, appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointment details
      const apptData = await apiService.getAppointmentById(appointmentId);
      setAppointment(apptData);

      // Fetch patient history
      if (apptData.patient_fhir_id) {
        try {
          const patientHistory = await apiService.getPatientHistory(apptData.patient_fhir_id);
          setPatientData(patientHistory.data);
        } catch (err) {
          console.warn('Could not fetch patient history:', err);
          // Continue without patient data
        }
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return {
      date: date.toLocaleDateString('en-US', dateOptions),
      time: date.toLocaleTimeString('en-US', timeOptions),
    };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      scheduled: 'info',
      confirmed: 'primary',
      'checked-in': 'warning',
      completed: 'success',
      cancelled: 'error',
      'no-show': 'default',
    };
    return colors[status] || 'default';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, any> = {
      emergency: 'error',
      urgent: 'warning',
      'semi-urgent': 'info',
      'non-urgent': 'default',
    };
    return colors[urgency] || 'default';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendNotification = () => {
    // TODO: Implement notification sending
    alert('Notification would be sent to patient');
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  if (error || !appointment) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">{error || 'Appointment not found'}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const { date, time } = formatDateTime(appointment.appointment_datetime);
  const patient = patientData?.patient;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Header */}
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Appointment Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confirmation: {appointment.confirmation_number}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip
              label={appointment.status.toUpperCase()}
              color={getStatusColor(appointment.status)}
              size="small"
            />
            <Chip
              label={appointment.urgency.toUpperCase()}
              color={getUrgencyColor(appointment.urgency)}
              size="small"
              variant="outlined"
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Appointment Information */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, bgcolor: 'primary.lighter' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600} color="primary.dark">
                  <EventIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Appointment Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {date}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      <TimeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {time} ({appointment.duration_minutes} minutes)
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Grid>

          {/* Patient Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} mb={2} color="primary.dark">
                <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Patient Information
              </Typography>

              {patient ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {patient.name || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Age / Gender
                    </Typography>
                    <Typography variant="body1">
                      {patient.age || 'Unknown'}y {patient.gender || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Patient ID
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {appointment.patient_fhir_id}
                    </Typography>
                  </Box>
                  {patient.address && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body2">{patient.address}</Typography>
                    </Box>
                  )}
                  {patient.telecom && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Contact
                      </Typography>
                      <Typography variant="body2">
                        <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        {patient.telecom}
                      </Typography>
                    </Box>
                  )}

                  {/* Allergies */}
                  {patientData?.allergies && patientData.allergies.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        <WarningIcon
                          sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5, color: 'error.main' }}
                        />
                        Allergies
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {patientData.allergies.slice(0, 5).map((allergy: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={allergy.code || allergy}
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Conditions */}
                  {patientData?.conditions && patientData.conditions.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Active Conditions
                      </Typography>
                      <List dense>
                        {patientData.conditions.slice(0, 3).map((condition: any, idx: number) => (
                          <ListItem key={idx} disablePadding>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <MedicalIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={condition.code || 'Unknown condition'}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Patient ID: {appointment.patient_fhir_id}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Provider & Facility Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              {/* Provider */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2} color="primary.dark">
                  <HospitalIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Provider
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body1" fontWeight={600}>
                    {appointment.provider.name}
                  </Typography>
                  {appointment.provider.credentials && (
                    <Typography variant="body2" color="text.secondary">
                      {appointment.provider.credentials}
                    </Typography>
                  )}
                  {appointment.provider.npi && (
                    <Typography variant="caption" color="text.secondary">
                      NPI: {appointment.provider.npi}
                    </Typography>
                  )}
                  <Chip label={appointment.specialty.name} size="small" sx={{ mt: 1, width: 'fit-content' }} />
                </Stack>
              </Paper>

              {/* Facility */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2} color="primary.dark">
                  <LocationIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Facility
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body1" fontWeight={600}>
                    {appointment.facility.name}
                  </Typography>
                  {appointment.facility.address && (
                    <Typography variant="body2" color="text.secondary">
                      {appointment.facility.address}
                    </Typography>
                  )}
                  {appointment.facility.city && (
                    <Typography variant="body2" color="text.secondary">
                      {appointment.facility.city}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          {/* Appointment Details */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2} color="primary.dark">
                Visit Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reason for Visit
                  </Typography>
                  <Typography variant="body1">{appointment.reason_for_visit}</Typography>
                </Grid>
                {appointment.chief_complaint && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chief Complaint
                    </Typography>
                    <Typography variant="body1">{appointment.chief_complaint}</Typography>
                  </Grid>
                )}
                {appointment.visit_type && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Visit Type
                    </Typography>
                    <Typography variant="body1" textTransform="capitalize">
                      {appointment.visit_type.replace('_', ' ')}
                    </Typography>
                  </Grid>
                )}
                {appointment.triage_priority && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Triage Priority
                    </Typography>
                    <Chip
                      label={appointment.triage_priority.toUpperCase()}
                      color={getUrgencyColor(appointment.triage_priority)}
                      size="small"
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created By: {appointment.created_by || 'System'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Patient Notified:{' '}
                    {appointment.patient_notified ? (
                      <CheckCircleIcon sx={{ fontSize: 14, verticalAlign: 'middle', color: 'success.main' }} />
                    ) : (
                      'No'
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
        <Button startIcon={<SendIcon />} onClick={handleSendNotification}>
          Send Notification
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
