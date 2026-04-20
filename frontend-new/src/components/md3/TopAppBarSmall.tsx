/**
 * M3 Small Top App Bar — 64dp tall, elevation 0, surface background.
 *
 * Structure:  [ leading ][ title ...........grows........ ][ trailing ]
 *
 * Use for task-focused surfaces (chat, detail pages) where the title is
 * short and actions are icon-only.
 */
import React from 'react';
import { AppBar, Box, Toolbar, Typography, useTheme } from '@mui/material';

export interface TopAppBarSmallProps {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  title: React.ReactNode;
  position?: 'static' | 'fixed' | 'sticky';
  elevated?: boolean;
}

export const TopAppBarSmall: React.FC<TopAppBarSmallProps> = ({
  leading,
  trailing,
  title,
  position = 'static',
  elevated = false,
}) => {
  const theme = useTheme();
  return (
    <AppBar
      position={position}
      elevation={elevated ? 1 : 0}
      sx={{
        backgroundColor: theme.palette.m3?.surface ?? theme.palette.background.paper,
        color: theme.palette.m3?.onSurface ?? theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.m3?.outlineVariant ?? theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 2 }}>
        {leading && <Box sx={{ display: 'flex', alignItems: 'center' }}>{leading}</Box>}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Typography variant="titleLarge" noWrap>{title}</Typography>
          ) : (
            title
          )}
        </Box>
        {trailing && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{trailing}</Box>}
      </Toolbar>
    </AppBar>
  );
};

export default TopAppBarSmall;
