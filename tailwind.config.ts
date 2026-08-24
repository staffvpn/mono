import type { Config } from 'tailwindcss';

/**
 * Дизайн-система TEYDO.
 * Цвета заданы через CSS-переменные — так их подхватывает и тёмная тема,
 * и параметры темы Telegram.
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        brand: 'rgb(var(--c-brand) / <alpha-value>)',
        'brand-soft': 'rgb(var(--c-brand-soft) / <alpha-value>)',
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        ok: 'rgb(var(--c-ok) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
      },
      borderRadius: {
        sm: '10px', md: '16px', lg: '22px', xl: '28px', '2xl': '34px',
      },
      boxShadow: {
        pop: '4px 4px 0 rgb(var(--c-ink))',
        'pop-sm': '2px 2px 0 rgb(var(--c-ink))',
        'pop-lg': '7px 7px 0 rgb(var(--c-ink))',
        soft: '0 18px 40px -24px rgb(var(--c-ink) / 0.45)',
      },
      borderWidth: { 3: '3px' },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.92)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        rise: { '0%': { transform: 'translateY(14px)', opacity: '0' }, '100%': { transform: 'none', opacity: '1' } },
        flyIn: {
          '0%': { opacity: '0', transform: 'translateY(50px) scale(.9) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },

        /* Мультяшная моторика: приземление с перелётом, покачивание,
           дрожь и болтание — то, чего не хватало статичной вёрстке. */
        popIn: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(.86) rotate(-2deg)' },
          '60%': { opacity: '1', transform: 'translateY(-6px) scale(1.03) rotate(.6deg)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        wobble: {
          '0%,100%': { transform: 'rotate(-2.5deg)' },
          '50%': { transform: 'rotate(2.5deg)' },
        },
        swing: {
          '0%,100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' },
        },
        drift: { '100%': { transform: 'translateX(-50%)' } },
        twinkle: {
          '0%,100%': { opacity: '.35', transform: 'scale(.85)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        squish: {
          '0%,100%': { transform: 'scale(1,1)' },
          '45%': { transform: 'scale(1.06,.94)' },
          '70%': { transform: 'scale(.97,1.03)' },
        },
      },
      animation: {
        pop: 'pop .3s cubic-bezier(.34,1.56,.64,1) both',
        rise: 'rise .45s cubic-bezier(.22,.8,.24,1) both',
        flyIn: 'flyIn .5s cubic-bezier(.34,1.56,.64,1) both',
        bob: 'bob 4s ease-in-out infinite',
        shimmer: 'shimmer 1.4s infinite',
        popIn: 'popIn .62s cubic-bezier(.34,1.56,.64,1) both',
        wobble: 'wobble 3.2s ease-in-out infinite',
        swing: 'swing 2.6s ease-in-out infinite',
        drift: 'drift 26s linear infinite',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        squish: 'squish .5s cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
};
export default config;
