/**
 * MA Context Selection Page
 * Allows MA to select facility and specialty to start their shift
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMASession } from '../context/MASessionContext';

export const MAContextSelection: React.FC = () => {
  const navigate = useNavigate();
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

  // Load facilities and specialties on mount
  useEffect(() => {
    loadFacilitiesAndSpecialties();
  }, [loadFacilitiesAndSpecialties]);

  // Redirect if already logged in
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
      // Find facility and specialty names from IDs
      const facility = facilities.find(f => f.id === selectedFacility);
      const specialty = specialties.find(s => s.id === selectedSpecialty);

      if (!facility || !specialty) {
        throw new Error('Invalid facility or specialty selection');
      }

      await login({
        ma_name: maName.trim(),
        facility: facility.name,
        specialty: specialty.name,
      });

      // Navigation handled by useEffect above
    } catch (err: any) {
      setFormError(err.message || 'Failed to start shift');
    } finally {
      setSubmitting(false);
    }
  };

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
