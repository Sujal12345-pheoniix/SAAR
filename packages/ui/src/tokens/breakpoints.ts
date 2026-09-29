// SAAR Design System — Responsive Breakpoints & Z-Index Tokens

export const breakpoints = {
  sm: '640px',   // Mobile landscape / Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops / Small Desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large Studio displays
} as const;

export const breakpointsNumeric = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const zIndex = {
  base: 0,
  card: 1,
  sticky: 10,
  dropdown: 20,
  drawer: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const;
