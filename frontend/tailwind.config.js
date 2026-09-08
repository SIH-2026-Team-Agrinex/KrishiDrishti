/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fdfbf7',
          100: '#f7f2ea',
          200: '#eee3d2',
          300: '#e0ccb2',
          400: '#cbb08f',
          500: '#b7956f',
          600: '#9e7956',
          700: '#7e5d43',
          800: '#674c39',
          900: '#543f31',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(22, 163, 74, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 12px 40px 0 rgba(22, 163, 74, 0.16), 0 4px 12px 0 rgba(0, 0, 0, 0.06)',
        'glow-green': '0 0 25px -5px rgba(34, 197, 94, 0.4)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        scan: {
          '0%': { top: '0%' },
          '50%': { top: '95%' },
          '100%': { top: '0%' },
        }
      }
    },
  },
  plugins: [],
}
