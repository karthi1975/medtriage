/**
 * M3 Medium Top App Bar — 112dp minimum, surface background, elevation 0.
 *
 * Layout (top to bottom):
 *   Row 1 (56dp): trailing actions (icon-only) aligned right; leading optional
 *   Row 2 (varies): headline title + optional supporting text
 *   Row 3 (optional): `dockedBelow` slot for filter chip rows, tabs, etc.
 *
 * Use for landing/overview pages (Appointments, Patient list) where the
 * title deserves hierarchy above inline actions.
 */
import React from 'react';
import { AppBar, Box, IconButton, Stack, Typography, useTheme } from '@mui/material';

export interface TopAppBarMediumProps {
  title: React.ReactNode;
  supportingText?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  dockedBelow?: React.ReactNode;
  position?: 'static' | 'fixed' | 'sticky';
}

export const TopAppBarMedium: React.FC<TopAppBarMediumProps> = ({
  title,
  supportingText,
  leading,
  trailing,
  dockedBelow,
  position = 'static',
}) => {
  const theme = useTheme();
  return (
    <AppBar
      position={position}
      elevation={0}
      sx={{
        backgroundColor: theme.palette.m3?.surface ?? theme.palette.background.paper,
        color: theme.palette.m3?.onSurface ?? theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.m3?.outlineVariant ?? theme.palette.divider}`,
      }}
    >
      <Stack>
        <Box sx={{ minHeight: 56, px: 3, display: 'flex', alignItems: 'center' }}>
          {leading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>{leading}</Box>
          ) : (
            <IconButton sx={{ visibility: 'hidden' }} aria-hidden />
          )}
          <Box sx={{ flex: 1 }} />
          {trailing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{trailing}</Box>
          )}
        </Box>

        <Box sx={{ px: 3, pb: 2 }}>
          {typeof title === 'string' ? (
            <Typography variant="headlineSmall">{title}</Typography>
          ) : (
            title
          )}
          {supportingText && (
            <Typography variant="bodyMedium" color="text.secondary" sx={{ mt: 0.5 }}>
              {supportingText}
            </Typography>
          )}
        </Box>

        {dockedBelow && (
          <Box
            sx={{
              px: 3,
              pb: 1.5,
              pt: 1,
              borderTop: `1px solid ${theme.palette.m3?.outlineVariant ?? theme.palette.divider}`,
            }}
          >
            {dockedBelow}
          </Box>
        )}
      </Stack>
    </AppBar>
  );
};

export default TopAppBarMedium;
