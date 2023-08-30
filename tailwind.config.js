/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /grid-cols-/,
      variants: ["sm", "md", "lg", "xl", "2xl"],
    },
  ],
  theme: {
    fontFamily: {
      sans: ["Helvetica", "ui-sans-serif"],
    },
    extend: {
      height: {
        main: "calc(100vh)",
      },
      minHeight: {
        content: "calc(100vh - 190px)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
