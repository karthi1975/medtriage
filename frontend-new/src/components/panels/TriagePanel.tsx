/**
 * TriagePanel — EPIC-style triage assessment surface.
 *
 * Reads `metadata.triage` (priority, risk_level, protocol, risk_factors,
 * red_flags, recommendations, reasoning). All fields optional; renders only
 * the present subset so a partial assessment doesn't show empty sections.
 *
 * Visual style:
 *   - Severity stripe on the panel's left edge encodes priority
 *   - Compact label/value rows — Epic-style data sheet
 *   - Red flags rendered as flat tags, not chips
 */
import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { PanelShell } from './PanelShell';
import type { ChatMessage } from '../../types';

type Triage = NonNullable<ChatMessage['metadata']>['triage'];

interface TriagePanelProps {
  triage: Triage | undefined;
  height?: number | string;
}

function priorityToColor(p: string | undefined, palette: ReturnType<typeof useTheme>['palette']) {
  const u = (p || '').toString().toLowerCase();
  if (u === 'emergency' || u === 'critical') return palette.priority?.emergency ?? palette.error.main;
  if (u === 'urgent' || u === 'high') return palette.priority?.urgent ?? palette.warning.main;
  if (u === 'semi-urgent' || u === 'medium' || u === 'moderate')
    return palette.priority?.semiUrgent ?? palette.warning.main;
  if (u === 'non-urgent' || u === 'routine' || u === 'low')
    return palette.priority?.nonUrgent ?? palette.success.main;
  return palette.text.disabled;
}

function priorityLabel(p: string | undefined): string {
  return (p || 'Unknown').toString().toUpperCase().replace('-', ' ');
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontFamily: '"Roboto Condensed", Arial, sans-serif',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'text.disabled',
      mt: 0.6,
      mb: 0.25,
    }}
  >
    {children}
  </Typography>
);

export const TriagePanel: React.FC<TriagePanelProps> = ({ triage, height }) => {
  const theme = useTheme();

  // Empty state — keeps the layout column populated so the workspace doesn't jump.
  if (!triage) {
    return (
      <PanelShell title="Triage Assessment" height={height}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
            textAlign: 'center',
            py: 2,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>Awaiting assessment</Typography>
          <Typography sx={{ fontSize: 11, mt: 0.5, maxWidth: 240 }}>
            Describe symptoms in chat to activate the triage protocol.
          </Typography>
        </Box>
      </PanelShell>
    );
  }

  const t = triage as any;
  const priority = t.priority;
  const sevColor = priorityToColor(priority, theme.palette);
  const protocol = t.protocol;
  const riskLevel = t.risk_level;
  const riskFactors: string[] = Array.isArray(t.risk_factors) ? t.risk_factors : [];
  const redFlags: string[] = Array.isArray(triage.red_flags) ? (triage.red_flags as string[]) : [];
  const recsArray: string[] = Array.isArray(t.recommendations) ? t.recommendations : [];
  const recsObj =
    triage.recommendations && typeof triage.recommendations === 'object' && !Array.isArray(triage.recommendations)
      ? (triage.recommendations as Record<string, string>)
      : null;
  const reasoning: string | undefined = triage.reasoning as string | undefined;

  return (
    <PanelShell
      title="Triage Assessment"
      severityColor={sevColor}
      subtitle={protocol ? `· ${protocol}` : undefined}
      height={height}
    >
      <Stack spacing={0.75}>
        {/* Priority + risk level row */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              px: 0.75,
              py: 0.25,
              bgcolor: sevColor,
              color: '#fff',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.04em',
              borderRadius: '3px',
            }}
          >
            {priorityLabel(priority)}
          </Box>
          {riskLevel && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              Risk level: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{riskLevel}</Box>
            </Typography>
          )}
        </Stack>

        {redFlags.length > 0 && (
          <>
            <SectionLabel>Red Flags</SectionLabel>
            <Stack spacing={0.25}>
              {redFlags.map((f, i) => (
                <Stack key={i} direction="row" alignItems="flex-start" spacing={0.75}>
                  <WarningAmberRoundedIcon sx={{ fontSize: 13, color: theme.palette.priority?.emergency ?? 'error.main', mt: 0.15 }} />
                  <Typography sx={{ fontSize: 11, lineHeight: 1.35 }}>{f}</Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        {riskFactors.length > 0 && (
          <>
            <SectionLabel>Risk Factors</SectionLabel>
            <Stack spacing={0.25}>
              {riskFactors.map((f, i) => (
                <Typography key={i} sx={{ fontSize: 11, lineHeight: 1.35 }}>
                  • {f}
                </Typography>
              ))}
            </Stack>
          </>
        )}

        {recsArray.length > 0 && (
          <>
            <SectionLabel>Immediate Actions</SectionLabel>
            <Stack spacing={0.25}>
              {recsArray.map((r, i) => (
                <Typography
                  key={i}
                  sx={{ fontSize: 11, lineHeight: 1.35, color: theme.palette.priority?.emergency ?? 'error.main', fontWeight: 500 }}
                >
                  • {r}
                </Typography>
              ))}
            </Stack>
          </>
        )}

        {recsObj && (
          <>
            <SectionLabel>Recommendations</SectionLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 0.25, columnGap: 1, fontSize: 11 }}>
              {recsObj.immediate_action && (
                <>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.secondary' }}>Immediate</Typography>
                  <Typography sx={{ fontSize: 11 }}>{recsObj.immediate_action}</Typography>
                </>
              )}
              {recsObj.care_level && (
                <>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.secondary' }}>Care level</Typography>
                  <Typography sx={{ fontSize: 11 }}>{recsObj.care_level}</Typography>
                </>
              )}
              {recsObj.timeframe && (
                <>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.secondary' }}>Timeframe</Typography>
                  <Typography sx={{ fontSize: 11 }}>{recsObj.timeframe}</Typography>
                </>
              )}
            </Box>
          </>
        )}

        {reasoning && (
          <>
            <SectionLabel>Reasoning</SectionLabel>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>{reasoning}</Typography>
          </>
        )}
      </Stack>
    </PanelShell>
  );
};

export default TriagePanel;
