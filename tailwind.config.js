/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        line: 'var(--line)',
        primary: 'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        sage: 'var(--sage)',
        'sage-soft': 'var(--sage-soft)',
        amber: 'var(--amber)',
        'amber-soft': 'var(--amber-soft)',
        red: 'var(--red)',
        'red-soft': 'var(--red-soft)',
        plum: 'var(--plum)',
        'plum-soft': 'var(--plum-soft)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      maxWidth: {
        app: '480px',
      },
      screens: {
        'mobile-max': '480px',
      },
    },
  },
  plugins: [],
};
