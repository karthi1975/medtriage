/**
 * Material 3 window-size class detector.
 *
 * Returns the current M3 window-size class plus convenience booleans for
 * layout decisions. Breakpoints match the M3 adaptive spec, not MUI defaults:
 *
 *   Compact     < 600px   — phones portrait
 *   Medium      600-839   — phones landscape / tablets portrait
 *   Expanded    840-1199  — tablets landscape / small laptops
 *   Large       1200-1599 — laptops / desktops (MA console)
 *   ExtraLarge  ≥ 1600    — wide desktops
 */
import { useMediaQuery } from '@mui/material';

export type M3WindowClass = 'compact' | 'medium' | 'expanded' | 'large' | 'extraLarge';

export interface BreakpointState {
  windowClass: M3WindowClass;
  isCompact: boolean;
  isMedium: boolean;
  isExpanded: boolean;
  isLarge: boolean;
  isExtraLarge: boolean;
  /** True when split layouts should collapse to stacked (Compact + Medium). */
  isMobileLayout: boolean;
}

export const useBreakpoint = (): BreakpointState => {
  const compact = useMediaQuery('(max-width: 599px)');
  const medium = useMediaQuery('(min-width: 600px) and (max-width: 839px)');
  const expanded = useMediaQuery('(min-width: 840px) and (max-width: 1199px)');
  const large = useMediaQuery('(min-width: 1200px) and (max-width: 1599px)');
  const extraLarge = useMediaQuery('(min-width: 1600px)');

  let windowClass: M3WindowClass = 'large';
  if (compact) windowClass = 'compact';
  else if (medium) windowClass = 'medium';
  else if (expanded) windowClass = 'expanded';
  else if (extraLarge) windowClass = 'extraLarge';

  return {
    windowClass,
    isCompact: compact,
    isMedium: medium,
    isExpanded: expanded,
    isLarge: large,
    isExtraLarge: extraLarge,
    isMobileLayout: compact || medium,
  };
};
