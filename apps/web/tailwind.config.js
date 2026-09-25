/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F7F8FC',
        surface: '#FFFFFF',
        'surface-2': '#F2F4F8',
        'text-primary': '#0B1020',
        'text-secondary': '#667085',
        accent: '#6366F1',
        'accent-2': '#8B5CF6',
        cyan: '#06B6D4',
        success: '#22C55E',
        amber: '#F59E0B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(99,102,241,0.18)',
        'glow-lg': '0 0 80px rgba(99,102,241,0.22)',
        card: '0 1px 3px rgba(11,16,32,0.06), 0 4px 16px rgba(11,16,32,0.05)',
        'card-hover': '0 4px 24px rgba(11,16,32,0.10), 0 1px 4px rgba(11,16,32,0.06)',
        float: '0 20px 60px rgba(11,16,32,0.12)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'orbit': 'orbit 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
};
