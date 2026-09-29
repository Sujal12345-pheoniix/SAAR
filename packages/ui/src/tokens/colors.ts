// SAAR Design System — Color Tokens
// Editorial sophistication + Human warmth + Soft technology + Restrained semantic accents

export const palette = {
  // Foundation: Warm Ivory / Editorial Off-White
  ivory: {
    50: '#FDFCFB',
    100: '#FAF8F5',
    200: '#F5F2EB',
    300: '#EFECE4',
    400: '#E5E1D7',
    500: '#D6D0C4',
  },

  // Foundation: Deep Ink & Charcoal
  ink: {
    950: '#0A0C0F',
    900: '#0F1115',
    850: '#16191F',
    800: '#1D2129',
    700: '#272C37',
    600: '#343B4A',
  },

  // Neutral: Charcoal & Graphite
  graphite: {
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#868E96',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
  },

  // Restrained Semantic Accents
  accents: {
    growth: {
      light: '#2E7D5B',
      DEFAULT: '#226949',
      dark: '#4ADE80',
      surface: 'rgba(46, 125, 91, 0.08)',
      surfaceDark: 'rgba(74, 222, 128, 0.12)',
    },
    energy: {
      light: '#D97706',
      DEFAULT: '#B45309',
      dark: '#FBBF24',
      surface: 'rgba(217, 119, 6, 0.08)',
      surfaceDark: 'rgba(251, 191, 36, 0.12)',
    },
    reflection: {
      light: '#5B5EA6',
      DEFAULT: '#4D5091',
      dark: '#818CF8',
      surface: 'rgba(91, 94, 166, 0.08)',
      surfaceDark: 'rgba(129, 140, 248, 0.12)',
    },
    attention: {
      light: '#C53030',
      DEFAULT: '#9B2C2C',
      dark: '#F87171',
      surface: 'rgba(197, 48, 48, 0.08)',
      surfaceDark: 'rgba(248, 113, 113, 0.12)',
    },
    recovery: {
      light: '#0D9488',
      DEFAULT: '#0F766E',
      dark: '#2DD4BF',
      surface: 'rgba(13, 148, 136, 0.08)',
      surfaceDark: 'rgba(45, 212, 191, 0.12)',
    },
  },

  // 7 Life Area Anchors
  lifeAreas: {
    mind: '#6366F1',
    health: '#10B981',
    career: '#0284C7',
    relationships: '#EC4899',
    personal: '#F59E0B',
    finance: '#14B8A6',
    purpose: '#8B5CF6',
  },
} as const;

// Semantic Theme Mapping (Light / Dark)
export const lightTheme = {
  background: {
    primary: palette.ivory[100],      // #FAF8F5
    secondary: palette.ivory[200],    // #F5F2EB
    tertiary: palette.ivory[300],     // #EFECE4
    elevated: '#FFFFFF',
  },
  surface: {
    primary: '#FFFFFF',
    subtle: palette.ivory[200],
    hover: 'rgba(15, 17, 21, 0.03)',
    active: 'rgba(15, 17, 21, 0.06)',
    selected: 'rgba(46, 125, 91, 0.08)',
  },
  text: {
    primary: palette.ink[900],        // #0F1115
    secondary: palette.graphite[700], // #343A40
    muted: palette.graphite[500],     // #868E96
    inverse: '#FFFFFF',
  },
  border: {
    subtle: 'rgba(15, 17, 21, 0.06)',
    default: 'rgba(15, 17, 21, 0.12)',
    strong: 'rgba(15, 17, 21, 0.24)',
    focus: palette.accents.growth.DEFAULT,
  },
  accents: {
    growth: palette.accents.growth.DEFAULT,
    energy: palette.accents.energy.DEFAULT,
    reflection: palette.accents.reflection.DEFAULT,
    attention: palette.accents.attention.DEFAULT,
    recovery: palette.accents.recovery.DEFAULT,
  },
  status: {
    success: '#15803D',
    warning: '#B45309',
    error: '#B91C1C',
    info: '#1D4ED8',
  },
} as const;

export const darkTheme = {
  background: {
    primary: palette.ink[900],        // #0F1115
    secondary: palette.ink[850],      // #16191F
    tertiary: palette.ink[800],       // #1D2129
    elevated: palette.ink[700],       // #272C37
  },
  surface: {
    primary: palette.ink[850],
    subtle: palette.ink[800],
    hover: 'rgba(255, 255, 255, 0.04)',
    active: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(74, 222, 128, 0.12)',
  },
  text: {
    primary: palette.ivory[100],      // #FAF8F5
    secondary: palette.graphite[300], // #DEE2E6
    muted: palette.graphite[500],     // #868E96
    inverse: palette.ink[900],
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.07)',
    default: 'rgba(255, 255, 255, 0.14)',
    strong: 'rgba(255, 255, 255, 0.28)',
    focus: palette.accents.growth.dark,
  },
  accents: {
    growth: palette.accents.growth.dark,
    energy: palette.accents.energy.dark,
    reflection: palette.accents.reflection.dark,
    attention: palette.accents.attention.dark,
    recovery: palette.accents.recovery.dark,
  },
  status: {
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
  },
} as const;
