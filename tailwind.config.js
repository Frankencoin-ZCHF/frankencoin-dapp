/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /grid-cols-/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
  ],
  theme: {
    fontFamily: {
      sans: ['Helvetica', 'ui-sans-serif'],
    },
    colors: {
      black: '#000000',
      white: '#FFFFFF',
      green: '#54b208',
      red: '#bb0c08',
      gray: {
        100: '#F8F8F8',
        200: '#E5E4DF',
        300: '#969286',
        400: '#8D8D8D',
        500: '#4A4A4A',
      },
      neutral: {
        100: '#F7F5F0',
        200: '#DFD9C7',
      },
      transparent: 'rgba(0,0,0,0)',
    },
  },
  plugins: [],
};
