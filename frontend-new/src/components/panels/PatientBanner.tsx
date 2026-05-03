/**
 * PatientBanner — Epic-style slim patient identification strip.
 *
 * Sits above the clinical workspace when a patient is in context. Shows
 * MRN, name, age/sex, and any flagged conditions/allergies. Color-coded
 * left edge if any allergies are present (Epic's standard "red allergy
 * indicator" pattern).
 */
import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { Patient } from '../../types';

interface PatientBannerProps {
  patient: Patient;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ patient }) => {
  const theme = useTheme();
  const allergies = patient.allergies && patient.allergies.length > 0 ? patient.allergies : [];
  const conditions = patient.conditions && patient.conditions.length > 0 ? patient.conditions : [];
  const hasAllergies = allergies.length > 0;
  const stripeColor = hasAllergies
    ? theme.palette.priority?.emergency ?? theme.palette.error.main
    : theme.palette.brand?.navy ?? theme.palette.primary.main;

  return (
    <Box
      role="banner"
      aria-label="Patient identification banner"
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: stripeColor,
        borderRadius: '6px',
        px: 1.25,
        py: 0.6,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        minHeight: 38,
        flexShrink: 0,
      }}
    >
      {/* MRN */}
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
          fontSize: 12,
          color: theme.palette.brand?.navy ?? 'text.primary',
        }}
      >
        MRN {patient.id}
      </Typography>

      <Box sx={{ width: 1, height: 18, bgcolor: 'divider' }} />

      {/* Name */}
      <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 0 }} noWrap>
        {patient.name || 'Unknown patient'}
      </Typography>

      {/* Demographics */}
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
        {[
          patient.age != null ? `${patient.age}y` : null,
          patient.gender || null,
          patient.birthDate ? `DOB ${patient.birthDate}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* Allergy badge */}
      {hasAllergies && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            px: 0.75,
            py: 0.15,
            bgcolor: 'rgba(220,53,69,0.10)',
            color: theme.palette.priority?.emergency ?? 'error.main',
            borderRadius: '3px',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 13 }} />
          <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
            ALLERGIES: {allergies.slice(0, 3).join(', ')}
            {allergies.length > 3 && ` +${allergies.length - 3}`}
          </Box>
        </Stack>
      )}

      {/* Active conditions */}
      {conditions.length > 0 && (
        <Typography
          sx={{
            fontSize: 10.5,
            color: 'text.secondary',
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {conditions.slice(0, 3).join(' · ')}
          {conditions.length > 3 && ` +${conditions.length - 3}`}
        </Typography>
      )}
    </Box>
  );
};

export default PatientBanner;
