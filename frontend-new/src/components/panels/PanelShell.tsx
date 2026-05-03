/**
 * PanelShell — the EPIC-style chrome wrapper used by Triage / Orders / etc.
 *
 * Visual signature:
 *   - White surface, 1px outline, 6px radius (squarer than our default 12)
 *   - Light grey title bar with uppercase 11px label, tight letter-spacing
 *   - Optional severity stripe (4px left border) for clinical priority
 *   - Optional right-side action slot for icon buttons
 *
 * Children render in a tight padding zone (`p: 1.25`). The shell handles
 * its own scroll if content overflows.
 */
import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';

export interface PanelShellProps {
  title: string;
  /** Optional severity color → renders a 4px left stripe. */
  severityColor?: string;
  /** Optional right-aligned slot, typically icon buttons. */
  actions?: React.ReactNode;
  /** Optional small subtitle next to title (e.g., a count). */
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Override default min-height. */
  minHeight?: number | string;
  /** Optional explicit height — when set, body becomes scrollable. */
  height?: number | string;
}

export const PanelShell: React.FC<PanelShellProps> = ({
  title,
  severityColor,
  actions,
  subtitle,
  children,
  minHeight,
  height,
}) => {
  const theme = useTheme();
  const titleBarBg =
    theme.palette.m3?.surfaceContainerLow ?? 'rgba(0,0,0,0.03)';

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight,
        height,
        ...(severityColor
          ? {
              borderLeft: '4px solid',
              borderLeftColor: severityColor,
            }
          : null),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 1,
          py: 0.4,
          bgcolor: titleBarBg,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          minHeight: 24,
        }}
      >
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Roboto Condensed", Arial, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              lineHeight: 1.1,
            }}
            noWrap
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontFamily: '"Roboto Condensed", Arial, sans-serif',
                fontSize: 10.5,
                color: 'text.disabled',
              }}
              noWrap
            >
              {subtitle}
            </Typography>
          )}
        </Stack>
        {actions && (
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        )}
      </Stack>
      <Box sx={{ p: 1, overflowY: 'auto', flex: 1, minHeight: 0 }}>{children}</Box>
    </Box>
  );
};

export default PanelShell;
