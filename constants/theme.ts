// Design system from handoff doc Section 3

export const theme = {
  // Backgrounds
  bg: '#07071a',
  surface: '#0e0e2a',
  surfaceAlt: '#13132e',
  border: 'rgba(255,255,255,0.08)',

  // Accent colors
  accent: '#ffd43b',
  accentDim: 'rgba(255,212,59,0.12)',

  // Status colors
  red: '#ff6b6b',
  green: '#51cf66',
  blue: '#74c0fc',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#666680',

  // Special
  caliberRed: '#ff6b6b',
} as const;

export const typography = {
  // Use monospace for all numerical data
  mono: {
    fontFamily: 'monospace',
  },
  system: {
    fontFamily: 'system',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
