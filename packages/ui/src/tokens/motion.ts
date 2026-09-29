// SAAR Design System — Motion & Transition Tokens
// Natural, calm physics-based motion with strict reduced-motion safety

export const motion = {
  duration: {
    instant: '100ms',
    quick: '200ms',
    deliberate: '350ms',
    meditative: '600ms',
  },

  easing: {
    // Subtle ease-out for entrances
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    // Standard acceleration for exits
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    // Balanced ease-in-out for layout shifts
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    // Editorial spring
    gentleSpring: 'cubic-bezier(0.25, 1, 0.5, 1)',
  },

  spring: {
    stiff: { stiffness: 400, damping: 30 },
    gentle: { stiffness: 200, damping: 24 },
    calm: { stiffness: 120, damping: 18 },
  },
} as const;
