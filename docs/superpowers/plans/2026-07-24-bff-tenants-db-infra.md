# BFF Tenants DB Infra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `apps/bff` a real Postgres-backed `tenants` schema (tables, Drizzle client, repository, migration) and wire it into tenant resolution, replacing the Fase-0 `resolveTenant` stub.

**Architecture:** Clean Architecture layers inside `apps/bff/src` per `CLAUDE.md`: a pure `Tenant` domain entity + `ITenantRepository` interface, a Drizzle schema/client in `infrastructure/db`, a `TenantRepository` implementing the interface, and `infrastructure/http/proxy.ts` wiring the repository into the existing `createTenantAuthPreHandler` from `@clube/fastify-plugins`. A small addition to that shared plugin lets `x-tenant-slug` override host-based resolution for local dev/testing.

**Tech Stack:** Drizzle ORM 0.33 + drizzle-kit 0.24 (postgresql dialect), `@clube/db-client`, Vitest, `@testcontainers/postgresql` for the repository integration test, `dotenv` for loading the root `.env`.

## Global Constraints

- **No `docker-compose.yml`.** Confirmed with the user: Fase 0 deliberately uses an already-provisioned remote Postgres/Redis (documented in `README.md`, `.env`'s `DATABASE_URL`/`REDIS_URL`) instead of local containers. `npm run verify:infra` already passes against it (`109.123.251.34:5436`/`:6383`). Do not create a compose file; all migrations/seed run against the existing remote `DATABASE_URL`.
- **Seed scope is `tenants` only.** Confirmed with the user: the seed script inserts only the dev tenant. Plans (Bronze/Prata/.../Lenda) and `xp_config` belong to the `subscriptions` schema (Fase 2, not yet built) and are explicitly out of scope — do not create `services/subscriptions` schema tables as part of this plan.
- **No `@/*` path aliases.** `apps/bff/tsconfig.json` has no `@/*` → `./src/*` path mapping, and this repo's `tsx watch` / plain-`tsc`-then-`node` runtime setup does not rewrite TS path aliases (see the existing comment in `apps/bff/src/shared/env.ts` about the same constraint for `@t3-oss/env-core/types`). CLAUDE.md's example code uses `@/` imports, but adding the alias now would type-check while silently breaking `npm run dev` and `node dist/index.js`. Use relative imports for all new cross-file references in `apps/bff`.
- **RLS uses `current_setting(..., true)`.** CLAUDE.md's literal RLS snippet (`current_setting('app.tenant_id')::uuid`) throws when the session variable was never set — and nothing in this codebase sets `app.tenant_id` yet (that arrives with a future per-request transaction-scoping task). Using the two-argument `missing_ok = true` form degrades to `NULL` (i.e., zero rows visible) instead of a hard error for any future non-superuser app role, without changing behavior for the current superuser (`postgres`) connection, which bypasses RLS entirely regardless.
- **No new HTTP routes.** This plan does not add a route that calls `tenantAuthPreHandler` — no business route exists yet to attach it to (that's Fase 1's tenant/offer CRUD work). `proxy.ts` exports it ready for future routes; correctness is proven with unit tests instead of a manual curl against a live route.
- File naming: kebab-case for the entity (`tenant.ts`) and repository (`tenant.repository.ts`), per CLAUDE.md's general file-naming rule; `ITenantRepository.ts` keeps the `I`-prefixed PascalCase name CLAUDE.md and the task both use explicitly for interfaces.
- Tests are colocated (`foo.ts` + `foo.test.ts` in the same folder), matching the existing `apps/bff/src/domain/errors/domain-error.test.ts` / `app.test.ts` precedent — **except** the repository integration test, whose path (`.../repositories/__tests__/tenant.repository.test.ts`) is explicitly specified by the task.
- Running the full test suite from now on requires a local Docker daemon (for the testcontainers-based repository test) — already a stated project requirement (CLAUDE.md: "Testes | Vitest + testcontainers"), just newly exercised.

---

## File Structure

```
apps/bff/
  drizzle.config.ts                                                    [new]
  package.json                                                          [modify]
  .env.example                                                          [modify]
  scripts/
    seed.ts                                                             [new]
  src/
    shared/
      env.ts                                                            [modify]
    domain/
      entities/
        tenant.ts                                                       [new]
        tenant.test.ts                                                  [new]
      interfaces/
        ITenantRepository.ts                                            [new]
    infrastructure/
      db/
        index.ts                                                        [new]
        schema/
          tenants.ts                                                    [new]
          index.ts                                                      [new]
        migrations/                                                     [generated]
        repositories/
          tenant.repository.ts                                         [new]
          __tests__/
            tenant.repository.test.ts                                  [new]
      http/
        proxy.ts                                                        [modify]
        proxy.test.ts                                                   [new]
packages/fastify-plugins/
  src/
    tenant-auth.ts                                                      [modify]
    tenant-auth.test.ts                                                 [modify]
```

---

### Task 1: BFF env validation + Drizzle Kit config

**Files:**
- Modify: `apps/bff/src/shared/env.ts`
- Modify: `apps/bff/.env.example`
- Modify: `apps/bff/package.json`
- Create: `apps/bff/drizzle.config.ts`

**Interfaces:**
- Produces: `env.DATABASE_URL: string` (from `apps/bff/src/shared/env.ts`), used by Task 3's `db/index.ts` and by Task 7's seed script.

- [ ] **Step 1: Add `DATABASE_URL` to env validation, loading the root `.env` regardless of cwd**

Replace the contents of `apps/bff/src/shared/env.ts`:

```typescript
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
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 2: Add `DATABASE_URL` to the BFF's `.env.example`**

Append to `apps/bff/.env.example`:

```bash
PORT=3004
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/clube?schema=tenants
```

- [ ] **Step 3: Add the new dependencies to `apps/bff/package.json`**

```json
{
  "name": "@clube/bff",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/db-client": "*",
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.33.0",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testcontainers/postgresql": "^12.0.4",
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

(The `seed` script is added in Task 7, next to the file it runs.)

- [ ] **Step 4: Create `apps/bff/drizzle.config.ts`**

```typescript
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['tenants'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: lockfile updates, no errors; `node_modules/@clube/db-client` symlinked into `apps/bff/node_modules/@clube`.

- [ ] **Step 6: Verify the existing BFF test suite and typecheck still pass**

Run: `npm run test --workspace=apps/bff && npm run typecheck --workspace=apps/bff`
Expected: `app.test.ts` and `domain-error.test.ts` still PASS (env.ts now requires `DATABASE_URL`, which resolves from the root `.env`); typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add apps/bff/src/shared/env.ts apps/bff/.env.example apps/bff/package.json apps/bff/drizzle.config.ts package-lock.json
git commit -m "feat(bff): add DATABASE_URL env validation and drizzle-kit config"
```

---

### Task 2: Tenant domain entity + repository interface

**Files:**
- Create: `apps/bff/src/domain/entities/tenant.ts`
- Test: `apps/bff/src/domain/entities/tenant.test.ts`
- Create: `apps/bff/src/domain/interfaces/ITenantRepository.ts`

**Interfaces:**
- Produces: `Tenant` class (`domain/entities/tenant.ts`) with props `{ id, slug, name, logoUrl, planId, status: TenantStatus, ownerUid, settings, createdAt }` and a static `Tenant.create(props)`. `ITenantRepository` with `findBySlug(slug): Promise<Tenant | null>`, `findByDomain(domain): Promise<Tenant | null>`, `create(data: CreateTenantDto): Promise<Tenant>`. Consumed by Task 4's `TenantRepository` and Task 6's `proxy.ts`.

- [ ] **Step 1: Write the failing entity test**

Create `apps/bff/src/domain/entities/tenant.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { Tenant } from './tenant'

describe('Tenant', () => {
  it('exposes all props through getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const tenant = Tenant.create({
      id: 'tenant-1',
      slug: 'dev',
      name: 'Dev Tenant',
      logoUrl: null,
      planId: null,
      status: 'active',
      ownerUid: 'owner-1',
      settings: { theme: 'default' },
      createdAt,
    })

    expect(tenant.id).toBe('tenant-1')
    expect(tenant.slug).toBe('dev')
    expect(tenant.name).toBe('Dev Tenant')
    expect(tenant.logoUrl).toBeNull()
    expect(tenant.planId).toBeNull()
    expect(tenant.status).toBe('active')
    expect(tenant.ownerUid).toBe('owner-1')
    expect(tenant.settings).toEqual({ theme: 'default' })
    expect(tenant.createdAt).toBe(createdAt)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/bff -- tenant.test.ts`
Expected: FAIL — `Cannot find module './tenant'`

- [ ] **Step 3: Implement the entity**

Create `apps/bff/src/domain/entities/tenant.ts`:

```typescript
export type TenantStatus = 'active' | 'suspended' | 'canceled'

export type TenantProps = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  planId: string | null
  status: TenantStatus
  ownerUid: string
  settings: Record<string, unknown>
  createdAt: Date
}

export class Tenant {
  private constructor(private readonly props: TenantProps) {}

  static create(props: TenantProps): Tenant {
    return new Tenant(props)
  }

  get id(): string {
    return this.props.id
  }

  get slug(): string {
    return this.props.slug
  }

  get name(): string {
    return this.props.name
  }

  get logoUrl(): string | null {
    return this.props.logoUrl
  }

  get planId(): string | null {
    return this.props.planId
  }

  get status(): TenantStatus {
    return this.props.status
  }

  get ownerUid(): string {
    return this.props.ownerUid
  }

  get settings(): Record<string, unknown> {
    return this.props.settings
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- tenant.test.ts`
Expected: PASS

- [ ] **Step 5: Create the repository interface**

Create `apps/bff/src/domain/interfaces/ITenantRepository.ts`:

```typescript
import type { Tenant } from '../entities/tenant'

export type CreateTenantDto = {
  slug: string
  name: string
  ownerUid: string
  logoUrl?: string | null
  planId?: string | null
  settings?: Record<string, unknown>
}

export interface ITenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>
  findByDomain(domain: string): Promise<Tenant | null>
  create(data: CreateTenantDto): Promise<Tenant>
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck --workspace=apps/bff`
Expected: clean (interface file has no runtime behavior to test, only used by later tasks)

- [ ] **Step 7: Commit**

```bash
git add apps/bff/src/domain
git commit -m "feat(bff): add Tenant entity and ITenantRepository interface"
```

---

### Task 3: Tenants Drizzle schema, DB client, and initial migration

**Files:**
- Create: `apps/bff/src/infrastructure/db/schema/tenants.ts`
- Create: `apps/bff/src/infrastructure/db/schema/index.ts`
- Create: `apps/bff/src/infrastructure/db/index.ts`
- Generated: `apps/bff/src/infrastructure/db/migrations/*` (via `drizzle-kit generate`, then hand-edited for RLS)

**Interfaces:**
- Produces: `schema = { tenants, domains, landingConfigs }` (`infrastructure/db/schema/index.ts`), `db: NodePgDatabase<typeof schema>` (`infrastructure/db/index.ts`). Consumed by Task 4's `TenantRepository` and Task 7's seed script.

- [ ] **Step 1: Write the schema**

Create `apps/bff/src/infrastructure/db/schema/tenants.ts`:

```typescript
import { sql } from 'drizzle-orm'
import {
  boolean,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const tenantsSchema = pgSchema('tenants')

export const tenantStatusEnum = tenantsSchema.enum('tenant_status', [
  'active',
  'suspended',
  'canceled',
])

export const domainTypeEnum = tenantsSchema.enum('domain_type', [
  'subdomain',
  'custom',
])

export const templateIdEnum = tenantsSchema.enum('template_id', [
  'clube-simples',
  'clube-premium',
])

export const tenants = tenantsSchema.table(
  'tenants',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
    planId: uuid('plan_id'),
    status: tenantStatusEnum('status').notNull().default('active'),
    ownerUid: text('owner_uid').notNull(),
    settings: jsonb('settings')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    slugIdx: uniqueIndex('tenants_slug_idx').on(table.slug),
  }),
)

export const domains = tenantsSchema.table(
  'domains',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    domain: text('domain').notNull(),
    type: domainTypeEnum('type').notNull(),
    verified: boolean('verified').notNull().default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    domainIdx: uniqueIndex('domains_domain_idx').on(table.domain),
  }),
)

export const landingConfigs = tenantsSchema.table('landing_configs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  templateId: templateIdEnum('template_id').notNull(),
  theme: jsonb('theme').$type<Record<string, unknown>>().notNull(),
  sections: jsonb('sections').$type<Record<string, unknown>>().notNull(),
  seo: jsonb('seo').$type<Record<string, unknown>>().notNull(),
  published: boolean('published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
```

Create `apps/bff/src/infrastructure/db/schema/index.ts`:

```typescript
import { domains, landingConfigs, tenants } from './tenants'

export const schema = {
  tenants,
  domains,
  landingConfigs,
}
```

- [ ] **Step 2: Create the DB client**

Create `apps/bff/src/infrastructure/db/index.ts`:

```typescript
import { createDbClient } from '@clube/db-client'
import { env } from '../../shared/env'
import { schema } from './schema'

export const db = createDbClient(schema, env.DATABASE_URL)
```

- [ ] **Step 3: Typecheck the new schema files**

Run: `npm run typecheck --workspace=apps/bff`
Expected: clean

- [ ] **Step 4: Generate the initial migration**

Run: `cd apps/bff && npx drizzle-kit generate && cd ../..`
Expected: creates `apps/bff/src/infrastructure/db/migrations/0000_<name>.sql` plus a `meta/` folder with `_journal.json` and a snapshot. Run `ls apps/bff/src/infrastructure/db/migrations/*.sql` to get the exact generated filename for the next step.

- [ ] **Step 5: Append Row-Level Security to the generated migration**

Open the generated `.sql` file from Step 4 and append at the end (keep the `--> statement-breakpoint` separators — that's drizzle-kit's marker for splitting statements when the programmatic migrator runs them):

```sql
--> statement-breakpoint
-- current_setting uses missing_ok=true: nothing in this codebase sets
-- app.tenant_id yet (that's a future per-request transaction-scoping task),
-- so the strict 1-arg form would hard-error on every query. The superuser
-- connection (`postgres`) bypasses RLS regardless; this only matters once a
-- non-superuser app role exists, and then it fails closed (0 rows) instead
-- of erroring.
ALTER TABLE "tenants"."domains" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants"."domains"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--> statement-breakpoint
ALTER TABLE "tenants"."landing_configs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants"."landing_configs"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

- [ ] **Step 6: Apply the migration to the remote dev database**

Run: `cd apps/bff && npx drizzle-kit migrate && cd ../..`
Expected: no errors; drizzle-kit reports the migration applied.

- [ ] **Step 7: Verify the tables exist**

Run:
```bash
node -e "
const { Client } = require('pg');
require('dotenv').config();
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(\"select table_name from information_schema.tables where table_schema = 'tenants' order by table_name\");
  console.log(res.rows);
  await client.end();
})();
"
```
Expected: `[{ table_name: 'domains' }, { table_name: 'landing_configs' }, { table_name: 'tenants' }]`

- [ ] **Step 8: Commit**

```bash
git add apps/bff/src/infrastructure/db
git commit -m "feat(bff): add tenants Drizzle schema, DB client, and initial migration"
```

---

### Task 4: TenantRepository implementation + integration test

**Files:**
- Create: `apps/bff/src/infrastructure/db/repositories/tenant.repository.ts`
- Test: `apps/bff/src/infrastructure/db/repositories/__tests__/tenant.repository.test.ts`

**Interfaces:**
- Consumes: `Tenant.create(props)` (Task 2), `ITenantRepository`/`CreateTenantDto` (Task 2), `schema`/`tenants`/`domains` (Task 3), `createDbClient` (`@clube/db-client`).
- Produces: `TenantRepository` class implementing `ITenantRepository`, constructor `(db: NodePgDatabase<typeof schema>)`. Consumed by Task 6's `proxy.ts` and Task 7's seed (indirectly, via `db`).

**Prerequisite:** Docker daemon running locally (testcontainers pulls and starts a `postgres:16-alpine` container). Verify with `docker info` before starting — Docker Desktop was launched (`open -a Docker`) during planning; confirm it's actually up before running the test.

- [ ] **Step 1: Write the failing integration test**

Create `apps/bff/src/infrastructure/db/repositories/__tests__/tenant.repository.test.ts`:

```typescript
import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../schema'
import { domains } from '../../schema/tenants'
import { TenantRepository } from '../tenant.repository'

describe('TenantRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: TenantRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new TenantRepository(db)
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a tenant and finds it by slug', async () => {
    const created = await repository.create({
      slug: 'dev',
      name: 'Dev Tenant',
      ownerUid: 'owner-uid-1',
    })

    const found = await repository.findBySlug('dev')

    expect(found?.id).toBe(created.id)
    expect(found?.slug).toBe('dev')
    expect(found?.status).toBe('active')
  })

  it('returns null when the slug does not exist', async () => {
    const found = await repository.findBySlug('does-not-exist')
    expect(found).toBeNull()
  })

  it('finds a tenant through a linked custom domain', async () => {
    const created = await repository.create({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-uid-2',
    })

    await db.insert(domains).values({
      tenantId: created.id,
      domain: 'acme.com.br',
      type: 'custom',
    })

    const found = await repository.findByDomain('acme.com.br')

    expect(found?.id).toBe(created.id)
  })

  it('returns null when the domain is not linked to any tenant', async () => {
    const found = await repository.findByDomain('unknown.com.br')
    expect(found).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/bff -- tenant.repository.test.ts`
Expected: FAIL — `Cannot find module '../tenant.repository'`

- [ ] **Step 3: Implement the repository**

Create `apps/bff/src/infrastructure/db/repositories/tenant.repository.ts`:

```typescript
import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Tenant } from '../../../domain/entities/tenant'
import type {
  CreateTenantDto,
  ITenantRepository,
} from '../../../domain/interfaces/ITenantRepository'
import type { schema } from '../schema'
import { domains, tenants } from '../schema/tenants'

type TenantRow = typeof tenants.$inferSelect

function toDomain(row: TenantRow): Tenant {
  return Tenant.create({
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    planId: row.planId,
    status: row.status,
    ownerUid: row.ownerUid,
    settings: row.settings,
    createdAt: row.createdAt,
  })
}

export class TenantRepository implements ITenantRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select({ tenant: tenants })
      .from(domains)
      .innerJoin(tenants, eq(domains.tenantId, tenants.id))
      .where(eq(domains.domain, domain))
      .limit(1)

    return row ? toDomain(row.tenant) : null
  }

  async create(data: CreateTenantDto): Promise<Tenant> {
    const [row] = await this.db
      .insert(tenants)
      .values({
        slug: data.slug,
        name: data.name,
        ownerUid: data.ownerUid,
        logoUrl: data.logoUrl ?? null,
        planId: data.planId ?? null,
        settings: data.settings ?? {},
      })
      .returning()

    return toDomain(row as TenantRow)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- tenant.repository.test.ts`
Expected: PASS (first run may take longer while Docker pulls `postgres:16-alpine`)

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/infrastructure/db/repositories
git commit -m "feat(bff): implement TenantRepository with testcontainers integration test"
```

---

### Task 5: `x-tenant-slug` header support in `@clube/fastify-plugins`

**Files:**
- Modify: `packages/fastify-plugins/src/tenant-auth.ts`
- Modify: `packages/fastify-plugins/src/tenant-auth.test.ts`

**Interfaces:**
- Modifies: `createTenantAuthPreHandler(resolveTenant: ResolveTenant)` — the `domain` string passed to `resolveTenant` now comes from the `x-tenant-slug` header when present, falling back to the host-derived domain otherwise. `ResolveTenant`'s signature is unchanged (`(domain: string) => Promise<Tenant | null>`), so this is non-breaking for every existing caller (BFF and all six services' `proxy.ts` stubs).

