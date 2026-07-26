import { resolve } from 'node:path'
import type { createEnv as CreateEnvFn } from '@t3-oss/env-core/types'
import { config } from 'dotenv'
import { z } from 'zod'

// Loads the monorepo-root `.env` explicitly so this resolves the same way
// regardless of the process's cwd (turbo, `npm run dev --workspace=apps/bff`,
// vitest, or a plain `node dist/index.js` all differ here). In production,
// the file won't exist and `config()` fails silently, leaving process.env
// untouched — real values come from the container runtime instead.
config({ path: resolve(__dirname, '../../../../.env') })

// `@t3-oss/env-core` is ESM-only. `tsc`'s CommonJS output already compiles a
// static `import` down to a plain `require()`, which Node's native
// require(esm) unwraps correctly at runtime (verified: `npm run build` +
// `node dist/index.js` works). But `tsx watch` (used by `npm run dev`)
// resolves the tsconfig `paths` remap live at runtime, not just for
// type-checking — so pointing `paths` at the package's own specifier would
// redirect the real `require()` call to the `.d.ts` file instead of the
// compiled `dist/index.js`, crashing with `createEnv is not a function`.
// The `@t3-oss/env-core/types` alias (mapped only in tsconfig `paths`) keeps
// the type-only import isolated from the runtime specifier below, which
// resolves normally through the package's `exports` map.
const { createEnv } = require('@t3-oss/env-core') as {
  createEnv: typeof CreateEnvFn
}

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3004),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    DATABASE_URL: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_SERVICE_ACCOUNT: z.string().min(1),
    SUBSCRIPTIONS_SERVICE_URL: z
      .string()
      .url()
      .default('http://localhost:3005'),
    STORE_SERVICE_URL: z.string().url().default('http://localhost:3006'),
    CASHBACK_SERVICE_URL: z.string().url().default('http://localhost:3007'),
    RAFFLES_SERVICE_URL: z.string().url().default('http://localhost:3008'),
  },
  runtimeEnv: process.env,
})
