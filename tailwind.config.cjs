module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {theme: {
    extend: {
      colors: { // 👈 Añade esta sección
        raspberry: {
          50: '#fdf2f8',  // Opcional: versión más clara
          100: '#f8f1f6', // Tu colorSecondary
          500: '#801461', // Tu colorPrimary
          700: '#5d0e45', // Tu colorPrimaryDark
          900: '#3a0934'  // Opcional: versión más oscura
        }
      }
    }}
  },
  plugins: [],
}
