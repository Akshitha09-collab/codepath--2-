/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: "#2F5BEA",
        strong: "#1F9D7A",
        medium: "#E2A02D",
        weak: "#D9577A",
      },
    },
  },
  plugins: [],
};
