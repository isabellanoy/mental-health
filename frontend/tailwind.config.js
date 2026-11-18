/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "deep" es el tono con contraste suficiente para anillos de foco y texto
        lila: { DEFAULT: '#CDB4F6', light: '#E6DAFB', dark: '#A98BE0', deep: '#6D4FB3' },
        rosa: { DEFAULT: '#F9C6D9', light: '#FDE4ED', dark: '#F29CBB' },
        celeste: { DEFAULT: '#BDE3F7', light: '#DFF1FB', dark: '#8CCBEF' },
        menta: { DEFAULT: '#BFEBD7', light: '#E0F6EB', dark: '#8FD8B8' },
        durazno: { DEFAULT: '#FFD3B6', light: '#FFE9DA', dark: '#FFB88A' },
        crema: '#FFF8F0',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        blob: '2rem',
        pill: '9999px',
      },
      backgroundImage: {
        'pastel-aurora':
          'radial-gradient(at 15% 12%, #E6DAFB 0, transparent 55%), radial-gradient(at 88% 18%, #FDE4ED 0, transparent 55%), radial-gradient(at 50% 95%, #DFF1FB 0, transparent 60%)',
      },
      keyframes: {
        // Brillo pastel que se expande y se desvanece para resaltar un bloque
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(242, 156, 187, 0)' },
          '50%': { boxShadow: '0 0 0 14px rgba(242, 156, 187, 0.45)' },
        },
      },
      animation: {
        glow: 'glow 1.1s ease-in-out 2',
      },
      boxShadow: {
        suave: '0 8px 24px -8px rgba(169, 139, 224, 0.25)',
        'suave-lg': '0 16px 40px -12px rgba(169, 139, 224, 0.35)',
      },
    },
  },
  plugins: [],
}
