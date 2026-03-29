/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d1b35',
          800: '#152240',
          700: '#1c2f58',
          600: '#233a70',
          500: '#2d4a8a',
          400: '#4060a8',
          300: '#6080c0',
          200: '#a0b4d8',
          100: '#dce6f4',
          50:  '#f0f4fb',
        },
        gold: {
          600: '#8a6200',
          500: '#b07e00',
          400: '#d4a017',
          300: '#e8c060',
          200: '#f5dfa0',
          100: '#fdf6e0',
        },
        gray: {
          900: '#1a2440',
          700: '#3a4a68',
          500: '#6a7a98',
          400: '#9aaac0',
          300: '#c8d0e0',
          200: '#e2e6f0',
          100: '#f0f2f7',
          50:  '#f8f9fc',
        },
        green: {
          700: '#145a32',
          500: '#1e8a4a',
          200: '#a8e0c0',
          100: '#d8f5e8',
        },
        amber: {
          700: '#7a4e00',
          200: '#fcd880',
          100: '#fef3c0',
        },
        red: {
          700: '#8a1a1a',
          200: '#f5b0b0',
          100: '#fde8e8',
        },
        orange: {
          700: '#7a3010',
          200: '#f8c090',
          100: '#fff0e4',
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', 'serif'],
        body:    ["'DM Sans'", 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.35s ease both',
        'fade-up-1': 'fadeUp 0.35s 0.05s ease both',
        'fade-up-2': 'fadeUp 0.35s 0.10s ease both',
        'fade-up-3': 'fadeUp 0.35s 0.15s ease both',
        'fade-up-4': 'fadeUp 0.35s 0.20s ease both',
        'fade-up-5': 'fadeUp 0.35s 0.25s ease both',
        'fade-in':   'fadeIn 0.2s ease both',
        'scale-in':  'scaleIn 0.22s ease both',
      },
      boxShadow: {
        'card':    '0 2px 8px rgba(27,42,74,0.06)',
        'card-lg': '0 8px 28px rgba(27,42,74,0.14)',
        'modal':   '0 24px 64px rgba(10,18,40,0.22)',
        'nav':     '0 4px 16px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
