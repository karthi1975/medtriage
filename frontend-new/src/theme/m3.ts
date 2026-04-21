/**
 * Material Design 3 theme built on top of MUI v7.
 *
 * Approach: preserve MUI v7's legacy palette shape so existing component code
 * (`color="primary"`, `success.lighter`, etc.) still renders, while adding an
 * `m3` namespace of full M3 color roles and custom typography/shape/motion
 * scales. New components opt in via `theme.palette.m3.*` and M3 Typography
 * variants; legacy components keep working.
 */
import { createTheme } from '@mui/material/styles';
import {
  m3Light,
  priority,
  chatBubble,
  shapeCorner,
  motion,
  elevationTint,
  m3Typography,
} from './tokens';

const m3Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: m3Light.primary,
      light: '#4285F4',
      dark: '#1557B0',
      contrastText: m3Light.onPrimary,
    },
    secondary: {
      main: m3Light.secondary,
      light: '#81C784',
      dark: '#2E7D32',
      contrastText: m3Light.onSecondary,
    },
    error: {
      main: m3Light.error,
      light: '#F28B82',
      dark: '#C5221F',
      contrastText: m3Light.onError,
      lighter: m3Light.errorContainer,
    },
    warning: {
      main: m3Light.warning,
      contrastText: m3Light.onWarning,
      lighter: m3Light.warningContainer,
    },
    success: {
      main: m3Light.secondary,
      light: '#81C784',
      dark: '#2E7D32',
      contrastText: m3Light.onSecondary,
      lighter: m3Light.secondaryContainer,
    },
    info: {
      main: '#4285F4',
      light: '#64B5F6',
      dark: '#1976D2',
      lighter: '#E3F2FD',
    },
    background: {
      default: m3Light.background,
      paper: m3Light.surface,
    },
    divider: m3Light.outlineVariant,
    text: {
      primary: m3Light.onSurface,
      secondary: m3Light.onSurfaceVariant,
      disabled: 'rgba(0,0,0,0.38)',
    },
    action: {
      hover: 'rgba(26,115,232,0.08)',
      selected: 'rgba(26,115,232,0.12)',
      focus: 'rgba(26,115,232,0.12)',
    },
    m3: m3Light,
    priority,
    chat: chatBubble,
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

    ...m3Typography,

    h4: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 400 },
    h5: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 400 },
    h6: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 500 },
    subtitle1: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: '1.5rem' },
    body2: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    caption: { fontSize: '0.75rem', lineHeight: '1rem' },
    button: {
      textTransform: 'none',
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
  },

  shape: { borderRadius: shapeCorner.medium },
  spacing: 8,
  corner: shapeCorner,
  motion,
  elevationTint,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: m3Light.background,
          color: m3Light.onSurface,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: shapeCorner.full,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 10,
          paddingBottom: 10,
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '0.1px',
          '&:focus-visible': {
            outline: `2px solid ${m3Light.primary}`,
            outlineOffset: 2,
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderRadius: shapeCorner.small,
          borderColor: m3Light.outline,
          '&:hover': { borderColor: m3Light.primary, backgroundColor: 'rgba(26,115,232,0.08)' },
        },
        text: { borderRadius: shapeCorner.small },
      },
      variants: [
        {
          props: { variant: 'tonal' as const },
          style: {
            backgroundColor: m3Light.secondaryContainer,
            color: m3Light.onSecondaryContainer,
            borderRadius: shapeCorner.full,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: m3Light.secondaryContainer,
              filter: 'brightness(0.96)',
              boxShadow: 'none',
            },
          },
        },
        {
          props: { variant: 'elevated' as const },
          style: {
            backgroundColor: m3Light.surfaceContainerLow,
            color: m3Light.primary,
            borderRadius: shapeCorner.full,
            boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
            '&:hover': {
              backgroundColor: m3Light.surfaceContainer,
              boxShadow: '0 2px 4px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
            },
          },
        },
      ],
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: shapeCorner.small,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: m3Light.outline,
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: shapeCorner.medium,
          border: `1px solid ${m3Light.outlineVariant}`,
          boxShadow: 'none',
          backgroundColor: m3Light.surface,
          backgroundImage: 'none',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation0: { border: `1px solid ${m3Light.outlineVariant}`, boxShadow: 'none' },
        elevation1: { boxShadow: 'none', backgroundColor: m3Light.surfaceContainerLow },
        elevation2: { boxShadow: 'none', backgroundColor: m3Light.surfaceContainer },
        elevation3: { boxShadow: 'none', backgroundColor: m3Light.surfaceContainerHigh },
        elevation4: { boxShadow: 'none', backgroundColor: m3Light.surfaceContainerHigh },
        elevation5: { boxShadow: 'none', backgroundColor: m3Light.surfaceContainerHighest },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: m3Light.surface,
          color: m3Light.onSurface,
          boxShadow: 'none',
          borderBottom: `1px solid ${m3Light.outlineVariant}`,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: shapeCorner.small,
          '&:focus-visible': {
            outline: `2px solid ${m3Light.primary}`,
            outlineOffset: 2,
          },
        },
        filled: { backgroundColor: m3Light.surfaceContainerHigh },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: shapeCorner.extraLarge },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: shapeCorner.full,
          minWidth: 48,
          minHeight: 48,
          '&:focus-visible': {
            outline: `2px solid ${m3Light.primary}`,
            outlineOffset: 2,
          },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: shapeCorner.small },
      },
    },
  },
});

export default m3Theme;
