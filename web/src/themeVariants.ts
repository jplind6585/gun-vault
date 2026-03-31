// Theme Variants for Gun Vault App
// User can switch between different design aesthetics

export type ThemeVariant = {
  name: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    caliberRed: string;
    green: string;
    blue: string;
    red: string;
    orange: string;
  };
  fonts: {
    primary: string;
    heading: string;
    mono: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  spacing: {
    compact: boolean; // If true, reduce padding/margins
  };
};

// 1. PROFESSIONAL/SERIOUS - Darker palette, professional icons, minimal strategic color
export const professionalTheme: ThemeVariant = {
  name: 'Professional',
  description: 'Dark, serious, minimal color usage',
  colors: {
    bg: '#0A0A0B',
    surface: '#141416',
    surfaceAlt: '#1C1C1F',
    border: '#2A2A2E',
    textPrimary: '#E8E8EA',
    textSecondary: '#A0A0A5',
    textMuted: '#606066',
    accent: '#4A7C9B', // Muted blue-gray
    accentHover: '#5A8DAC',
    caliberRed: '#B85C5C', // Muted red
    green: '#6B9B7A',
    blue: '#5A8DAC',
    red: '#B85C5C',
    orange: '#C89060'
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    heading: '"SF Pro Display", -apple-system, sans-serif',
    mono: '"SF Mono", "Monaco", "Consolas", monospace'
  },
  borderRadius: {
    small: '2px',
    medium: '4px',
    large: '6px'
  },
  spacing: {
    compact: false
  }
};

// 2. TACTICAL/MILITARY - Olive/gray tones, military-inspired, structured layout
export const tacticalTheme: ThemeVariant = {
  name: 'Tactical',
  description: 'Military-inspired olive and gray tones',
  colors: {
    bg: '#1A1C1A',
    surface: '#242624',
    surfaceAlt: '#2E312E',
    border: '#3A3D3A',
    textPrimary: '#E0E2E0',
    textSecondary: '#A8ACA8',
    textMuted: '#6A6E6A',
    accent: '#7A8A5C', // Olive drab
    accentHover: '#8A9A6C',
    caliberRed: '#A65C4A',
    green: '#6A7A5C',
    blue: '#5C6A7A',
    red: '#A65C4A',
    orange: '#B8864A'
  },
  fonts: {
    primary: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    heading: '"Impact", "Haettenschweiler", sans-serif',
    mono: '"Courier New", Courier, monospace'
  },
  borderRadius: {
    small: '0px',
    medium: '2px',
    large: '3px'
  },
  spacing: {
    compact: false
  }
};

// 3. MODERN MINIMAL - Clean whites/grays, simple icons, lots of whitespace
export const modernMinimalTheme: ThemeVariant = {
  name: 'Modern Minimal',
  description: 'Clean, light, spacious design',
  colors: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F5F5',
    border: '#E0E0E0',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    accent: '#2C5F8D',
    accentHover: '#3C6F9D',
    caliberRed: '#D64545',
    green: '#4CAF50',
    blue: '#2196F3',
    red: '#F44336',
    orange: '#FF9800'
  },
  fonts: {
    primary: '"Inter", -apple-system, sans-serif',
    heading: '"Inter", -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace'
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px'
  },
  spacing: {
    compact: false
  }
};

// 4. CLASSIC WOOD & STEEL - Warm browns, gunmetal grays, traditional feel
export const classicTheme: ThemeVariant = {
  name: 'Classic Wood & Steel',
  description: 'Traditional with warm wood and gunmetal tones',
  colors: {
    bg: '#2A2520',
    surface: '#352F28',
    surfaceAlt: '#403A32',
    border: '#4D4740',
    textPrimary: '#E8DDD0',
    textSecondary: '#C4B8A8',
    textMuted: '#897C6C',
    accent: '#8B6F47', // Walnut brown
    accentHover: '#9B7F57',
    caliberRed: '#B85442',
    green: '#6B8A5C',
    blue: '#5C7A8A',
    red: '#B85442',
    orange: '#C88A47'
  },
  fonts: {
    primary: '"Georgia", "Times New Roman", serif',
    heading: '"Playfair Display", Georgia, serif',
    mono: '"Courier New", Courier, monospace'
  },
  borderRadius: {
    small: '3px',
    medium: '5px',
    large: '8px'
  },
  spacing: {
    compact: false
  }
};

// 5. TECH/DATA - Blue/cyan accents, technical icons, dashboard style
export const techDataTheme: ThemeVariant = {
  name: 'Tech/Data',
  description: 'Technical dashboard with cyan accents',
  colors: {
    bg: '#0D1117',
    surface: '#161B22',
    surfaceAlt: '#1C2128',
    border: '#30363D',
    textPrimary: '#C9D1D9',
    textSecondary: '#8B949E',
    textMuted: '#484F58',
    accent: '#00D9FF', // Bright cyan
    accentHover: '#33E0FF',
    caliberRed: '#FF4D6D',
    green: '#00FFA3',
    blue: '#00A3FF',
    red: '#FF4D6D',
    orange: '#FFB347'
  },
  fonts: {
    primary: '"Roboto", "Segoe UI", sans-serif',
    heading: '"Roboto Condensed", "Arial Narrow", sans-serif',
    mono: '"Source Code Pro", "Consolas", monospace'
  },
  borderRadius: {
    small: '4px',
    medium: '6px',
    large: '10px'
  },
  spacing: {
    compact: true
  }
};

// Default theme (Lindcott Armory default)
export const defaultTheme: ThemeVariant = {
  name: 'Lindcott Armory Default',
  description: 'Original Lindcott Armory design',
  colors: {
    bg: '#0F0F10',
    surface: '#18181B',
    surfaceAlt: '#1E1E22',
    border: '#2A2A2E',
    textPrimary: '#E4E4E7',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    accent: '#F97316',
    accentHover: '#FB923C',
    caliberRed: '#EF4444',
    green: '#22C55E',
    blue: '#3B82F6',
    red: '#EF4444',
    orange: '#F97316'
  },
  fonts: {
    primary: 'system-ui, -apple-system, sans-serif',
    heading: 'system-ui, -apple-system, sans-serif',
    mono: 'monospace'
  },
  borderRadius: {
    small: '4px',
    medium: '6px',
    large: '8px'
  },
  spacing: {
    compact: false
  }
};

export const allThemes: ThemeVariant[] = [
  defaultTheme,
  professionalTheme,
  tacticalTheme,
  modernMinimalTheme,
  classicTheme,
  techDataTheme
];

// Helper to convert ThemeVariant to the current theme format
export function convertThemeVariantToTheme(variant: ThemeVariant) {
  return {
    ...variant.colors,
    fonts: variant.fonts,
    borderRadius: variant.borderRadius,
    spacing: variant.spacing
  };
}
