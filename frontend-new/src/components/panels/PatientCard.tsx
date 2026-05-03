/**
 * PatientCard — comprehensive Epic-style patient summary in ~110 px.
 *
 * Replaces the earlier slim PatientBanner. Three-row layout:
 *   Row 1: MRN · Name · age/sex/DOB · allergy alert (right-aligned)
 *   Row 2: ALLERGIES / CONDITIONS / MEDS in a 3-column grid with the
 *          tiny uppercase section labels EPIC uses
 *   Row 3: CONTACT / ADDRESS in a 2-column grid
 *
 * Long lists collapse to "first 3 · +N more" with a tooltip showing the
 * full list — keeps scan height bounded without losing fidelity.
 */
import React from 'react';
import { Box, Stack, Typography, Tooltip, useTheme } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { Patient } from '../../types';

interface PatientCardProps {
  patient: Patient;
}

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  full?: string;
  flex?: number;
  emphasis?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, children, full, emphasis }) => {
  const theme = useTheme();
  const inner = (
    <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          flexShrink: 0,
          minWidth: 70,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 11.5,
          lineHeight: 1.35,
          fontWeight: emphasis ? 600 : 400,
          color: emphasis
            ? theme.palette.priority?.emergency ?? theme.palette.error.main
            : 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </Typography>
    </Stack>
  );
  if (full) {
    return (
      <Tooltip title={full} placement="top-start" enterDelay={300}>
        <Box>{inner}</Box>
      </Tooltip>
    );
  }
  return inner;
};

function compress(items: string[] | undefined, max = 3): { display: string; full: string } | null {
  if (!items || items.length === 0) return null;
  const head = items.slice(0, max).join(' · ');
  const display = items.length > max ? `${head} · +${items.length - max} more` : head;
  const full = items.join(' · ');
  return { display, full };
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const theme = useTheme();
  const allergies = patient.allergies || [];
  const conditions = patient.conditions || [];
  const meds = (patient.medications || []).map((m) =>
    m.dosage ? `${m.medication} ${m.dosage}` : m.medication,
  );
  const hasAllergies = allergies.length > 0;
  const stripeColor = hasAllergies
    ? theme.palette.priority?.emergency ?? theme.palette.error.main
    : theme.palette.brand?.navy ?? theme.palette.primary.main;

  const allergiesData = compress(allergies);
  const conditionsData = compress(conditions);
  const medsData = compress(meds);

  return (
    <Box
      role="region"
      aria-label="Patient summary"
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: stripeColor,
        borderRadius: '4px',
        px: 1.25,
        py: 0.85,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      {/* Row 1: identity */}
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Typography
          sx={{
            fontFamily: '"Roboto Mono", monospace',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            fontSize: 12,
            color: theme.palette.brand?.navy ?? 'text.primary',
            flexShrink: 0,
          }}
        >
          MRN {patient.id}
        </Typography>
        <Box sx={{ width: 1, height: 18, bgcolor: 'divider', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, minWidth: 0 }} noWrap>
          {patient.name || 'Unknown patient'}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }} noWrap>
          {[
            patient.age != null ? `${patient.age}y` : null,
            patient.gender || null,
            patient.birthDate ? `DOB ${patient.birthDate}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {hasAllergies && (
          <Tooltip title={allergies.join(', ')} placement="bottom-end">
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
                flexShrink: 0,
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 13 }} />
              <Box component="span">ALLERGIES ({allergies.length})</Box>
            </Stack>
          </Tooltip>
        )}
      </Stack>

      {/* Row 2: clinical (allergies / conditions / meds) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, columnGap: 1.5, rowGap: 0.25 }}>
        <FieldRow
          label="Allergies"
          full={allergiesData?.full}
          emphasis={hasAllergies}
        >
          {allergiesData?.display ?? <Box component="span" sx={{ color: 'text.disabled' }}>NKDA</Box>}
        </FieldRow>
        <FieldRow label="Conditions" full={conditionsData?.full}>
          {conditionsData?.display ?? <Box component="span" sx={{ color: 'text.disabled' }}>None on file</Box>}
        </FieldRow>
        <FieldRow label="Meds" full={medsData?.full}>
          {medsData?.display ?? <Box component="span" sx={{ color: 'text.disabled' }}>None on file</Box>}
        </FieldRow>
      </Box>

      {/* Row 3: contact */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 1.5, rowGap: 0.25 }}>
        <FieldRow label="Contact">
          {patient.telecom || <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
        </FieldRow>
        <FieldRow label="Address" full={patient.address ?? undefined}>
          {patient.address || <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>}
        </FieldRow>
      </Box>
    </Box>
  );
};

export default PatientCard;
