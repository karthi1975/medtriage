import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Person as PersonIcon,
  ConfirmationNumber as ConfirmationIcon,
  Print as PrintIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface Provider {
  provider_id: number;
  name: string;
  credentials: string;
  specialty: string;
}

interface Facility {
  facility_id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  phone?: string;
}

interface AppointmentConfirmationProps {
  confirmationNumber: string;
  appointmentId: number;
  provider: Provider;
  facility: Facility;
  slotDatetime: string;
  patientName?: string;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  confirmationNumber,
  appointmentId,
  provider,
  facility,
  slotDatetime,
  patientName,
}) => {
  const formatDateTime = (datetimeStr: string) => {
    const date = new Date(datetimeStr);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(slotDatetime);

  const handlePrint = () => {
    window.print();
  };

  const handleSendConfirmation = () => {
    // In production, this would trigger email/SMS
    console.log('Send confirmation:', { confirmationNumber, appointmentId });
    alert('Confirmation sent to patient (demo)');
  };

  return (
    <Box mt={2}>
      <Alert
        icon={<CheckIcon />}
        severity="success"
        sx={{
          '& .MuiAlert-icon': {
            fontSize: 32,
          },
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Appointment Successfully Booked!
        </Typography>
      </Alert>

      <Card
        variant="outlined"
        sx={{
          borderColor: 'success.main',
          borderWidth: 2,
          bgcolor: 'success.lighter',
        }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            {/* Confirmation Number */}
            <Box textAlign="center" py={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Confirmation Number
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mt={0.5}
              >
                <ConfirmationIcon color="success" />
                <Typography
                  variant="displaySmall"
                  fontWeight={700}
                  fontFamily="'Roboto Mono', monospace"
                  color="success.dark"
                  sx={{ letterSpacing: '0.04em' }}
                >
                  {confirmationNumber}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Patient Info */}
            {patientName && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  PATIENT
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {patientName}
                </Typography>
              </Box>
            )}

            {/* Appointment Date & Time */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                APPOINTMENT DATE & TIME
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon color="action" />
                  <Typography variant="body1" fontWeight={600}>
                    {dateStr}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <TimeIcon color="action" />
                  <Typography variant="body1" fontWeight={600}>
                    {timeStr}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Provider Info */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                PROVIDER
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="action" />
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {provider.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {provider.credentials} • {provider.specialty}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Location */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                LOCATION
              </Typography>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <PlaceIcon color="action" sx={{ mt: 0.3 }} />
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {facility.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {facility.address}
                  </Typography>
                  {facility.phone && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      📞 {facility.phone}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={handleSendConfirmation}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Send to Patient
              </Button>
            </Stack>

            {/* Important Notes */}
            <Box p={1.5} bgcolor="warning.lighter" borderRadius={1} borderLeft={3} borderColor="warning.main">
              <Typography variant="caption" fontWeight={600} color="warning.dark" display="block" mb={0.5}>
                ⚠️ Important Reminders
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • Patient should arrive 15 minutes early
                <br />
                • Bring insurance card and photo ID
                <br />
                • Review pre-appointment testing requirements
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
