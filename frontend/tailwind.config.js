/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores del hospital basados en el logo
        hospital: {
          blue: '#4A90E2',      // Azul claro del logo
          darkBlue: '#2C5282',  // Azul más oscuro
          green: '#38A169',     // Verde del logo
          lightGreen: '#68D391', // Verde claro
          gray: '#F7FAFC',      // Gris claro para fondos
          darkGray: '#2D3748',  // Gris oscuro para texto
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


