/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          950: '#020617',
        },
        navy: {
          900: '#0a0f1e',
          800: '#0d1530',
          700: '#1a2744',
          600: '#1e3a5f',
        },
        gold: {
          300: '#f0c040',
          400: '#e6b422',
          500: '#c9a227',
          600: '#a88020',
        }
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-in-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer':   'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(201,162,39,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(201,162,39,0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}
