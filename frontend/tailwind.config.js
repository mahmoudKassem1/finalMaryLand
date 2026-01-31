/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your new Reddish theme here
        primary: {
          DEFAULT: '#DC2626', // A solid, professional medical red (Red-600)
          hover: '#B91C1C',   // Darker red for button hovers
          light: '#FEE2E2',   // Very light red for backgrounds
        },
      },
    },
  },
  plugins: [],
}