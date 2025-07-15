import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        handwritten: ['Tektur', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'wave': 'wave 1.3s ease-in-out infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            ul: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
              paddingLeft: '1.5em',
              listStyleType: 'disc',
            },
            'ul > li': {
              paddingLeft: '0.5em',
              marginTop: '0.25em',
              marginBottom: '0.25em',
              fontSize: '12px',
              lineHeight: '1.25rem',
            },
            'ul > li::marker': {
              color: '#31F46E',
            },
          },
        },
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(1rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        wave: {
          '0%, 100%': {
            transform: 'scale(0)',
          },
          '50%': {
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()]
}
