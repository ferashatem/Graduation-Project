/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        stolzl: ["Stolzl", "sans-serif"],
        arabic: ["Noto Sans Arabic", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#060d14",
          900: "#0d1b2a",
          800: "#122234",
          700: "#1e3a5f",
          600: "#245180",
          500: "#2e86ab",
          400: "#4ba3c7",
          300: "#7fc0da",
          200: "#b3d9ec",
          100: "#d6e8f7",
          50:  "#edf5fb",
        },
      },
      screens: {
        "ipad-portrait":      "834px",
        "ipad-landscape":     "1194px",
        "ipad-pro-portrait":  "1024px",
        "ipad-pro-landscape": "1366px",
        "ipad-mini-portrait": "768px",
        "ipad-mini-landscape":"1024px",
      },
    },
  },
  plugins: [],
};
