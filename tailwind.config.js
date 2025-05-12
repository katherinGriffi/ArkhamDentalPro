module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {  // 👈 Adicione esta seção
        raspberry: {
          50: '#fdf2f8',   // Claro (para hovers suaves)
          100: '#f8f1f6',  // Seu colorSecondary
          500: '#801461',  // Seu colorPrimary (Raspberry principal)
          700: '#5d0e45', // Seu colorPrimaryDark
          900: '#3a0934',  // Escuro (para textos)
        },
        accent: '#ff9e00', // Seu colorAccent (laranja)
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}