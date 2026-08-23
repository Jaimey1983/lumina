import type { Config } from 'tailwindcss';

const config = {
  theme: {
    extend: {
      colors: {
        lumina: {
          purple: '#2563EB',
          'purple-light': '#60a5fa',
          'purple-pale': '#dbeafe',
          'purple-soft': '#eff6ff',
          blue: '#60A5FA',
          'blue-light': '#93c5fd',
          'blue-pale': '#dbeafe',
          'blue-soft': '#eff6ff',
          bg: '#eff6ff',
          surface: '#ffffff',
          border: '#e5e7eb',
          navy: '#1e1b4b',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
      backgroundImage: {
        'lumina-gradient': 'linear-gradient(135deg, #2563EB, #60A5FA)',
        'lumina-gradient-soft':
          'linear-gradient(135deg, #60a5fa, #93c5fd)',
      },
      borderRadius: {
        'lumina-xs': '2px',
        'lumina-sm': '4px',
        'lumina-md': '6px',
        'lumina-lg': '10px',
        'lumina-xl': '12px',
        'lumina-2xl': '16px',
      },
      boxShadow: {
        'lumina-xs': '0px 2px 6px rgba(0, 0, 0, 0.07)',
        'lumina-sm': '0px 2px 10px rgba(0, 0, 0, 0.08)',
        'lumina-md': '0px 4px 14px rgba(0, 0, 0, 0.08)',
        'lumina-lg': '0px 6px 20px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'lumina-xs': ['0.75rem', { lineHeight: '1.2' }],
        'lumina-sm': ['0.8125rem', { lineHeight: '1.54' }],
        'lumina-md': ['0.9375rem', { lineHeight: '1.47' }],
        'lumina-lg': ['1.125rem', { lineHeight: '1.56' }],
        'lumina-xl': ['1.5rem', { lineHeight: '1.58' }],
        'lumina-2xl': ['1.75rem', { lineHeight: '1.5' }],
      },
    },
  },
} satisfies Config;

export default config;
