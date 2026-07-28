/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neu: {
          bg: {
            light: '#E0E5EC',
            dark: '#1E2130',
          },
          accent: '#6C63FF',
          accentHover: '#5A52E0',
          lightShadow: {
            light: '#FFFFFF',
            dark: '#2A2F45',
          },
          darkShadow: {
            light: '#A3B1C6',
            dark: '#151821',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'neu-card': '16px',
        'neu-btn': '12px',
      }
    },
  },
  plugins: [],
}
