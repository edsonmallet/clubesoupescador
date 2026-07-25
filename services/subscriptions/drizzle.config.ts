import { resolve } from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['subscriptions'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
