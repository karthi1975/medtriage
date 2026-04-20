/**
 * M3 chip family.
 *
 * M3 has four semantic chip types, all visually similar but meaningfully
 * different in intent. MUI's Chip is neutral; these wrappers set the right
 * defaults (icon slots, selected state handling, shape) so downstream code
 * expresses intent through the component name.
 *
 *   AssistChip      — suggest an action ("Add patient", "View labs")
 *   FilterChip      — toggle a filter (selected/unselected)
 *   InputChip       — compact representation of an entity (patient, tag)
 *                     with optional avatar + onDelete
 *   SuggestionChip  — offer a canned reply or next-step
 */
import React from 'react';
import { Chip, type ChipProps, useTheme } from '@mui/material';

export type AssistChipProps = Omit<ChipProps, 'variant'> & {
  icon?: React.ReactElement;
};

export const AssistChip: React.FC<AssistChipProps> = ({ sx, ...rest }) => {
  const theme = useTheme();
  return (
    <Chip
      variant="outlined"
      sx={[
        {
          borderRadius: `${theme.corner.small}px`,
          borderColor: theme.palette.m3?.outline,
          color: theme.palette.m3?.onSurface,
          height: 32,
          '&:hover': { backgroundColor: 'rgba(26,115,232,0.08)' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};

export type FilterChipProps = Omit<ChipProps, 'variant' | 'onDelete'> & {
  selected?: boolean;
};

export const FilterChip: React.FC<FilterChipProps> = ({ selected, sx, ...rest }) => {
  const theme = useTheme();
  const selectedBg = theme.palette.m3?.secondaryContainer ?? theme.palette.primary.light;
  const selectedFg = theme.palette.m3?.onSecondaryContainer ?? theme.palette.primary.contrastText;
  return (
    <Chip
      variant={selected ? 'filled' : 'outlined'}
      sx={[
        {
          borderRadius: `${theme.corner.small}px`,
          height: 32,
          ...(selected
            ? { backgroundColor: selectedBg, color: selectedFg, borderColor: 'transparent' }
            : { borderColor: theme.palette.m3?.outline, color: theme.palette.m3?.onSurface }),
          '&:hover': selected
            ? { backgroundColor: selectedBg, filter: 'brightness(0.96)' }
            : { backgroundColor: 'rgba(26,115,232,0.08)' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};

export type InputChipProps = Omit<ChipProps, 'variant'>;

export const InputChip: React.FC<InputChipProps> = ({ sx, ...rest }) => {
  const theme = useTheme();
  return (
    <Chip
      variant="filled"
      sx={[
        {
          borderRadius: `${theme.corner.small}px`,
          height: 32,
          backgroundColor: theme.palette.m3?.surfaceContainerHigh,
          color: theme.palette.m3?.onSurface,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};

export type SuggestionChipProps = Omit<ChipProps, 'variant'>;

export const SuggestionChip: React.FC<SuggestionChipProps> = ({ sx, ...rest }) => {
  const theme = useTheme();
  return (
    <Chip
      variant="outlined"
      sx={[
        {
          borderRadius: `${theme.corner.small}px`,
          height: 32,
          borderColor: theme.palette.m3?.outline,
          color: theme.palette.primary.main,
          '&:hover': { backgroundColor: 'rgba(26,115,232,0.08)' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};

export type PriorityChipLevel = 'emergency' | 'urgent' | 'semiUrgent' | 'nonUrgent';

export interface PriorityChipProps extends Omit<ChipProps, 'color' | 'variant'> {
  level: PriorityChipLevel;
}

/**
 * Priority chip — distinct from the M3 chip family. Uses the clinical
 * priority ladder, not M3 roles. Always renders in UPPERCASE to match the
 * chips that appear throughout the clinical product tone.
 */
export const PriorityChip: React.FC<PriorityChipProps> = ({ level, sx, label, ...rest }) => {
  const theme = useTheme();
  const bg = theme.palette.priority?.[level];
  const fg =
    theme.palette.priority?.[
      `on${level.charAt(0).toUpperCase()}${level.slice(1)}` as keyof typeof theme.palette.priority
    ];
  return (
    <Chip
      variant="filled"
      label={typeof label === 'string' ? label.toUpperCase() : label}
      sx={[
        {
          borderRadius: `${theme.corner.small}px`,
          height: 24,
          backgroundColor: bg,
          color: fg,
          fontWeight: 600,
          letterSpacing: '0.06em',
          fontSize: '0.6875rem',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};