- [ ] **Step 1: Write the failing test**

Add to `packages/fastify-plugins/src/tenant-auth.test.ts`, inside the existing `describe('createTenantAuthPreHandler', ...)` block (after the last `it`, before the closing `})`):

```typescript
  it('prefers the x-tenant-slug header over the host domain', async () => {
    const resolveTenant = vi.fn().mockResolvedValue({ id: '1', slug: 'dev' })
    const preHandler = createTenantAuthPreHandler(resolveTenant)
    const request = {
      headers: { host: 'localhost:3004', 'x-tenant-slug': 'dev' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(resolveTenant).toHaveBeenCalledWith('dev')
    expect(request.tenant).toEqual({ id: '1', slug: 'dev' })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=packages/fastify-plugins -- tenant-auth.test.ts`
Expected: FAIL — `resolveTenant` was called with `'localhost'` (the host-derived domain), not `'dev'`.

- [ ] **Step 3: Implement the header precedence**

In `packages/fastify-plugins/src/tenant-auth.ts`, replace the `host`/`domain` derivation inside `tenantAuthPreHandler`:

```typescript
export function createTenantAuthPreHandler(resolveTenant: ResolveTenant) {
  return async function tenantAuthPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const slugHeader = request.headers['x-tenant-slug']
    const host = request.headers.host ?? ''
    const domain =
      typeof slugHeader === 'string' && slugHeader.length > 0
        ? slugHeader
        : host.replace('www.', '').split(':')[0]

    const tenant = await resolveTenant(domain)
    if (!tenant) {
      reply.status(404).send({
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
      })
      return
    }
    request.tenant = tenant

    const token = request.headers.authorization?.split('Bearer ')[1]
    if (token) {
      const decoded = await getAuth().verifyIdToken(token)
      request.user = {
        uid: decoded.uid,
        role: (decoded.role as Role) ?? 'user',
        tenant_id: (decoded.tenant_id as string) ?? null,
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=packages/fastify-plugins -- tenant-auth.test.ts`
Expected: PASS — all 4 tests (the 3 existing + the new one) pass.

