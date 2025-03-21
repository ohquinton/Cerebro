/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",       // Next.js App Router pages
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}" // UI components
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065"
        },
        green: {
          400: "#4ADE80",
          500: "#22C55E"
        }
      }
    }
  },
  plugins: []
};
