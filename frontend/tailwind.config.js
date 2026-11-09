import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [path.join(__dirname, 'index.html'), path.join(__dirname, 'src/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-tinted': 'rgb(var(--bg-tinted) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        soft: 'rgb(var(--soft) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-light': 'rgb(var(--brand-light) / <alpha-value>)',
        'brand-deep': 'rgb(var(--brand-deep) / <alpha-value>)',
        cta: 'rgb(var(--cta) / <alpha-value>)',
        'cta-deep': 'rgb(var(--cta-deep) / <alpha-value>)',
        'cta-ink': 'rgb(var(--cta-ink) / <alpha-value>)',
        night: 'rgb(var(--night) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        good: 'rgb(var(--good) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Baloo 2 Variable"', '"Nunito Variable"', '"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Variable"', '"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        card: '0 4px 16px -4px rgb(var(--shadow) / 0.08), 0 2px 6px -1px rgb(var(--shadow) / 0.04)',
        pop: '0 14px 36px -8px rgb(var(--shadow) / 0.18), 0 4px 12px -2px rgb(var(--shadow) / 0.08)',
        'btn-cta': '0 4px 0 0 rgb(var(--cta-deep))',
        'btn-brand': '0 4px 0 0 rgb(var(--brand-deep))',
        'btn-good': '0 4px 0 0 #15803D',
        'btn-soft': '0 4px 0 0 rgb(var(--line))',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(.9)' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-46px) scale(1.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        pop: {
          '0%': { transform: 'scale(.88)', opacity: '0' },
          '70%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px) rotate(-1deg)' },
          '40%': { transform: 'translateX(6px) rotate(1deg)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        floatUp: 'floatUp 1.1s ease-out forwards',
        float: 'float 3.4s ease-in-out infinite',
        pop: 'pop .32s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shake: 'shake .4s ease-in-out',
        fadeIn: 'fadeIn .3s ease-out both',
        wiggle: 'wiggle 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
