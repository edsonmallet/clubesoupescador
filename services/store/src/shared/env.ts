import type { createEnv as CreateEnvFn } from '@t3-oss/env-core/types'
import { z } from 'zod'

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
    PORT: z.coerce.number().default(3006),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  runtimeEnv: process.env,
})
