/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#855300',
        'primary-container': '#f59e0b',
        'on-primary': '#ffffff',
        'on-primary-container': '#613b00',
        secondary: '#5f5e60',
        surface: '#f9f9f7',
        'surface-container': '#eeeeec',
        'surface-container-low': '#f4f4f2',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#e8e8e6',
        'on-surface': '#1a1c1b',
        'outline-variant': '#d8c3ad',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
      },
      borderRadius: {
        xl: '0.5rem',
        full: '0.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Geist', 'monospace'],
      },
    },
  },
  plugins: [],
};
