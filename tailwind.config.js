/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        erp: {
          primary: '#58CC02',
          primary_shadow: '#58A700',
          secondary: '#CE82FF',
          secondary_shadow: '#A568CC',
          danger: '#FF4B4B',
          danger_shadow: '#EA2B2B',
          info: '#1CB0F6',
          info_shadow: '#1899D6',
          background: '#FFFFFF',
          surface: '#F7F7F7',
          text: '#4B4B4B',
          border: '#E5E5E5',
        },
        primary: {
          DEFAULT: '#41c8df',  // gold accent
          50: '#FEF9E7',
          100: '#FCF3CF',
          200: '#F9E7A0',
          300: '#F7DB70',
          400: '#F4CF41',
          500: '#41c8df', // same
          600: '#A68328',
          700: '#7B5A1D',
          800: '#523112',
          900: '#291907'
        },
        background: {
          DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
          100: 'rgb(var(--color-bg-100) / <alpha-value>)'
        },
        secondary: 'rgb(var(--color-text) / <alpha-value>)',
      },
      boxShadow: {
        'erp-btn': '0 4px 0 0 rgba(0, 0, 0, 0.1)',
        'erp-btn-primary': '0 4px 0 0 #58A700',
        'erp-btn-secondary': '0 4px 0 0 #A568CC',
        'erp-btn-danger': '0 4px 0 0 #EA2B2B',
        'erp-btn-info': '0 4px 0 0 #1899D6',
        'erp-card': '0 2px 0 0 #E5E5E5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
    },
  },
  plugins: [
    // Add custom utilities for animation delays
    function ({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-2000': {
          'animation-delay': '2s',
        },
        '.animation-delay-4000': {
          'animation-delay': '4s',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};