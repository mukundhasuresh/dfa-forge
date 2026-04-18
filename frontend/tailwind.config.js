/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"IBM Plex Mono"', 'monospace'],
        'syne': ['Syne', 'sans-serif'],
      },
      colors: {
        // Dark SaaS terminal theme
        background: '#0a0c10',
        surface: '#111318',
        'surface-2': '#181c24',
        border: '#1e2330',
        text: '#e8ecf4',
        muted: '#5a6480',
        accent: '#00d4aa',
        blue: '#0099ff',
        warning: '#f59e0b',
        danger: '#ef4444',
        purple: '#8b5cf6',
      },
      animation: {
        'pulse-dot': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

