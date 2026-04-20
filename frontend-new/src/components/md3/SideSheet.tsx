/**
 * M3 Standard Side Sheet — responsive.
 *
 * On Expanded+ window classes (≥840px): renders as an inline docked panel.
 * The consumer must place it inside a flex row next to its main content.
 *
 * On Compact / Medium window classes (<840px): renders as a modal Drawer
 * anchored right, so the main content is not squeezed.
 *
 * The component is theme-aware (surface bg, outlineVariant border, M3 motion)
 * and a11y-friendly (aria-hidden when collapsed, close button labeled).
 */
import React from 'react';
import { Box, Drawer, IconButton, Typography, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export interface SideSheetProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  width?: number;
  children?: React.ReactNode;
}

export const SideSheet: React.FC<SideSheetProps> = ({
  open,
  onClose,
  title,
  width = 400,
  children,
}) => {
  const theme = useTheme();
  const { isMobileLayout } = useBreakpoint();

  const divider = theme.palette.m3?.outlineVariant ?? theme.palette.divider;
  const surface = theme.palette.m3?.surface ?? theme.palette.background.paper;

  const header = (title || onClose) && (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${divider}`,
        minHeight: 56,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? (
          <Typography variant="titleMedium" noWrap>{title}</Typography>
        ) : (
          title
        )}
      </Box>
      {onClose && (
        <IconButton onClick={onClose} aria-label="Close panel" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const body = (
    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      {children}
    </Box>
  );

  if (isMobileLayout) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '100vw',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: surface,
          },
        }}
      >
        {header}
        {body}
      </Drawer>
    );
  }

  return (
    <Box
      component="aside"
      aria-hidden={!open}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: surface,
        borderLeft: open ? `1px solid ${divider}` : 'none',
        overflow: 'hidden',
        transition: `width ${theme.motion.duration.medium2}ms ${theme.motion.easing.emphasizedDecel}`,
      }}
    >
      {open && header}
      {open && body}
    </Box>
  );
};

export default SideSheet;
