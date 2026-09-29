// SAAR Design System — Elevation & Shadows
// Ambient, architectural ink elevation without excessive blur or harsh drop-shadows

export const shadows = {
  none: 'none',
  elevation1: '0 1px 2px 0 rgba(15, 17, 21, 0.04)',
  elevation2: '0 2px 6px -1px rgba(15, 17, 21, 0.06), 0 1px 3px -1px rgba(15, 17, 21, 0.04)',
  elevation3: '0 6px 16px -2px rgba(15, 17, 21, 0.08), 0 2px 6px -2px rgba(15, 17, 21, 0.04)',
  elevation4: '0 12px 28px -4px rgba(15, 17, 21, 0.12), 0 4px 10px -3px rgba(15, 17, 21, 0.06)',
  inner: 'inset 0 1px 2px 0 rgba(15, 17, 21, 0.06)',
} as const;

export const darkShadows = {
  none: 'none',
  elevation1: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  elevation2: '0 2px 6px -1px rgba(0, 0, 0, 0.4), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
  elevation3: '0 6px 16px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
  elevation4: '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 4px 10px -3px rgba(0, 0, 0, 0.4)',
  inner: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
} as const;
