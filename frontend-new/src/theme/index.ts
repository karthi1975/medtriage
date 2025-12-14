/**
 * MUI Theme Configuration
 * Google Material Design inspired theme for MediChat MA Assistant
 */
import { createTheme } from '@mui/material/styles';

// Color palette (Healthcare-optimized Google Material Design)
export const colors = {
  primary: '#1A73E8',      // Google Blue (trust, professionalism)
  secondary: '#34A853',    // Medical Green (health, safety)
  error: '#EA4335',        // Red for emergencies
  warning: '#FBBC04',      // Amber for urgent cases
  success: '#34A853',      // Green for confirmations
  info: '#4285F4',         // Light blue for info

  background: '#F8FAFD',   // Soft off-white
  surface: '#FFFFFF',      // Pure white for cards
  divider: 'rgba(60,64,67,0.12)',

  // Priority colors
  priority: {
    emergency: '#DC3545',
    urgent: '#FD7E14',
    semiUrgent: '#FFC107',
    nonUrgent: '#28A745',
  },

  // Chat colors
  chat: {
    assistant: '#E8F0FE',  // Light blue background for assistant messages
    user: '#E8F5E9',       // Light green background for user messages
  }
};

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      light: '#4285F4',
      dark: '#1557B0',
    },
    secondary: {
      main: colors.secondary,
      light: '#81C784',
      dark: '#2E7D32',
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    success: {
      main: colors.success,
    },
    info: {
      main: colors.info,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    divider: colors.divider,
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '2rem',      // 32px
      lineHeight: '2.5rem',  // 40px
      fontWeight: 400,
    },
    h5: {
      fontSize: '1.5rem',    // 24px
      lineHeight: '2rem',    // 32px
      fontWeight: 400,
    },
    h6: {
      fontSize: '1.25rem',   // 20px
      lineHeight: '1.75rem', // 28px
      fontWeight: 500,
    },
    subtitle1: {
      fontSize: '1rem',      // 16px
      lineHeight: '1.5rem',  // 24px
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',      // 16px
      lineHeight: '1.5rem',  // 24px
    },
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
    },
    caption: {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1rem',   // 16px
    },
    button: {
      textTransform: 'none', // No uppercase
      fontSize: '0.875rem',  // 14px
      fontWeight: 500,
    },
  },

  shape: {
    borderRadius: 12,  // Default border radius for cards
  },

  spacing: 8,  // Base spacing unit (8px grid)

  components: {
    // Button overrides
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, // Pill shape for primary buttons
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 10,
          paddingBottom: 10,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderRadius: 8, // Less rounded for outlined buttons
        },
      },
    },

    // TextField overrides
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },

    // Card overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colors.divider}`,
          boxShadow: 'none',
        },
      },
    },

    // Paper overrides
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation0: {
          border: `1px solid ${colors.divider}`,
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        },
      },
    },

    // AppBar overrides
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          color: 'rgba(0, 0, 0, 0.87)',
          boxShadow: 'none',
          borderBottom: `1px solid ${colors.divider}`,
        },
      },
    },

    // Chip overrides
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },

    // Dialog overrides
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
