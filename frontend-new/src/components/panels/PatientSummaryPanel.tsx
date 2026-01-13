/**
 * Patient Summary Panel
 * Displays patient demographics and medical history
 */
import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Box,
} from '@mui/material';
import type { Patient } from '../../types';
import { format } from 'date-fns';

interface PatientSummaryPanelProps {
  patient: Patient;
}

export const PatientSummaryPanel: React.FC<PatientSummaryPanelProps> = ({ patient }) => {
  const birthDate = patient.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate
    ? new Date().getFullYear() - birthDate.getFullYear()
    : patient.age || 'Unknown';

  return (
    <Card>
      <CardHeader
        title="Patient Summary"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        {/* Demographics */}
        <Box mb={2}>
          <Typography variant="h6">{patient.name || 'Unknown Patient'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {age}y • {patient.gender || 'Unknown'} • ID: {patient.id}
          </Typography>
          {patient.birthDate && (
            <Typography variant="caption" color="text.secondary">
              DOB: {format(new Date(patient.birthDate), 'MM/dd/yyyy')}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Active Conditions */}
        {patient.conditions && patient.conditions.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Active Conditions
            </Typography>
            <List dense disablePadding>
              {patient.conditions.map((condition, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemText
                    primary={condition}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Medications */}
        {patient.medications && patient.medications.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Current Medications
            </Typography>
            <List dense disablePadding>
              {patient.medications.map((med, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemText
                    primary={med.medication}
                    secondary={med.dosage ? `${med.dosage} ${med.frequency || ''}`.trim() : undefined}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Allergies
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {patient.allergies.map((allergy, index) => (
                <Chip
                  key={index}
                  label={allergy}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              ))}
            </Stack>
          </>
        )}

        {/* Contact Information */}
        {(patient.address || patient.telecom) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Contact
            </Typography>
            {patient.address && (
              <Typography variant="body2" color="text.secondary">
                {patient.address}
              </Typography>
            )}
            {patient.telecom && (
              <Typography variant="body2" color="text.secondary">
                {patient.telecom}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
