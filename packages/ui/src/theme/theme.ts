// SAAR Design System — Theme Engine & CSS Variables

import { lightTheme, darkTheme } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { shadows, darkShadows } from '../tokens/shadows';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SaarTheme {
  colors: typeof lightTheme;
  shadows: typeof shadows;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
}

export function getTheme(mode: 'light' | 'dark'): SaarTheme {
  return {
    colors: mode === 'dark' ? (darkTheme as unknown as typeof lightTheme) : lightTheme,
    shadows: mode === 'dark' ? (darkShadows as unknown as typeof shadows) : shadows,
    typography,
    spacing,
    radius,
  };
}

// Generate CSS variable declarations for Root HTML
export function generateCssVariables(): { light: Record<string, string>; dark: Record<string, string> } {
  return {
    light: {
      '--saar-bg-primary': lightTheme.background.primary,
      '--saar-bg-secondary': lightTheme.background.secondary,
      '--saar-bg-tertiary': lightTheme.background.tertiary,
      '--saar-surface-primary': lightTheme.surface.primary,
      '--saar-surface-subtle': lightTheme.surface.subtle,
      '--saar-text-primary': lightTheme.text.primary,
      '--saar-text-secondary': lightTheme.text.secondary,
      '--saar-text-muted': lightTheme.text.muted,
      '--saar-border-default': lightTheme.border.default,
      '--saar-border-subtle': lightTheme.border.subtle,
      '--saar-accent-growth': lightTheme.accents.growth,
      '--saar-accent-energy': lightTheme.accents.energy,
      '--saar-accent-reflection': lightTheme.accents.reflection,
      '--saar-accent-attention': lightTheme.accents.attention,
      '--saar-accent-recovery': lightTheme.accents.recovery,
    },
    dark: {
      '--saar-bg-primary': darkTheme.background.primary,
      '--saar-bg-secondary': darkTheme.background.secondary,
      '--saar-bg-tertiary': darkTheme.background.tertiary,
      '--saar-surface-primary': darkTheme.surface.primary,
      '--saar-surface-subtle': darkTheme.surface.subtle,
      '--saar-text-primary': darkTheme.text.primary,
      '--saar-text-secondary': darkTheme.text.secondary,
      '--saar-text-muted': darkTheme.text.muted,
      '--saar-border-default': darkTheme.border.default,
      '--saar-border-subtle': darkTheme.border.subtle,
      '--saar-accent-growth': darkTheme.accents.growth,
      '--saar-accent-energy': darkTheme.accents.energy,
      '--saar-accent-reflection': darkTheme.accents.reflection,
      '--saar-accent-attention': darkTheme.accents.attention,
      '--saar-accent-recovery': darkTheme.accents.recovery,
    },
  };
}
