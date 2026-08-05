import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1F4E5F',
          moss: '#445C46',
          sand: '#E5D8B7',
          rust: '#C66A2B',
          ink: '#303030',
        },
      },
      fontFamily: {
        heading: [
          'var(--font-heading)',
          'Impact',
          'ui-sans-serif',
          'sans-serif',
        ],
        body: ['var(--font-sora)', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out',
        'scale-in': 'scale-in 220ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
