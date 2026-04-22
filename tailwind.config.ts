import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        'card-hover': 'var(--color-card-hover)',
        border: 'var(--color-border)',
        'border-subtle': 'var(--color-border-subtle)',
        violet: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dim: 'rgba(124, 58, 237, 0.15)',
          glow: 'rgba(124, 58, 237, 0.3)',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          dim: 'var(--color-ink-dim)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-violet': 'pulseViolet 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseViolet: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(124, 58, 237, 0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
