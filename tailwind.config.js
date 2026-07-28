/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: '#E0E5EC',
          accent: '#6C63FF',
          accentHover: '#5A52E0',
          lightShadow: '#FFFFFF',
          darkShadow: '#A3B1C6',
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
