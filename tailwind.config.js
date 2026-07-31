/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0F0F10',
        surface: '#17171A',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E6C96C',
          dark: '#B8962D',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
