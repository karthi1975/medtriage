/**
 * M3 card variants not covered by MUI's built-in Card.
 *
 * - OutlinedCard: the existing default (1px outline, no shadow). Re-exported
 *   for API symmetry so downstream code imports all card variants from one place.
 * - FilledTonalCard: surfaceContainer background, no border. Low-emphasis
 *   grouping (e.g., pre-appointment reminders, helper panels).
 * - ElevatedCard: surfaceContainerLow background with level-1 shadow.
 *   Hover elevates to level-3 when `interactive`.
 */
import React from 'react';
import { Card, type CardProps, useTheme } from '@mui/material';

export interface TonalCardProps extends Omit<CardProps, 'variant'> {
  interactive?: boolean;
}

export const OutlinedCard: React.FC<TonalCardProps> = ({ sx, ...rest }) => (
  <Card
    variant="outlined"
    sx={[{ boxShadow: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
    {...rest}
  />
);

export const FilledTonalCard: React.FC<TonalCardProps> = ({ sx, interactive, ...rest }) => {
  const theme = useTheme();
  const bg = theme.palette.m3?.surfaceContainer ?? theme.palette.background.default;
  const bgHover = theme.palette.m3?.surfaceContainerHigh ?? bg;
  return (
    <Card
      elevation={0}
      sx={[
        {
          backgroundColor: bg,
          border: 'none',
          borderRadius: `${theme.corner.medium}px`,
          transition: interactive
            ? `background-color ${theme.motion.duration.short4}ms ${theme.motion.easing.standard}`
            : undefined,
          cursor: interactive ? 'pointer' : undefined,
          '&:hover': interactive ? { backgroundColor: bgHover } : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};

export const ElevatedCard: React.FC<TonalCardProps> = ({ sx, interactive, ...rest }) => {
  const theme = useTheme();
  const bg = theme.palette.m3?.surfaceContainerLow ?? theme.palette.background.paper;
  return (
    <Card
      elevation={interactive ? 1 : 1}
      sx={[
        {
          backgroundColor: bg,
          border: 'none',
          borderRadius: `${theme.corner.medium}px`,
          transition: interactive
            ? `transform ${theme.motion.duration.short4}ms ${theme.motion.easing.standardDecel}, box-shadow ${theme.motion.duration.short4}ms ${theme.motion.easing.standardDecel}`
            : undefined,
          cursor: interactive ? 'pointer' : undefined,
          '&:hover': interactive
            ? {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[3],
              }
            : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};
