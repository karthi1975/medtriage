/**
 * PrioritySurface — the clinical priority pattern, codified.
 *
 * Renders an outlined Card with a 4px left border colored by clinical urgency.
 * This is the single most load-bearing visual pattern in SynaptixScheduling;
 * every priority-coded surface (appointment cards, protocol activation,
 * urgent test orders) should use this wrapper.
 *
 * Hover lift is opt-in via `interactive`. Shadow elevation is opt-in via
 * `elevated` and follows the M3 level-1 tint rather than drop shadow when the
 * M3 theme is active.
 */
import React from 'react';
import { Card, type CardProps, useTheme } from '@mui/material';

export type PriorityLevel = 'emergency' | 'urgent' | 'semiUrgent' | 'nonUrgent' | 'none';

export interface PrioritySurfaceProps extends Omit<CardProps, 'variant'> {
  priority?: PriorityLevel;
  elevated?: boolean;
  interactive?: boolean;
}

export const PrioritySurface: React.FC<PrioritySurfaceProps> = ({
  priority = 'none',
  elevated = false,
  interactive = false,
  sx,
  children,
  ...cardProps
}) => {
  const theme = useTheme();
  const color =
    priority === 'none' ? undefined : theme.palette.priority?.[priority];

  return (
    <Card
      elevation={elevated ? 1 : 0}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      sx={[
        {
          borderRadius: `${theme.corner.medium}px`,
          borderLeft: color ? `4px solid ${color}` : undefined,
          transition: interactive
            ? `transform ${theme.motion.duration.short4}ms ${theme.motion.easing.standardDecel}, box-shadow ${theme.motion.duration.short4}ms ${theme.motion.easing.standardDecel}, border-color ${theme.motion.duration.short4}ms ${theme.motion.easing.standardDecel}`
            : undefined,
          cursor: interactive ? 'pointer' : undefined,
          '&:hover': interactive
            ? {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
                borderColor: 'primary.main',
              }
            : undefined,
          '&:focus-visible': interactive
            ? { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 }
            : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...cardProps}
    >
      {children}
    </Card>
  );
};

export default PrioritySurface;
