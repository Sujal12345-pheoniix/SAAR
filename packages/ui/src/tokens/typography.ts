// SAAR Design System — Typography Tokens
// Editorial sophistication with clean, highly legible hierarchies

export const typography = {
  fontFamily: {
    // Primary display & reading serif/editorial or refined sans
    display: 'Playfair Display, Georgia, serif',
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    numeric: 'Inter, "SF Pro Text", system-ui, sans-serif',
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Type Scale & Roles
  scale: {
    display: {
      fontSize: '2.5rem',      // 40px
      lineHeight: '3rem',       // 48px
      letterSpacing: '-0.025em',
      fontWeight: '600',
    },
    heading: {
      fontSize: '1.875rem',    // 30px
      lineHeight: '2.25rem',    // 36px
      letterSpacing: '-0.02em',
      fontWeight: '600',
    },
    subheading: {
      fontSize: '1.25rem',     // 20px
      lineHeight: '1.75rem',    // 28px
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
    bodyLarge: {
      fontSize: '1.125rem',    // 18px
      lineHeight: '1.75rem',    // 28px
      letterSpacing: '-0.005em',
      fontWeight: '400',
    },
    body: {
      fontSize: '1rem',        // 16px
      lineHeight: '1.5rem',     // 24px
      letterSpacing: '0',
      fontWeight: '400',
    },
    caption: {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.25rem',    // 20px
      letterSpacing: '0.005em',
      fontWeight: '400',
    },
    metadata: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',       // 16px
      letterSpacing: '0.04em',
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    numericLarge: {
      fontSize: '2.25rem',     // 36px
      lineHeight: '2.5rem',
      letterSpacing: '-0.03em',
      fontWeight: '600',
      fontVariantNumeric: 'tabular-nums',
    },
    numericMedium: {
      fontSize: '1.5rem',      // 24px
      lineHeight: '2rem',
      letterSpacing: '-0.02em',
      fontWeight: '600',
      fontVariantNumeric: 'tabular-nums',
    },
  },
} as const;
