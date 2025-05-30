/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",

    './src/**/*.{js,jsx,ts,tsx}',
    './src/pages/components/Odontograma.tsx', 
    './src/pages/components/PaletteModal.tsx',
    './src/pages/components/OdontogramLegend.tsx',



  ],
  theme: {
    extend: {
      colors: {
        // Renombramos 'raspberry' a 'brand' o 'primary' para un uso más genérico
        // Los valores se han ajustado para centrarse en #76145C y #8C186D, creando una progresión armoniosa
        raspberry : {
          50:  '#FDEEF7', // Un tono muy claro, casi blanco, para fondos sutiles
          100: '#FADDEB', // Más claro, para resaltados suaves
          200: '#F4B7D6', // Un rosa-púrpura suave
          300: '#EE90C1', // Un tono medio-claro
          400: '#E869AB', // Un tono más vibrante, pero no el principal
          500: '#CE3C8D', // Un magenta más puro, puede ser un buen acento
          600: '#8C186D', // Tu segundo color base: un magenta oscuro vibrante
          700: '#76145C', // Tu color base principal: magenta profundo y profesional
          800: '#5E104A', // Un tono más oscuro que el base, para texto o fondos profundos
          900: '#3D0A2E', // Muy oscuro, casi negro-púrpura, para texto o fondos muy impactantes
          950: '#26061E', // El más oscuro, para contrastes extremos o fondos muy oscuros
        },
        carie: '#FF5C5C',
        'restauracao-resina': '#66D7D7',
        'restauracao-amalgama': '#708090',
        'restauracao-ceramica': '#FFDAB9',
        selante: '#A0DA8C',
        ausente: '#D3D3D3',
        implante: '#9370DB',
        coroa: '#FFD700',
        endodontia: '#FF8C00',
        fratura: '#FF6347',
        'mobilidade-grado1': '#FFA07A',
        'mobilidade-grado2': '#FF7F50',
        'mobilidade-grado3': '#FF4500',
        'selected-border': '#2980b9',
        'default-stroke': '#616161',
        'default-fill': '#FFFFFF',
        background: '#F8F5F7',

        // Definición de animaciones para Tailwind (para el menú móvil)
      animation: {
        'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
        // Puedes mantener otros colores si los usas, o añadir nuevos si necesitas una paleta secundaria
        // Por ejemplo, para neutrales, éxitos, advertencias, etc.
        // gray: { ... },
        // success: { ... },
        // warning: { ... },
        // error: { ... },
      }
    }
  },
  plugins: [],
}



