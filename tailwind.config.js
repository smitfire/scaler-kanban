/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // blue-500
        'todo': '#ef4444',  // red-500
        'inProgress': '#f59e0b', // amber-500
        'done': '#10b981',  // emerald-500
        'terminology': '#8b5cf6', // violet-500
        'supply-partners': '#3b82f6', // blue-500
        'supply-packages': '#ec4899', // pink-500
      }
    },
  },
  plugins: [],
} 