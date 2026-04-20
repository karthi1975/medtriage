/**
 * Material Design 3 design tokens.
 * Seeded from the SynaptixScheduling brand blue; brand-critical colors are
 * pinned manually so the generated M3 scheme doesn't override the mandated
 * primary/secondary/error/warning hues.
 */
import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from '@material/material-color-utilities';

const BRAND_PRIMARY = '#1A73E8';
const BRAND_SECONDARY = '#34A853';
const BRAND_ERROR = '#EA4335';
const BRAND_WARNING = '#FBBC04';

const generated = themeFromSourceColor(argbFromHex(BRAND_PRIMARY));
const gLight = generated.schemes.light.toJSON();
const gDark = generated.schemes.dark.toJSON();
const hex = (argb: number) => hexFromArgb(argb);

export interface M3ColorRoles {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceTint: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export const m3Light: M3ColorRoles = {
  primary: BRAND_PRIMARY,
  onPrimary: '#FFFFFF',
  primaryContainer: '#D8E8FF',
  onPrimaryContainer: '#001A41',

  secondary: BRAND_SECONDARY,
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8F5E9',
  onSecondaryContainer: '#0D3212',

  tertiary: hex(gLight.tertiary),
  onTertiary: hex(gLight.onTertiary),
  tertiaryContainer: hex(gLight.tertiaryContainer),
  onTertiaryContainer: hex(gLight.onTertiaryContainer),

  error: BRAND_ERROR,
  onError: '#FFFFFF',
  errorContainer: '#FDECEA',
  onErrorContainer: '#410E0B',

  warning: BRAND_WARNING,
  onWarning: '#202124',
  warningContainer: '#FFF8E1',
  onWarningContainer: '#3F2E04',

  background: '#F8FAFD',
  onBackground: 'rgba(0,0,0,0.87)',
  surface: '#FFFFFF',
  onSurface: 'rgba(0,0,0,0.87)',
  surfaceVariant: '#F1F4F8',
  onSurfaceVariant: 'rgba(0,0,0,0.60)',

  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F9FB',
  surfaceContainer: '#F1F4F8',
  surfaceContainerHigh: '#ECEFF3',
  surfaceContainerHighest: '#E6EAF0',

  surfaceTint: BRAND_PRIMARY,
  outline: '#747775',
  outlineVariant: 'rgba(60,64,67,0.12)',
  shadow: '#000000',
  scrim: '#000000',

  inverseSurface: '#2E3133',
  inverseOnSurface: '#F1F3F4',
  inversePrimary: '#A8C7FA',
};

export const m3Dark: M3ColorRoles = {
  primary: hex(gDark.primary),
  onPrimary: hex(gDark.onPrimary),
  primaryContainer: hex(gDark.primaryContainer),
  onPrimaryContainer: hex(gDark.onPrimaryContainer),

  secondary: '#81C784',
  onSecondary: '#0D3212',
  secondaryContainer: '#1B5E20',
  onSecondaryContainer: '#C8E6C9',

  tertiary: hex(gDark.tertiary),
  onTertiary: hex(gDark.onTertiary),
  tertiaryContainer: hex(gDark.tertiaryContainer),
  onTertiaryContainer: hex(gDark.onTertiaryContainer),

  error: '#F28B82',
  onError: '#5F1412',
  errorContainer: '#8C1D18',
  onErrorContainer: '#FDECEA',

  warning: '#FDD663',
  onWarning: '#3F2E04',
  warningContainer: '#5C4813',
  onWarningContainer: '#FFF8E1',

  background: '#1B1C1E',
  onBackground: '#E6EAF0',
  surface: '#1B1C1E',
  onSurface: '#E6EAF0',
  surfaceVariant: '#44474F',
  onSurfaceVariant: '#C4C6D0',

  surfaceContainerLowest: '#0F1012',
  surfaceContainerLow: '#1B1C1E',
  surfaceContainer: '#1F2022',
  surfaceContainerHigh: '#292A2D',
  surfaceContainerHighest: '#343538',

  surfaceTint: hex(gDark.primary),
  outline: '#8E9099',
  outlineVariant: 'rgba(255,255,255,0.12)',
  shadow: '#000000',
  scrim: '#000000',

  inverseSurface: '#E6EAF0',
  inverseOnSurface: '#2E3133',
  inversePrimary: BRAND_PRIMARY,
};

/** Clinical priority ladder — kept separate from M3 roles by design. */
export const priority = {
  emergency: '#DC3545',
  urgent: '#FD7E14',
  semiUrgent: '#FFC107',
  nonUrgent: '#28A745',
  onEmergency: '#FFFFFF',
  onUrgent: '#FFFFFF',
  onSemiUrgent: '#202124',
  onNonUrgent: '#FFFFFF',
} as const;

/** Chat bubble backgrounds — carried over from existing palette. */
export const chatBubble = {
  assistant: '#E8F0FE',
  user: '#E8F5E9',
} as const;

/** M3 shape scale. */
export const shapeCorner = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 999,
} as const;

/** M3 motion tokens. */
export const motion = {
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardAccel: 'cubic-bezier(0.3, 0, 1, 1)',
    standardDecel: 'cubic-bezier(0, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedAccel: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasizedDecel: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  },
} as const;

/** M3 typography scale — shared across legacy and m3 themes. */
export const m3Typography = {
  displayLarge: { fontSize: '3.5625rem', lineHeight: '4rem', fontWeight: 400, letterSpacing: '-0.25px' },
  displayMedium: { fontSize: '2.8125rem', lineHeight: '3.25rem', fontWeight: 400 },
  displaySmall: { fontSize: '2.25rem', lineHeight: '2.75rem', fontWeight: 400 },
  headlineLarge: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 400 },
  headlineMedium: { fontSize: '1.75rem', lineHeight: '2.25rem', fontWeight: 400 },
  headlineSmall: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 400 },
  titleLarge: { fontSize: '1.375rem', lineHeight: '1.75rem', fontWeight: 400 },
  titleMedium: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500, letterSpacing: '0.15px' },
  titleSmall: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500, letterSpacing: '0.1px' },
  bodyLarge: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400, letterSpacing: '0.5px' },
  bodyMedium: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400, letterSpacing: '0.25px' },
  bodySmall: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400, letterSpacing: '0.4px' },
  labelLarge: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500, letterSpacing: '0.1px' },
  labelMedium: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 500, letterSpacing: '0.5px' },
  labelSmall: { fontSize: '0.6875rem', lineHeight: '1rem', fontWeight: 500, letterSpacing: '0.5px' },
} as const;

/** Surface tint overlay opacity per M3 elevation level. */
export const elevationTint = {
  level0: 0,
  level1: 0.05,
  level2: 0.08,
  level3: 0.11,
  level4: 0.12,
  level5: 0.14,
} as const;

export type PriorityRoles = typeof priority;
export type ChatBubbleRoles = typeof chatBubble;
export type ShapeScale = typeof shapeCorner;
export type MotionTokens = typeof motion;
export type ElevationTint = typeof elevationTint;
