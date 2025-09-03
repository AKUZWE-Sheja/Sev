/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-orange': '#F4A261',
        'secondary-orange': '#E67F22',
        'dark-orange': '#BF5B0A',
        'light-orange-tint': '#FFDAB9',
        'off-white-tint': '#FFF5E6',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'dancing': ['Dancing Script', 'cursive'],
        'lato': ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
}