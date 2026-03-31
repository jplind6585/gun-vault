// Design system from handoff doc
// Can be overridden with theme variants

let currentTheme = {
  bg: '#07071a',
  surface: '#0e0e2a',
  surfaceAlt: '#13132e',
  border: 'rgba(255,255,255,0.08)',

  accent: '#ffd43b',
  accentDim: 'rgba(255,212,59,0.12)',

  red: '#ff6b6b',
  green: '#51cf66',
  blue: '#74c0fc',

  textPrimary: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#666680',

  caliberRed: '#ff6b6b',
  orange: '#ffa94d',
  accentHover: '#ffe066'
};

// Try to load saved theme from localStorage
try {
  const savedTheme = localStorage.getItem('gunvault_theme');
  if (savedTheme) {
    const parsed = JSON.parse(savedTheme);
    currentTheme = { ...currentTheme, ...parsed };
  }
} catch (e) {
  // Ignore errors loading theme
}

export const theme = currentTheme;

// Typography scale - for consistent text hierarchy
export const typography = {
  // Headings
  h1: { fontSize: '32px', fontWeight: 700, letterSpacing: '2px', lineHeight: 1.2 },
  h2: { fontSize: '24px', fontWeight: 700, letterSpacing: '1.5px', lineHeight: 1.3 },
  h3: { fontSize: '18px', fontWeight: 600, letterSpacing: '1px', lineHeight: 1.4 },
  h4: { fontSize: '14px', fontWeight: 600, letterSpacing: '0.8px', lineHeight: 1.4 },

  // Body text
  body: { fontSize: '14px', fontWeight: 400, letterSpacing: '0.3px', lineHeight: 1.6 },
  bodySmall: { fontSize: '12px', fontWeight: 400, letterSpacing: '0.3px', lineHeight: 1.5 },

  // UI elements
  label: { fontSize: '11px', fontWeight: 500, letterSpacing: '0.8px', lineHeight: 1.4 },
  caption: { fontSize: '10px', fontWeight: 400, letterSpacing: '0.5px', lineHeight: 1.4 },

  // Monospace variants (for numbers, data)
  mono: { fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: 'monospace' },
  monoSmall: { fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px', fontFamily: 'monospace' },
};

// Spacing scale - for consistent padding and margins
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px'
};

// Transitions - for smooth animations
export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease'
};

// Function to update theme
export function setTheme(newTheme: Partial<typeof theme>) {
  Object.assign(currentTheme, newTheme);
  try {
    localStorage.setItem('gunvault_theme', JSON.stringify(newTheme));
  } catch (e) {
    // Ignore errors saving theme
  }
  // Trigger a page reload to apply new theme
  window.location.reload();
}
