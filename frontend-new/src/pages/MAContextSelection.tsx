/**
 * MA Context Selection Page
 * Allows MA to select facility and specialty to start their shift.
 *
 * Renders one of two views depending on the active theme mode:
 *  - legacy: the original MUI v7 form (unchanged)
 *  - m3:     Material 3 redesign using tokens from the md3 primitive library
 *
 * Shared state and submit logic sit in the parent so both views stay in sync.
 */
import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
  useTheme,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { useNavigate } from 'react-router-dom';
import { useMASession } from '../context/MASessionContext';
import { useThemeMode } from '../theme/ThemeModeProvider';

export const MAContextSelection: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const theme = useTheme();
  const {
    session,
    facilities,
    specialties,
    isLoading,
    error,
    login,
    loadFacilitiesAndSpecialties,
  } = useMASession();

  const [maName, setMaName] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<number | ''>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadFacilitiesAndSpecialties();
  }, [loadFacilitiesAndSpecialties]);

  useEffect(() => {
    if (session) {
      navigate('/chat');
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!maName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    if (!selectedFacility) {
      setFormError('Please select a facility');
      return;
    }

    if (!selectedSpecialty) {
      setFormError('Please select a specialty');
      return;
    }

    setSubmitting(true);

    try {
      const facility = facilities.find((f) => f.id === selectedFacility);
      const specialty = specialties.find((s) => s.id === selectedSpecialty);

      if (!facility || !specialty) {
        throw new Error('Invalid facility or specialty selection');
      }

      await login({
        ma_name: maName.trim(),
        facility: facility.name,
        specialty: specialty.name,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to start shift');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'm3') {
    const m3 = theme.palette.m3;
    const corner = theme.corner;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: m3?.surfaceContainer ?? 'background.default',
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'center',
          py: { xs: 4, sm: 6 },
          px: 2,
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Card
            variant="outlined"
            sx={{
              borderRadius: `${corner.large}px`,
              bgcolor: 'background.paper',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Stack alignItems="center" spacing={0.5} sx={{ mb: 4 }}>
                <Box
                  component="img"
                  src="/synaptix-wordmark.svg"
                  alt="SynaptixScheduling"
                  sx={{ height: 52, width: 'auto', mb: 1 }}
                />
                <Typography variant="headlineSmall" align="center">
                  Start your shift
                </Typography>
                <Typography variant="bodyMedium" align="center" color="text.secondary">
                  We'll load your patients, protocols, and open slots.
                </Typography>
              </Stack>

              {(error || formError) && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    bgcolor: m3?.errorContainer,
                    color: m3?.onErrorContainer,
                    border: 'none',
                    borderRadius: `${corner.small}px`,
                    '& .MuiAlert-icon': { color: m3?.error },
                  }}
                >
                  {formError || error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Your name"
                    value={maName}
                    onChange={(e) => setMaName(e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g., Sarah Johnson"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControl fullWidth required>
                    <InputLabel>Facility</InputLabel>
                    <Select
                      value={selectedFacility}
                      onChange={(e) => setSelectedFacility(e.target.value as number)}
                      label="Facility"
                      disabled={isLoading || facilities.length === 0}
                      startAdornment={
                        <InputAdornment position="start">
                          <LocalHospitalIcon fontSize="small" />
                        </InputAdornment>
                      }
                    >
                      {facilities.map((facility) => (
                        <MenuItem key={facility.id} value={facility.id}>
                          {facility.name} — {facility.city}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Specialty</InputLabel>
                    <Select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value as number)}
                      label="Specialty"
                      disabled={isLoading || specialties.length === 0}
                      startAdornment={
                        <InputAdornment position="start">
                          <MedicalServicesIcon fontSize="small" />
                        </InputAdornment>
                      }
                    >
                      {specialties.map((specialty) => (
                        <MenuItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={submitting || isLoading}
                    sx={{ mt: 1.5, py: 1.5 }}
                  >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Start Shift'}
                  </Button>
                </Stack>
              </Box>

              {isLoading && facilities.length === 0 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <CircularProgress size={32} />
                </Box>
              )}
            </CardContent>
          </Card>

          <Typography
            variant="labelSmall"
            align="center"
            color="text.secondary"
            sx={{ display: 'block', mt: 3 }}
          >
            SynaptixScheduling · Material 3 · Internal clinical tool
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              component="img"
              src="/synaptix-wordmark.svg"
              alt="SynaptixScheduling"
              sx={{ height: 56, width: 'auto' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Start Your Shift
          </Typography>

          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Your Name"
              value={maName}
              onChange={(e) => setMaName(e.target.value)}
              margin="normal"
              required
              autoFocus
              placeholder="e.g., Sarah Johnson"
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Facility</InputLabel>
              <Select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value as number)}
                label="Facility"
                disabled={isLoading || facilities.length === 0}
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility.id} value={facility.id}>
                    {facility.name} - {facility.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Specialty</InputLabel>
              <Select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value as number)}
                label="Specialty"
                disabled={isLoading || specialties.length === 0}
              >
                {specialties.map((specialty) => (
                  <MenuItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting || isLoading}
              sx={{ mt: 3 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Start Shift'}
            </Button>
          </Box>

          {isLoading && facilities.length === 0 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress size={40} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};
