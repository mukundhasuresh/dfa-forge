/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        syne: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

