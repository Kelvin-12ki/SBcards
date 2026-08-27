/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // WEB: NEXAS blue. The key stays `gold` on purpose — text-gold,
        // bg-gold etc. are used throughout, and renaming the token is a
        // separate, riskier change.
        gold: {
          DEFAULT: '#2563EB',
          strong: '#1D4ED8',
          soft: 'rgba(37,99,235,0.12)',
          ink: '#FFFFFF',
        },
        background: '#0A0A0B',
        surface: {
          1: '#141416',
          2: '#1C1C1F',
          3: '#242428',
        },
        border: {
          subtle: '#2A2A2E',
        },
        text: {
          primary: '#F5F5F7',
          secondary: '#8E8E93',
          tertiary: '#636366',
        },
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171',
        info: '#60A5FA',
        /* ── Magical palette ── */
        neon: {
          cyan: '#00F5FF',
          pink: '#FF6EC7',
          purple: '#BF5FFF',
          blue: '#3B82F6',
        },
        aurora: {
          green: '#00E5A0',
          teal: '#00D4AA',
          blue: '#4F8FFF',
          purple: '#9B5FFF',
          pink: '#FF6EB4',
        },
        holographic: {
          from: '#FF6EC7',
          mid: '#7B61FF',
          to: '#00F5FF',
        },
      },
      fontFamily: {
        display: ['Urbanist', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Urbanist', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        pill: '9999px',
      },
      animation: {
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'aurora-shift': 'aurora-shift 8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'border-dance': 'border-dance 4s linear infinite',
      },
      keyframes: {
        skeleton: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'aurora-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        'border-dance': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
};
