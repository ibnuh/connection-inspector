import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.{vue,js,ts}',
    './error.{vue,js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#020817',
        foreground: '#0f172a',
        card: '#020817',
        'card-foreground': '#e5e7eb',
        muted: '#020617',
        border: '#1f2937',
        ring: '#2563eb',
        primary: {
          DEFAULT: '#0ea5e9',
          foreground: '#0b1120'
        },
        secondary: {
          DEFAULT: '#1e293b',
          foreground: '#e5e7eb'
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.65)'
      }
    }
  },
  plugins: []
}

export default config


