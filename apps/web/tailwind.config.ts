import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(240 5.9% 90%)',
        input: 'hsl(240 5.9% 90%)',
        ring: 'hsl(240 10% 3.9%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(240 10% 3.9%)',
        primary: {
          DEFAULT: 'hsl(240 5.9% 10%)',
          foreground: 'hsl(0 0% 98%)'
        },
        secondary: {
          DEFAULT: 'hsl(240 4.8% 95.9%)',
          foreground: 'hsl(240 5.9% 10%)'
        },
        muted: {
          DEFAULT: 'hsl(240 4.8% 95.9%)',
          foreground: 'hsl(240 3.8% 45%)'
        },
        accent: {
          DEFAULT: 'hsl(240 4.8% 95.9%)',
          foreground: 'hsl(240 5.9% 10%)'
        },
        destructive: {
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(0 0% 98%)'
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)'
      }
    }
  },
  plugins: []
}

export default config


