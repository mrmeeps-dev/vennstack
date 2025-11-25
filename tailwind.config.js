/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'category-a': '#3b82f6', // medium blue (matching logo)
        'category-b': '#f97316', // vibrant orange (matching logo)
        'intersection': '#14b8a6', // teal/cyan (matching logo intersection)
        'outside': '#e2e8f0', // slate-200
      },
    },
  },
  plugins: [],
}

