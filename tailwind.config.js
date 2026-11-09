/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf6',
          100: '#dbfceb',
          200: '#baf7d9',
          300: '#86ecc0',
          400: '#4ad99f',
          500: '#23bf82',
          600: '#149964',
          700: '#117a52',
          800: '#006847', // Brand Color
          900: '#105038',
          950: '#082d20',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
