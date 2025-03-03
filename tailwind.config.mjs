/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Mantener la paleta de colores actual
        primary: '#1E2A3C',      // Azul grisáceo oscuro
        secondary: '#EDEDED',    // Gris claro
        accent: '#D42C17',       // Rojo acento
        text: '#121212',         // Negro suave
        'text-secondary': '#6c7983', // Gris secundario
        background: '#FFFFFF',   // Fondo blanco
        
        // Variables derivadas
        'space-dark': '#1E2A3C',
        'space-darker': '#17202E',
        'stellar-light': '#EDEDED',
      },
      boxShadow: {
        // Sombras neumórficas
        'neumorphic-light': '9px 9px 18px rgba(30, 42, 60, 0.1)',
        'neumorphic-dark': '-9px -9px 18px rgba(255, 255, 255, 0.8)',
        'neumorphic': '9px 9px 18px rgba(30, 42, 60, 0.1), -9px -9px 18px rgba(255, 255, 255, 0.8)',
        'neumorphic-inset': 'inset 3px 3px 6px rgba(0, 0, 0, 0.1), inset -3px -3px 6px rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
    },
  },
  plugins: [],
}
