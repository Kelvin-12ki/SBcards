/**
 * Colours resolve through CSS variables so a single `data-theme` attribute flips
 * the whole site. Every variable is an "R G B" triplet, which keeps Tailwind's
 * `/opacity` modifiers working (e.g. `bg-ink-600/80`).
 */
const withVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: withVar('ink-950'),
          900: withVar('ink-900'),
          850: withVar('ink-850'),
          800: withVar('ink-800'),
          750: withVar('ink-750'),
          700: withVar('ink-700'),
          600: withVar('ink-600'),
          500: withVar('ink-500'),
          400: withVar('ink-400'),
        },
        fog: {
          100: withVar('fog-100'),
          200: withVar('fog-200'),
          300: withVar('fog-300'),
          400: withVar('fog-400'),
          500: withVar('fog-500'),
        },
        accent: {
          DEFAULT: withVar('accent'),
          dim: withVar('accent-dim'),
        },
        gold: {
          DEFAULT: withVar('gold'),
        },
        danger: withVar('danger'),
        success: withVar('success'),
        /** Strongest foreground — white on dark, near-black on light. */
        strong: withVar('strong'),
        /** Foreground that sits on top of an accent/gold fill. */
        onaccent: withVar('onaccent'),
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 0 22px -6px rgb(var(--accent) / 0.4)',
        panel: 'var(--shadow-panel)',
        lift: 'var(--shadow-lift)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(3%, -4%, 0) scale(1.06)' },
          '66%': { transform: 'translate3d(-3%, 3%, 0) scale(0.97)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        drift: 'drift 22s ease-in-out infinite',
        'drift-slow': 'drift 34s ease-in-out infinite reverse',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
