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

/**
 * "No known drug allergies" sentinels — clinical text patterns that mean
 * ZERO allergies. The backend often stores these as a one-element array,
 * which would otherwise trip every "has allergies" check.
 */
const ALLERGY_NEGATIVE_RE =
  /^\s*(nkda|nka|no\s+(known\s+)?(drug\s+)?allergies?|none(\s+reported)?|denies\s+allergies)\s*\.?\s*$/i;

function filterRealAllergies(allergies: string[] | undefined): string[] {
  if (!allergies) return [];
  return allergies.filter((a) => a && !ALLERGY_NEGATIVE_RE.test(a));
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
          fontFamily: '"Roboto Condensed", Arial, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          flexShrink: 0,
          minWidth: 64,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          lineHeight: 1.3,
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
  // Strip NKDA-style sentinels before counting — "No known drug allergies"
  // is the opposite of an alert and must not turn the card red.
  const allergies = filterRealAllergies(patient.allergies);
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
        px: 1,
        py: 0.65,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.3,
      }}
    >
      {/* Row 1: identity + allergy badge.
          Identity block uses <Box component="span"> not <Typography> so flex
          shrinking can't hide content. The block is flex-shrink:0 as a unit
          → MRN+name+demos always render at content width; only the spacer
          absorbs leftover space. Allergy badge floats right. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, flexShrink: 0 }}>
          <Box
            component="span"
            sx={{
              fontFamily: '"Roboto Mono", monospace',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              fontSize: 12,
              color: theme.palette.brand?.navy ?? 'text.primary',
              whiteSpace: 'nowrap',
            }}
          >
            MRN {patient.id || '?'}
          </Box>
          <Box
            aria-hidden
            sx={{
              display: 'inline-block',
              width: 1,
              height: 14,
              bgcolor: 'divider',
              transform: 'translateY(2px)',
            }}
          />
          <Box
            component="span"
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: 'text.primary',
              whiteSpace: 'nowrap',
            }}
          >
            {(patient.name && String(patient.name).trim()) ||
              `Patient ${patient.id ?? 'unknown'}`}
          </Box>
          {(() => {
            const ageStr = patient.age != null ? `${patient.age}y` : null;
            const sexStr =
              patient.gender && String(patient.gender).trim() ? patient.gender : null;
            const dobStr =
              patient.birthDate && String(patient.birthDate).trim()
                ? `DOB ${patient.birthDate}`
                : null;
            const parts = [ageStr, sexStr, dobStr].filter(Boolean);
            const demoLine =
              parts.length > 0 ? parts.join(' · ') : 'Age / sex / DOB not on file';
            return (
              <Box
                component="span"
                sx={{
                  fontSize: 10.5,
                  color: parts.length > 0 ? 'text.secondary' : 'text.disabled',
                  fontStyle: parts.length > 0 ? 'normal' : 'italic',
                  whiteSpace: 'nowrap',
                }}
              >
                {demoLine}
              </Box>
            );
          })()}
        </Box>
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
      </Box>

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
