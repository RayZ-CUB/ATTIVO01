// ATTIVO Design System Tokens
// All UI components reference these values — never hardcode colors, fonts, or spacing

export const colors = {
  // Brand
  lime:   '#c8f135',  // Primary accent — CTAs, active states, focus rings
  gold:   '#f5c842',  // Secondary accent — badges, highlights
  silver: '#b0bec5',  // Tertiary — disabled states, secondary text

  // Backgrounds (dark theme, darkest → lightest)
  black:  '#070906',  // App background
  dark:   '#0d1009',  // Screen background
  panel:  '#111509',  // Section panels
  card:   '#161b0e',  // Card surfaces
  border: '#1f2614',  // Borders and dividers

  // Text
  muted:  '#485535',  // Placeholder text, disabled labels
  text:   '#c8d9b4',  // Body text
  white:  '#eaf4d8',  // Headings, high-emphasis text

  // Status
  error:   '#ff6b6b',
  success: '#4caf50',
  warning: '#ff9800',
} as const;

export const typography = {
  fonts: {
    heading:  'BebasNeue_400Regular',
    body:     'DMSans_400Regular',
    medium:   'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
  },
  weights: {
    light:    '300' as const,
    regular:  '400' as const,
    medium:   '500' as const,
    semiBold: '600' as const,
  },
  sizes: {
    xs:    11,
    sm:    13,
    base:  15,
    md:    17,
    lg:    20,
    xl:    24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },
} as const;

export const spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    24,
  xl:    32,
  '2xl': 48,
} as const;

export const radii = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
