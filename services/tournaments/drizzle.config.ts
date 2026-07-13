import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['tournaments'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
