/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          teal: '#5BC0BE',
          sky: '#7C9DF0',
          lime: '#A3E635',
          blush: '#F8C8DC',
          dusk: '#7F5AF0',
        },
      },
    },
  },
  plugins: [],
};