- [ ] **Step 5: Commit**

```bash
git add packages/fastify-plugins/src/tenant-auth.ts packages/fastify-plugins/src/tenant-auth.test.ts
git commit -m "feat(fastify-plugins): let x-tenant-slug header override host-based tenant resolution"
```

---

### Task 6: Wire the real TenantRepository into BFF's proxy.ts

**Files:**
- Modify: `apps/bff/src/infrastructure/http/proxy.ts`
- Test: `apps/bff/src/infrastructure/http/proxy.test.ts`

**Interfaces:**
- Consumes: `ITenantRepository` (Task 2), `TenantRepository` (Task 4), `db` (Task 3), `Tenant` entity (Task 2), `createTenantAuthPreHandler` (Task 5's updated version, non-breaking).
- Produces: `createResolveTenant(repository: ITenantRepository)` (exported, pure, testable without a DB), `tenantAuthPreHandler` (unchanged export name/shape, now backed by the real repository).

- [ ] **Step 1: Write the failing tests**

Create `apps/bff/src/infrastructure/http/proxy.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { createResolveTenant } from './proxy'

function fakeTenant(id: string, slug: string): Tenant {
  return Tenant.create({
    id,
    slug,
    name: 'Fake Tenant',
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

function fakeRepository(overrides: Partial<ITenantRepository> = {}) {
  return {
    findBySlug: vi.fn().mockResolvedValue(null),
    findByDomain: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    ...overrides,
  } as ITenantRepository
}

describe('createResolveTenant', () => {
  it('resolves by bare slug (x-tenant-slug header case)', async () => {
    const repository = fakeRepository({
      findBySlug: vi.fn().mockResolvedValue(fakeTenant('tenant-1', 'dev')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('dev')

    expect(tenant).toEqual({ id: 'tenant-1', slug: 'dev' })
    expect(repository.findBySlug).toHaveBeenCalledWith('dev')
  })

  it('resolves by subdomain host, stripping the platform suffix', async () => {
    const repository = fakeRepository({
      findBySlug: vi.fn().mockResolvedValue(fakeTenant('tenant-1', 'acme')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('acme.clube.com.br')

    expect(tenant).toEqual({ id: 'tenant-1', slug: 'acme' })
    expect(repository.findBySlug).toHaveBeenCalledWith('acme')
  })

  it('falls back to a custom domain lookup when no slug matches', async () => {
    const repository = fakeRepository({
      findByDomain: vi.fn().mockResolvedValue(fakeTenant('tenant-1', 'acme')),
    })
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('www.acme.com.br')

    expect(tenant).toEqual({ id: 'tenant-1', slug: 'acme' })
    expect(repository.findByDomain).toHaveBeenCalledWith('www.acme.com.br')
  })

  it('returns null when nothing matches', async () => {
    const repository = fakeRepository()
    const resolveTenant = createResolveTenant(repository)

    const tenant = await resolveTenant('unknown.com.br')

    expect(tenant).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/bff -- proxy.test.ts`
Expected: FAIL — `createResolveTenant` is not exported from `./proxy`.

- [ ] **Step 3: Implement the real wiring**

Replace `apps/bff/src/infrastructure/http/proxy.ts`:

```typescript
import {
  type Tenant,
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from '@clube/fastify-plugins'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { db } from '../db'
import { TenantRepository } from '../db/repositories/tenant.repository'

export function createResolveTenant(repository: ITenantRepository) {
  return async function resolveTenant(domain: string): Promise<Tenant | null> {
    const slug = domain.endsWith('.clube.com.br')
      ? domain.replace('.clube.com.br', '')
      : domain

    const tenant =
      (await repository.findBySlug(slug)) ??
      (await repository.findByDomain(domain))

    return tenant ? { id: tenant.id, slug: tenant.slug } : null
  }
}

const tenantRepository = new TenantRepository(db)

export const tenantAuthPreHandler = createTenantAuthPreHandler(
  createResolveTenant(tenantRepository),
)

export {
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- proxy.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Run the full BFF suite and typecheck**

Run: `npm run test --workspace=apps/bff && npm run typecheck --workspace=apps/bff`
Expected: all PASS (`app.test.ts`, `domain-error.test.ts`, `tenant.test.ts`, `tenant.repository.test.ts`, `proxy.test.ts`)

- [ ] **Step 6: Commit**

```bash
git add apps/bff/src/infrastructure/http/proxy.ts apps/bff/src/infrastructure/http/proxy.test.ts
git commit -m "feat(bff): wire real TenantRepository into proxy.ts tenant resolution"
```

---

### Task 7: Seed script for the dev tenant

**Files:**
- Create: `apps/bff/scripts/seed.ts`
- Modify: `apps/bff/package.json`

**Interfaces:**
- Consumes: `db` (Task 3), `tenants` table (Task 3).

- [ ] **Step 1: Add the `seed` script to `apps/bff/package.json`**

In the `"scripts"` block (added alongside the existing ones from Task 1):

```json
    "test": "vitest run",
    "seed": "tsx scripts/seed.ts"
```

- [ ] **Step 2: Write the seed script**

Create `apps/bff/scripts/seed.ts`:

```typescript
import { db } from '../src/infrastructure/db'
import { tenants } from '../src/infrastructure/db/schema/tenants'

const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001'

async function seed(): Promise<void> {
  await db
    .insert(tenants)
    .values({
      id: DEV_TENANT_ID,
      slug: 'dev',
      name: 'Dev Tenant',
      ownerUid: 'dev-owner',
      status: 'active',
      settings: {},
    })
    .onConflictDoUpdate({
      target: tenants.id,
      set: { slug: 'dev', name: 'Dev Tenant' },
    })

  console.log(`Seed concluído: tenant dev (${DEV_TENANT_ID}) pronto.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed falhou:', error)
    process.exit(1)
  })
```

- [ ] **Step 3: Run the seed against the configured `DATABASE_URL`**

Run: `npm run seed --workspace=apps/bff`
Expected: prints `Seed concluído: tenant dev (00000000-0000-0000-0000-000000000001) pronto.` and exits 0.

- [ ] **Step 4: Verify idempotency — run it again**

Run: `npm run seed --workspace=apps/bff`
Expected: same success output, no unique-constraint error (the `onConflictDoUpdate` makes re-running safe).

- [ ] **Step 5: Verify the row via the repository test pattern (manual check)**

Run:
```bash
node -e "
require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(\"select id, slug, name, status from tenants.tenants where slug = 'dev'\");
  console.log(res.rows);
  await client.end();
})();
"
```
Expected: one row — `{ id: '00000000-0000-0000-0000-000000000001', slug: 'dev', name: 'Dev Tenant', status: 'active' }`

- [ ] **Step 6: Commit**

```bash
git add apps/bff/scripts apps/bff/package.json
git commit -m "feat(bff): add seed script for the dev tenant"
```

---

### Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full build, typecheck, test, lint across touched workspaces**

Run:
```bash
npm run build --workspace=apps/bff --workspace=packages/fastify-plugins --workspace=@clube/db-client
npm run typecheck
npm run test
npm run lint
```
Expected: all green. (`npm run typecheck`/`test`/`lint` run across all 18 workspaces per the root scripts — confirms this change didn't break anything elsewhere, e.g. the other 6 services' `proxy.ts` stubs still compile against the updated `ResolveTenant` contract from Task 5, which is unchanged in shape.)

- [ ] **Step 2: Boot the BFF dev server and check `/health` and `/docs`**

Run: `npm run dev --workspace=apps/bff` (background/separate terminal)
Then:
```bash
curl -s http://localhost:3004/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3004/docs
```
Expected: `{"status":"ok"}` and `200`. Confirms `npm run dev` boots without error even though `env.ts` now requires `DATABASE_URL` (loaded from the root `.env`) and `proxy.ts` eagerly constructs a `Pool` (lazy — no live connection needed to boot).

- [ ] **Step 3: Stop the dev server**

Stop the process started in Step 2.

- [ ] **Step 4: Confirm `verify:infra` still passes**

Run: `npm run verify:infra`
Expected: `Postgres: OK` / `Redis: OK` (unchanged — this plan didn't touch connection config, just confirms nothing regressed).

No commit for this task — it's verification only, nothing changes.

---

## Self-Review Notes

- **Spec coverage:** Task list covers the task's 11 steps 1–11, adjusted for the two user decisions (no docker-compose, no subscriptions seed) — step 1 (docker-compose) is explicitly out per decision; steps 2–8 map to Tasks 1, 3, 4, 2/6, 7 (RLS is a CLAUDE.md-mandated addition to step 3, not in the original numbered list, called out in Global Constraints); step 9 (RLS-adjacent, not separately numbered) folded into Task 3; step 10 is Task 7 Step 1; step 11 is Task 4.
- **Type consistency checked:** `ITenantRepository` (Task 2) → implemented by `TenantRepository` (Task 4) → consumed by `createResolveTenant` (Task 6) — method names (`findBySlug`, `findByDomain`, `create`) and the `CreateTenantDto` shape match across all three.
- **No placeholders:** every step has real, complete code — confirmed on final pass.
