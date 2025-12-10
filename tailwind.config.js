/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        stolzl: ["Stolzl", "sans-serif"],
      },
      screens: {
        // iPad Pro 11" (portrait)
        "ipad-portrait": "834px",
        // iPad Pro 11" (landscape)
        "ipad-landscape": "1194px",
        // iPad Pro 12.9" (portrait)
        "ipad-pro-portrait": "1024px",
        // iPad Pro 12.9" (landscape)
        "ipad-pro-landscape": "1366px",
        // You can add more precise breakpoints if needed
        "ipad-mini-portrait": "768px",
        "ipad-mini-landscape": "1024px",
      },
    },
  },
  plugins: [],
};
