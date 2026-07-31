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
    },
  },
  plugins: [],
}

export default config
