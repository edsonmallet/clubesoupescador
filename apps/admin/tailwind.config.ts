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
    },
  },
  plugins: [],
}

export default config
