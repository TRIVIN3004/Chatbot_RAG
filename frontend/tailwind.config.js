/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        libera: {
          primary: '#5B5FFF',
          secondary: '#7B61FF',
          bg: '#0F172A',
          card: '#1E293B',
          accent: '#38BDF8',
          text: '#F8FAFC',
          muted: '#94A3B8',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 25px rgba(91, 95, 255, 0.35)',
        'glow-accent': '0 0 25px rgba(56, 189, 248, 0.35)',
      }
    },
  },
  plugins: [],
}
