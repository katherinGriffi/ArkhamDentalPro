/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        raspberry: {
          50:  '#ffe7f3',   // claro pero más vivo
          100: '#ffc4e0',   // rosa fuerte, aún profesional
          500: '#b0005a',   // magenta intenso y dominante
          700: '#8b0046',   // tono profundo con fuerza visual
          900: '#4c0026'    // muy oscuro, casi vino, ideal para fondo o énfasis
        }
      }
    }
  },
  plugins: [],
} 