# Fase 0 — Fundação do Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o esqueleto completo e rodável do monorepo "Clube de Vendas com Assinaturas" — 4 apps Next.js + BFF + 6 services Fastify + 6 packages compartilhados — sem lógica de negócio, mas com health checks, testes de fumaça e build funcionando ponta a ponta.

**Architecture:** npm workspaces + Turborepo. 6 packages compartilhados compilados para `dist/` (consumidos via `main`/`types`). BFF e 6 services Fastify seguem Clean Architecture (`domain/application/infrastructure`) e reutilizam plugins/guards centralizados em `@clube/fastify-plugins`. 4 apps Next.js 14 App Router com `output: 'standalone'`.

**Tech Stack:** Node 20, TypeScript 5 strict, Fastify 5, Next.js 14, Drizzle ORM, Biome, Vitest + Testing Library, Firebase Admin SDK, Postgres 16 + Redis remotos (já provisionados).

## Global Constraints

- Node 20 LTS; TypeScript 5.x com `strict: true` em todo `tsconfig.json`.
- npm workspaces (`apps/*`, `services/*`, `packages/*`) orquestrado por Turborepo.
- Biome substitui ESLint/Prettier — um único `biome.json` na raiz cobre o monorepo inteiro.
- Nomenclatura do CLAUDE.md: arquivos kebab-case, classes PascalCase, funções/vars camelCase.
- Todo package em `packages/*` compila para `dist/` via `tsc` (script `build`) e expõe `main`/`types` apontando pra `dist`, nunca pra `src`. Isso evita o erro `TS6059 (File is not under 'rootDir')` quando outro workspace importa o pacote. `turbo.json` declara `build`, `typecheck` e `test` com `dependsOn: ["^build"]`, garantindo que dependências compilem primeiro.
- Qualquer app/service que importa um `@clube/*` package precisa desse package já buildado (rodar `npm run build` nele) antes de rodar seu próprio `dev`/`typecheck`/`test`.
- Postgres e Redis são instâncias remotas já provisionadas (não sobem via docker-compose). Credenciais reais ficam só em `.env` na raiz (já criado, gitignorado). `.env.example` sempre com valores fictícios — nunca commitar `.env`.
- Nesta fase, o `env.ts` de cada serviço/BFF valida **só `PORT` e `NODE_ENV`**. As demais variáveis do CLAUDE.md (Firebase, Asaas, Melhor Envio, Storage, `DATABASE_URL`, `REDIS_URL`) entram na validação de cada serviço quando a fase que efetivamente as consome for implementada — validá-las agora quebraria o boot em Fase 0, já que nenhuma está configurada de verdade ainda.
- O CLAUDE.md nomeia o middleware de resolução de tenant como `proxy.ts`, mas o Next.js só reconhece automaticamente um arquivo chamado `middleware.ts` na raiz de `src/`. Mantemos a lógica exatamente como descrita, só corrigindo o nome do arquivo para o middleware funcionar de verdade.
- Guards de RBAC (`requireSuperAdmin`, `requireOwner`, `requireManager`, `requireSubscriber`, `requireAuth`) e a lógica de tenant/JWT (`createTenantAuthPreHandler`) ficam centralizados em `@clube/fastify-plugins`, não duplicados em cada serviço — leitura DRY do "padrão obrigatório" do CLAUDE.md, que mostra esse código uma única vez. Cada `infrastructure/http/proxy.ts` de serviço só importa de lá e define seu `resolveTenant` local.
- `DomainError` continua definida localmente em cada serviço (`domain/errors/domain-error.ts`), como no CLAUDE.md — não vira pacote compartilhado.
- Pastas do CLAUDE.md que não recebem nenhum arquivo nesta fase (`domain/entities`, `domain/value-objects`, `domain/interfaces`, `application/`, `infrastructure/db/repositories`, `infrastructure/db/migrations`, `infrastructure/http/routes`, `infrastructure/http/schemas`, `infrastructure/queue`, `infrastructure/external`, `shared/logger`, `shared/types`, `shared/errors`) só são criadas quando uma fase futura colocar conteúdo real nelas — sem diretórios vazios com `.gitkeep`.
- Toda alteração é commitada ao final de cada task com mensagens curtas em inglês, seguindo o padrão já usado no primeiro commit do repo.

---

## Tabela de referência — portas e schemas

| Workspace | Porta | Schema Postgres |
|---|---|---|
| apps/landing | 3000 | — |
| apps/pwa | 3001 | — |
| apps/admin | 3002 | — |
| apps/super-admin | 3003 | — |
| apps/bff | 3004 | — |
| services/subscriptions | 3005 | subscriptions |
| services/store | 3006 | store |
| services/cashback | 3007 | cashback |
| services/raffles | 3008 | raffles |
| services/tournaments | 3009 | tournaments |
| services/community | 3010 | community |

---

### Task 1: Ferramental raiz do monorepo

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `.env.example`
- Create: `scripts/verify-infra.mjs`
- Modify: `.gitignore` (já existe — conferir que cobre `node_modules`, `.env`, `.next`, `dist`, `.turbo`)

**Interfaces:**
- Produces: `tsconfig.base.json` (estendido por todo workspace), scripts raiz `dev`/`build`/`lint`/`typecheck`/`test`/`verify:infra`.

- [ ] **Step 1: Criar `package.json` raiz**

```json
{
  "name": "clube",
  "private": true,
  "engines": {
    "node": ">=20"
  },
  "workspaces": [
    "apps/*",
    "services/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "verify:infra": "node scripts/verify-infra.mjs"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "dotenv": "^16.4.5",
    "pg": "^8.12.0",
    "redis": "^4.7.0",
    "turbo": "^2.1.3",
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 2: Criar `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

- [ ] **Step 3: Criar `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 4: Criar `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "files": {
    "ignore": ["node_modules", "dist", ".next", ".turbo"]
  }
}
```

- [ ] **Step 5: Criar `.env.example` raiz**

```bash
# Banco (Postgres 16 — instância remota já provisionada)
DATABASE_URL=postgresql://user:pass@localhost:5432/clube

# Redis
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=

# Asaas
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_ENV=sandbox

# Melhor Envio
MELHOR_ENVIO_TOKEN=
MELHOR_ENVIO_ENV=sandbox

# Storage
STORAGE_BUCKET=
STORAGE_URL=

# App
PORT=3004
NODE_ENV=development

# Next.js (PWA/Admin)
NEXT_PUBLIC_BFF_URL=http://localhost:3004
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXTAUTH_SECRET=
```

- [ ] **Step 6: Criar `scripts/verify-infra.mjs`**

```javascript
import 'dotenv/config'
import { Client } from 'pg'
import { createClient } from 'redis'

async function verifyPostgres() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  await client.query('SELECT 1')
  await client.end()
  console.log('Postgres: OK')
}

async function verifyRedis() {
  const client = createClient({ url: process.env.REDIS_URL })
  await client.connect()
  await client.ping()
  await client.quit()
  console.log('Redis: OK')
}

async function main() {
  await verifyPostgres()
  await verifyRedis()
}

main().catch((error) => {
  console.error('Infra verification failed:', error)
  process.exit(1)
})
```

- [ ] **Step 7: Instalar dependências raiz**

Run: `npm install`
Expected: instala sem erro (ainda não há workspaces filhos).

- [ ] **Step 8: Rodar verificação de infraestrutura**

Run: `npm run verify:infra`
Expected: imprime `Postgres: OK` e `Redis: OK`. Se falhar, pare e confira o `.env` antes de continuar — todo o resto do plano depende dessas credenciais estarem certas.

- [ ] **Step 9: Conferir `.gitignore`**

Confirme que `/Users/edsonmallet/Documents/Projects/estudos/soupescador/.gitignore` contém `node_modules/`, `.env`, `.next/`, `dist/`, `.turbo/` (já deve conter, criado antes deste plano). Se faltar algo, adicione.

- [ ] **Step 10: Commit**

```bash
git add package.json turbo.json tsconfig.base.json biome.json .env.example scripts/verify-infra.mjs package-lock.json
git commit -m "chore: set up root tooling (npm workspaces, turborepo, biome)"
```

---

### Task 2: `packages/shared-types`

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces: `Role` (union type), `CustomClaims` (`{ role: Role; tenant_id: string | null }`), `Tenant` (`{ id: string; slug: string; name: string; customDomain: string | null; createdAt: string }`). Todos exportados de `@clube/shared-types`.

- [ ] **Step 1: Criar `packages/shared-types/package.json`**

```json
{
  "name": "@clube/shared-types",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 2: Criar `packages/shared-types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `packages/shared-types/src/index.ts`**

```typescript
export type Role =
  | 'super_admin'
  | 'store_owner'
  | 'store_manager'
  | 'community_mod'
  | 'subscriber'
  | 'user'

export type CustomClaims = {
  role: Role
  tenant_id: string | null
}

export type Tenant = {
  id: string
  slug: string
  name: string
  customDomain: string | null
  createdAt: string
}
```

- [ ] **Step 4: Instalar e buildar**

Run: `npm install && npm run build --workspace=@clube/shared-types`
Expected: gera `packages/shared-types/dist/index.js` e `dist/index.d.ts` sem erro.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck --workspace=@clube/shared-types`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add packages/shared-types package-lock.json
git commit -m "feat: add shared-types package (Role, CustomClaims, Tenant)"
```

---

### Task 3: `packages/db-client`

**Files:**
- Create: `packages/db-client/package.json`
- Create: `packages/db-client/tsconfig.json`
- Create: `packages/db-client/src/index.ts`
- Create: `packages/db-client/src/index.test.ts`
- Create: `packages/db-client/vitest.config.ts`

**Interfaces:**
- Consumes: nada de outros workspace packages.
- Produces: `createDbClient<TSchema>(schema: TSchema, connectionString: string): NodePgDatabase<TSchema>` exportado de `@clube/db-client`.

- [ ] **Step 1: Criar `packages/db-client/package.json`**

```json
{
  "name": "@clube/db-client",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "drizzle-orm": "^0.33.0",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.6",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `packages/db-client/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `packages/db-client/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Escrever teste (vai falhar — `createDbClient` ainda não existe)**

Create `packages/db-client/src/index.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { createDbClient } from './index'

describe('createDbClient', () => {
  it('creates a drizzle client without connecting eagerly', () => {
    const db = createDbClient({}, 'postgres://user:pass@localhost:5432/db')
    expect(db).toBeDefined()
  })
})
```

- [ ] **Step 5: Rodar teste e confirmar falha**

Run: `npm install && npx vitest run --root packages/db-client`
Expected: FAIL — `Cannot find module './index'` ou `createDbClient is not exported`.

- [ ] **Step 6: Implementar `packages/db-client/src/index.ts`**

```typescript
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export function createDbClient<TSchema extends Record<string, unknown>>(
  schema: TSchema,
  connectionString: string,
): NodePgDatabase<TSchema> {
  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}
```

- [ ] **Step 7: Rodar teste e confirmar sucesso**

Run: `npx vitest run --root packages/db-client`
Expected: PASS (1 teste).

- [ ] **Step 8: Build e typecheck**

Run: `npm run build --workspace=@clube/db-client && npm run typecheck --workspace=@clube/db-client`
Expected: sem erro.

- [ ] **Step 9: Commit**

```bash
git add packages/db-client package-lock.json
git commit -m "feat: add db-client package (Drizzle factory configurable by schema)"
```

---

### Task 4: `packages/firebase-utils`

**Files:**
- Create: `packages/firebase-utils/package.json`
- Create: `packages/firebase-utils/tsconfig.json`
- Create: `packages/firebase-utils/src/index.ts`
- Create: `packages/firebase-utils/src/index.test.ts`
- Create: `packages/firebase-utils/vitest.config.ts`

**Interfaces:**
- Consumes: `Role` de `@clube/shared-types` (Task 2).
- Produces: `setRole(uid, role, tenantId?)`, `getRole(uid): Promise<Role>`, `revokeRole(uid)`, re-exporta `Role` — de `@clube/firebase-utils`.

- [ ] **Step 1: Criar `packages/firebase-utils/package.json`**

```json
{
  "name": "@clube/firebase-utils",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/shared-types": "*",
    "firebase-admin": "^12.3.1"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `packages/firebase-utils/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `packages/firebase-utils/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Escrever teste (vai falhar)**

Create `packages/firebase-utils/src/index.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from 'vitest'

describe('firebase-utils bootstrap', () => {
  beforeEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT
  })

  it('throws when FIREBASE_SERVICE_ACCOUNT is missing', async () => {
    const { setRole } = await import('./index')
    await expect(setRole('uid123', 'user')).rejects.toThrow(
      'FIREBASE_SERVICE_ACCOUNT env var is required',
    )
  })
})
```

- [ ] **Step 5: Rodar teste e confirmar falha**

Run: `npm install && npx vitest run --root packages/firebase-utils`
Expected: FAIL — módulo `./index` não existe.

- [ ] **Step 6: Implementar `packages/firebase-utils/src/index.ts`**

```typescript
import type { Role } from '@clube/shared-types'
import { type App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export type { Role }

function getFirebaseApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required')
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'),
  )

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
}

export const setRole = (uid: string, role: Role, tenantId?: string) =>
  getAuth(getFirebaseApp()).setCustomUserClaims(uid, {
    role,
    tenant_id: tenantId ?? null,
  })

export const getRole = async (uid: string): Promise<Role> => {
  const user = await getAuth(getFirebaseApp()).getUser(uid)
  return (user.customClaims?.role as Role) ?? 'user'
}

export const revokeRole = (uid: string) => setRole(uid, 'user')
```

- [ ] **Step 7: Rodar teste e confirmar sucesso**

Run: `npx vitest run --root packages/firebase-utils`
Expected: PASS (1 teste).

- [ ] **Step 8: Build e typecheck**

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/firebase-utils && npm run typecheck --workspace=@clube/firebase-utils`
Expected: sem erro (shared-types precisa estar buildado antes, por causa do `main`/`types` apontando pra `dist`).

- [ ] **Step 9: Commit**

```bash
git add packages/firebase-utils package-lock.json
git commit -m "feat: add firebase-utils package (setRole/getRole/revokeRole)"
```

---

### Task 5: `packages/asaas-sdk`

**Files:**
- Create: `packages/asaas-sdk/package.json`
- Create: `packages/asaas-sdk/tsconfig.json`
- Create: `packages/asaas-sdk/src/index.ts`
- Create: `packages/asaas-sdk/src/index.test.ts`
- Create: `packages/asaas-sdk/vitest.config.ts`

**Interfaces:**
- Produces: `AsaasClient` (classe), `AsaasEnv` (`'sandbox' | 'production'`) — exportados de `@clube/asaas-sdk`. `new AsaasClient(apiKey, env).request<T>(path, init?)`.

- [ ] **Step 1: Criar `packages/asaas-sdk/package.json`**

```json
{
  "name": "@clube/asaas-sdk",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `packages/asaas-sdk/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `packages/asaas-sdk/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Escrever teste (vai falhar)**

Create `packages/asaas-sdk/src/index.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AsaasClient } from './index'

describe('AsaasClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves the sandbox base URL and sends the access_token header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    await client.request('/customers')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers',
      expect.objectContaining({
        headers: expect.objectContaining({ access_token: 'fake-key' }),
      }),
    )
  })

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'production')
    await expect(client.request('/customers')).rejects.toThrow('Asaas API error: 401 Unauthorized')
  })
})
```

- [ ] **Step 5: Rodar teste e confirmar falha**

Run: `npm install && npx vitest run --root packages/asaas-sdk`
Expected: FAIL — módulo `./index` não existe.

- [ ] **Step 6: Implementar `packages/asaas-sdk/src/index.ts`**

```typescript
export type AsaasEnv = 'sandbox' | 'production'

const BASE_URLS: Record<AsaasEnv, string> = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://api.asaas.com/v3',
}

export class AsaasClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(apiKey: string, env: AsaasEnv) {
    this.apiKey = apiKey
    this.baseUrl = BASE_URLS[env]
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
        ...init.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Asaas API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }
}
```

- [ ] **Step 7: Rodar teste e confirmar sucesso**

Run: `npx vitest run --root packages/asaas-sdk`
Expected: PASS (2 testes).

- [ ] **Step 8: Build e typecheck**

Run: `npm run build --workspace=@clube/asaas-sdk && npm run typecheck --workspace=@clube/asaas-sdk`
Expected: sem erro.

- [ ] **Step 9: Commit**

```bash
git add packages/asaas-sdk package-lock.json
git commit -m "feat: add asaas-sdk package (sandbox/production client scaffold)"
```

---

### Task 6: `packages/fastify-plugins`

**Files:**
- Create: `packages/fastify-plugins/package.json`
- Create: `packages/fastify-plugins/tsconfig.json`
- Create: `packages/fastify-plugins/vitest.config.ts`
- Create: `packages/fastify-plugins/src/cors.ts` + `src/cors.test.ts`
- Create: `packages/fastify-plugins/src/health.ts` + `src/health.test.ts`
- Create: `packages/fastify-plugins/src/error-handler.ts` + `src/error-handler.test.ts`
- Create: `packages/fastify-plugins/src/scalar.ts` + `src/scalar.test.ts`
- Create: `packages/fastify-plugins/src/tenant-auth.ts` + `src/tenant-auth.test.ts`
- Create: `packages/fastify-plugins/src/guards.ts` + `src/guards.test.ts`
- Create: `packages/fastify-plugins/src/index.ts`

**Interfaces:**
- Consumes: `Role` de `@clube/shared-types` (Task 2).
- Produces (de `@clube/fastify-plugins`): `registerCors(app)`, `registerHealth(app)`, `registerErrorHandler(app)`, `registerScalar(app, title)`, `createTenantAuthPreHandler(resolveTenant)`, tipos `Tenant`/`ResolveTenant`/`AuthenticatedUser`, guards `requireSuperAdmin`/`requireOwner`/`requireManager`/`requireSubscriber`/`requireAuth`. Todas as funções de registro são `async (app: FastifyInstance) => Promise<void>`.

- [ ] **Step 1: Criar `packages/fastify-plugins/package.json`**

```json
{
  "name": "@clube/fastify-plugins",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/shared-types": "*",
    "@fastify/cors": "^10.0.1",
    "@fastify/swagger": "^9.2.0",
    "@scalar/fastify-api-reference": "^1.25.68",
    "fastify": "^5.0.0",
    "firebase-admin": "^12.3.1"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `packages/fastify-plugins/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `packages/fastify-plugins/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Escrever teste de `cors.ts` (vai falhar)**

Create `packages/fastify-plugins/src/cors.test.ts`:

```typescript
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerCors } from './cors'

describe('registerCors', () => {
  it('sets access-control-allow-origin header', async () => {
    const app = Fastify()
    await registerCors(app)
    app.get('/ping', async () => ({ pong: true }))

    const response = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: 'https://soupescador.clube.com.br' },
    })

    expect(response.headers['access-control-allow-origin']).toBe(
      'https://soupescador.clube.com.br',
    )
  })
})
```

- [ ] **Step 5: Rodar teste e confirmar falha**

Run: `npm install && npx vitest run --root packages/fastify-plugins src/cors.test.ts`
Expected: FAIL — `./cors` não existe.

- [ ] **Step 6: Implementar `packages/fastify-plugins/src/cors.ts`**

```typescript
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, { origin: true })
}
```

- [ ] **Step 7: Rodar teste de `cors.ts` e confirmar sucesso**

Run: `npx vitest run --root packages/fastify-plugins src/cors.test.ts`
Expected: PASS.

- [ ] **Step 8: Escrever teste de `health.ts` (vai falhar)**

Create `packages/fastify-plugins/src/health.test.ts`:

```typescript
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerHealth } from './health'

describe('registerHealth', () => {
  it('responds ok on GET /health', async () => {
    const app = Fastify()
    await registerHealth(app)

    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 9: Rodar teste e confirmar falha, depois implementar `health.ts`**

Run: `npx vitest run --root packages/fastify-plugins src/health.test.ts` (Expected: FAIL)

Create `packages/fastify-plugins/src/health.ts`:

```typescript
import type { FastifyInstance } from 'fastify'

export async function registerHealth(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }))
}
```

Run: `npx vitest run --root packages/fastify-plugins src/health.test.ts` (Expected: PASS)

- [ ] **Step 10: Escrever teste de `error-handler.ts` (vai falhar)**

Create `packages/fastify-plugins/src/error-handler.test.ts`:

```typescript
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerErrorHandler } from './error-handler'

describe('registerErrorHandler', () => {
  it('formats a domain-shaped error', async () => {
    const app = Fastify({ logger: false })
    await registerErrorHandler(app)
    app.get('/boom', async () => {
      throw { code: 'OFFER_NOT_FOUND', statusCode: 404, message: 'Offer not found' }
    })

    const response = await app.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      error: { code: 'OFFER_NOT_FOUND', message: 'Offer not found' },
    })
  })

  it('falls back to a generic 500 for unknown errors', async () => {
    const app = Fastify({ logger: false })
    await registerErrorHandler(app)
    app.get('/boom', async () => {
      throw new Error('unexpected')
    })

    const response = await app.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' },
    })
  })
})
```

- [ ] **Step 11: Rodar teste e confirmar falha, depois implementar `error-handler.ts`**

Run: `npx vitest run --root packages/fastify-plugins src/error-handler.test.ts` (Expected: FAIL)

Create `packages/fastify-plugins/src/error-handler.ts`:

```typescript
import type { FastifyInstance } from 'fastify'

type DomainErrorShape = {
  code: string
  statusCode: number
  message: string
}

function isDomainError(error: unknown): error is DomainErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    'message' in error
  )
}

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error: unknown, _request, reply) => {
    if (isDomainError(error)) {
      reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      })
      return
    }

    app.log.error(error)
    reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' },
    })
  })
}
```

Run: `npx vitest run --root packages/fastify-plugins src/error-handler.test.ts` (Expected: PASS, 2 testes)

- [ ] **Step 12: Escrever teste de `scalar.ts` (vai falhar)**

Create `packages/fastify-plugins/src/scalar.test.ts`:

```typescript
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerScalar } from './scalar'

describe('registerScalar', () => {
  it('serves the docs route', async () => {
    const app = Fastify()
    await registerScalar(app, 'Test API')
    await app.ready()

    const response = await app.inject({ method: 'GET', url: '/docs' })

    expect(response.statusCode).toBe(200)
  })

  it('exposes the openapi json', async () => {
    const app = Fastify()
    await registerScalar(app, 'Test API')
    await app.ready()

    const response = await app.inject({ method: 'GET', url: '/openapi.json' })

    expect(response.statusCode).toBe(200)
    expect(response.json().info.title).toBe('Test API')
  })
})
```

- [ ] **Step 13: Rodar teste e confirmar falha, depois implementar `scalar.ts`**

Run: `npm install && npx vitest run --root packages/fastify-plugins src/scalar.test.ts` (Expected: FAIL)

Create `packages/fastify-plugins/src/scalar.ts`:

```typescript
import swagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import type { FastifyInstance } from 'fastify'

export async function registerScalar(app: FastifyInstance, title: string): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: { title, version: '0.0.0' },
    },
  })

  app.get('/openapi.json', async () => app.swagger())

  await app.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: {
      spec: { url: '/openapi.json' },
    },
  })
}
```

Run: `npx vitest run --root packages/fastify-plugins src/scalar.test.ts` (Expected: PASS, 2 testes)

- [ ] **Step 14: Escrever teste de `tenant-auth.ts` (vai falhar)**

Create `packages/fastify-plugins/src/tenant-auth.test.ts`:

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { createTenantAuthPreHandler } from './tenant-auth'

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply
}

describe('createTenantAuthPreHandler', () => {
  it('replies 404 when tenant is not found', async () => {
    const preHandler = createTenantAuthPreHandler(async () => null)
    const request = { headers: { host: 'unknown.clube.com.br' } } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(404)
  })

  it('attaches tenant to the request when found', async () => {
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = { headers: { host: 'soupescador.clube.com.br' } } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(request.tenant).toEqual(tenant)
    expect(reply.status).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 15: Rodar teste e confirmar falha, depois implementar `tenant-auth.ts`**

Run: `npx vitest run --root packages/fastify-plugins src/tenant-auth.test.ts` (Expected: FAIL)

Create `packages/fastify-plugins/src/tenant-auth.ts`:

```typescript
import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAuth } from 'firebase-admin/auth'

export type Tenant = {
  id: string
  slug: string
}

export type ResolveTenant = (domain: string) => Promise<Tenant | null>

export type AuthenticatedUser = {
  uid: string
  role: Role
  tenant_id: string | null
}

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: Tenant | null
    user?: AuthenticatedUser
  }
}

export function createTenantAuthPreHandler(resolveTenant: ResolveTenant) {
  return async function tenantAuthPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const host = request.headers.host ?? ''
    const domain = host.replace('www.', '').split(':')[0]

    const tenant = await resolveTenant(domain)
    if (!tenant) {
      reply.status(404).send({ error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } })
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

Run: `npx vitest run --root packages/fastify-plugins src/tenant-auth.test.ts` (Expected: PASS, 2 testes)

- [ ] **Step 16: Escrever teste de `guards.ts` (vai falhar)**

Create `packages/fastify-plugins/src/guards.test.ts`:

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { requireAuth, requireSubscriber, requireSuperAdmin } from './guards'

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply
}

function createRequestWithRole(role: string | undefined) {
  return {
    user: role ? { uid: '1', role, tenant_id: null } : undefined,
  } as unknown as FastifyRequest
}

describe('guards', () => {
  it('requireSubscriber allows a subscriber role', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole('subscriber'), reply)
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('requireSubscriber rejects a plain user role', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole('user'), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('requireSuperAdmin rejects a missing role', async () => {
    const reply = createMockReply()
    await requireSuperAdmin(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('requireAuth allows any known role', async () => {
    const reply = createMockReply()
    await requireAuth(createRequestWithRole('user'), reply)
    expect(reply.status).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 17: Rodar teste e confirmar falha, depois implementar `guards.ts`**

Run: `npx vitest run --root packages/fastify-plugins src/guards.test.ts` (Expected: FAIL)

Create `packages/fastify-plugins/src/guards.ts`:

```typescript
import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'

function guard(...allowedRoles: Role[]) {
  return async function guardPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const role = request.user?.role
    if (!role || !allowedRoles.includes(role)) {
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }
  }
}

export const requireSuperAdmin = guard('super_admin')

export const requireOwner = guard('store_owner', 'super_admin')

export const requireManager = guard('store_manager', 'store_owner', 'super_admin')

export const requireSubscriber = guard(
  'subscriber',
  'community_mod',
  'store_manager',
  'store_owner',
  'super_admin',
)

export const requireAuth = guard(
  'user',
  'subscriber',
  'community_mod',
  'store_manager',
  'store_owner',
  'super_admin',
)
```

Run: `npx vitest run --root packages/fastify-plugins src/guards.test.ts` (Expected: PASS, 4 testes)

- [ ] **Step 18: Criar barrel `packages/fastify-plugins/src/index.ts`**

```typescript
export { registerCors } from './cors'
export { registerHealth } from './health'
export { registerErrorHandler } from './error-handler'
export { registerScalar } from './scalar'
export { createTenantAuthPreHandler } from './tenant-auth'
export type { AuthenticatedUser, ResolveTenant, Tenant } from './tenant-auth'
export {
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from './guards'
```

- [ ] **Step 19: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root packages/fastify-plugins`
Expected: PASS (11 testes no total).

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npm run typecheck --workspace=@clube/fastify-plugins`
Expected: sem erro.

- [ ] **Step 20: Commit**

```bash
git add packages/fastify-plugins package-lock.json
git commit -m "feat: add fastify-plugins package (cors, health, error-handler, scalar, tenant-auth, guards)"
```

---

### Task 7: `packages/ui`

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/vitest.setup.ts`
- Create: `packages/ui/components.json`
- Create: `packages/ui/src/lib/utils.ts` + `src/lib/utils.test.ts`
- Create: `packages/ui/src/components/button.tsx` + `src/components/button.test.tsx`
- Create: `packages/ui/src/index.ts`

**Interfaces:**
- Produces (de `@clube/ui`): `cn(...inputs)`, `Button` (componente React), `ButtonProps` (tipo).

- [ ] **Step 1: Criar `packages/ui/package.json`**

```json
{
  "name": "@clube/ui",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `packages/ui/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.tsx", "src/**/*.test.ts"]
}
```

- [ ] **Step 3: Criar `packages/ui/vitest.config.ts` e `vitest.setup.ts`**

Create `packages/ui/vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `packages/ui/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Criar `packages/ui/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "",
    "baseColor": "slate",
    "cssVariables": false
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

- [ ] **Step 5: Escrever teste de `cn` (vai falhar)**

Create `packages/ui/src/lib/utils.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold')
  })
})
```

- [ ] **Step 6: Rodar teste e confirmar falha, depois implementar `utils.ts`**

Run: `npm install && npx vitest run --root packages/ui src/lib/utils.test.ts` (Expected: FAIL)

Create `packages/ui/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

Run: `npx vitest run --root packages/ui src/lib/utils.test.ts` (Expected: PASS)

- [ ] **Step 7: Escrever teste do `Button` (vai falhar)**

Create `packages/ui/src/components/button.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Assinar</Button>)
    expect(screen.getByRole('button', { name: 'Assinar' })).toBeInTheDocument()
  })

  it('applies the outline variant class', () => {
    render(<Button variant="outline">Cancelar</Button>)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass('border')
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `button.tsx`**

Run: `npx vitest run --root packages/ui src/components/button.test.tsx` (Expected: FAIL)

Create `packages/ui/src/components/button.tsx`:

```typescript
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800',
        outline: 'border border-slate-300 bg-white hover:bg-slate-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'
```

Run: `npx vitest run --root packages/ui src/components/button.test.tsx` (Expected: PASS, 2 testes)

- [ ] **Step 9: Criar barrel `packages/ui/src/index.ts`**

```typescript
export { Button, type ButtonProps } from './components/button'
export { cn } from './lib/utils'
```

- [ ] **Step 10: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root packages/ui`
Expected: PASS (3 testes no total).

Run: `npm run build --workspace=@clube/ui && npm run typecheck --workspace=@clube/ui`
Expected: sem erro.

- [ ] **Step 11: Commit**

```bash
git add packages/ui package-lock.json
git commit -m "feat: add ui package (shadcn Button, cn utility)"
```

---

### Task 8: `apps/bff`

**Files:**
- Create: `apps/bff/package.json`
- Create: `apps/bff/tsconfig.json`
- Create: `apps/bff/vitest.config.ts`
- Create: `apps/bff/.env.example`
- Create: `apps/bff/src/shared/env.ts`
- Create: `apps/bff/src/domain/errors/domain-error.ts` + `domain-error.test.ts`
- Create: `apps/bff/src/infrastructure/http/proxy.ts`
- Create: `apps/bff/src/app.ts` + `src/app.test.ts`
- Create: `apps/bff/src/index.ts`

**Interfaces:**
- Consumes: `registerCors`/`registerErrorHandler`/`registerHealth`/`registerScalar`/`createTenantAuthPreHandler`/guards de `@clube/fastify-plugins` (Task 6).
- Produces: `buildApp(opts?: { logger?: boolean }): Promise<FastifyInstance>` — nenhum outro workspace depende do BFF nesta fase.

- [ ] **Step 1: Criar `apps/bff/package.json`**

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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `apps/bff/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `apps/bff/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `apps/bff/.env.example`**

```bash
PORT=3004
NODE_ENV=development
```

- [ ] **Step 5: Criar `apps/bff/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3004),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 6: Escrever teste de `DomainError` (vai falhar)**

Create `apps/bff/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Offer not found', 'OFFER_NOT_FOUND', 404)

    expect(error.message).toBe('Offer not found')
    expect(error.code).toBe('OFFER_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 7: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root apps/bff src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `apps/bff/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root apps/bff src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 8: Criar `apps/bff/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 9: Escrever teste de `app.ts` (vai falhar)**

Create `apps/bff/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 10: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root apps/bff src/app.test.ts` (Expected: FAIL)

Create `apps/bff/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube BFF')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root apps/bff src/app.test.ts` (Expected: PASS)

- [ ] **Step 11: Criar `apps/bff/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 12: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root apps/bff`
Expected: PASS (2 testes no total).

Run: `npm run build --workspace=@clube/bff && npm run typecheck --workspace=@clube/bff`
Expected: sem erro.

- [ ] **Step 13: Smoke test manual do servidor**

Run: `npm run dev --workspace=@clube/bff &` (sobe em background), depois `curl -s http://localhost:3004/health`
Expected: `{"status":"ok"}`. Encerrar o processo depois (`kill %1` ou `pkill -f "apps/bff"`).

- [ ] **Step 14: Commit**

```bash
git add apps/bff package-lock.json
git commit -m "feat: scaffold BFF app (health check, error handling, RBAC guards)"
```

---

### Task 9: `services/subscriptions`

**Files:**
- Create: `services/subscriptions/package.json`
- Create: `services/subscriptions/tsconfig.json`
- Create: `services/subscriptions/vitest.config.ts`
- Create: `services/subscriptions/.env.example`
- Create: `services/subscriptions/drizzle.config.ts`
- Create: `services/subscriptions/src/shared/env.ts`
- Create: `services/subscriptions/src/domain/errors/domain-error.ts` + `.test.ts`
- Create: `services/subscriptions/src/infrastructure/db/schema/index.ts`
- Create: `services/subscriptions/src/infrastructure/http/proxy.ts`
- Create: `services/subscriptions/src/app.ts` + `.test.ts`
- Create: `services/subscriptions/src/index.ts`

**Interfaces:**
- Consumes: mesmas exports de `@clube/fastify-plugins` (Task 6).
- Produces: `buildApp(opts?: { logger?: boolean }): Promise<FastifyInstance>` — padrão que as Tasks 10-14 replicam.

- [ ] **Step 1: Criar `services/subscriptions/package.json`**

```json
{
  "name": "@clube/subscriptions",
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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `services/subscriptions/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `services/subscriptions/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `services/subscriptions/.env.example`**

```bash
PORT=3005
NODE_ENV=development
```

- [ ] **Step 5: Criar `services/subscriptions/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['subscriptions'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

- [ ] **Step 6: Criar `services/subscriptions/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3005),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 7: Escrever teste de `DomainError` (vai falhar)**

Create `services/subscriptions/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Plan not found', 'PLAN_NOT_FOUND', 404)

    expect(error.message).toBe('Plan not found')
    expect(error.code).toBe('PLAN_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root services/subscriptions src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `services/subscriptions/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root services/subscriptions src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 9: Criar `services/subscriptions/src/infrastructure/db/schema/index.ts`**

```typescript
export const schema = {}
```

- [ ] **Step 10: Criar `services/subscriptions/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 11: Escrever teste de `app.ts` (vai falhar)**

Create `services/subscriptions/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 12: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root services/subscriptions src/app.test.ts` (Expected: FAIL)

Create `services/subscriptions/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Subscriptions')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root services/subscriptions src/app.test.ts` (Expected: PASS)

- [ ] **Step 13: Criar `services/subscriptions/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 14: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root services/subscriptions`
Expected: PASS (2 testes).

Run: `npm run build --workspace=@clube/subscriptions && npm run typecheck --workspace=@clube/subscriptions`
Expected: sem erro.

- [ ] **Step 15: Commit**

```bash
git add services/subscriptions package-lock.json
git commit -m "feat: scaffold subscriptions service"
```

---

### Task 10: `services/store`

Mesmo padrão exato da Task 9, trocando nome/porta/schema/título.

**Files:** iguais à Task 9, em `services/store/`.

- [ ] **Step 1: Criar `services/store/package.json`**

```json
{
  "name": "@clube/store",
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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `services/store/tsconfig.json`** (idêntico à Task 9, Step 2)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `services/store/vitest.config.ts`** (idêntico)

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `services/store/.env.example`**

```bash
PORT=3006
NODE_ENV=development
```

- [ ] **Step 5: Criar `services/store/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['store'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

- [ ] **Step 6: Criar `services/store/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3006),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 7: Escrever teste de `DomainError` (vai falhar)**

Create `services/store/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Offer not found', 'OFFER_NOT_FOUND', 404)

    expect(error.message).toBe('Offer not found')
    expect(error.code).toBe('OFFER_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root services/store src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `services/store/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root services/store src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 9: Criar `services/store/src/infrastructure/db/schema/index.ts`**

```typescript
export const schema = {}
```

- [ ] **Step 10: Criar `services/store/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 11: Escrever teste de `app.ts` (vai falhar)**

Create `services/store/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 12: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root services/store src/app.test.ts` (Expected: FAIL)

Create `services/store/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Store')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root services/store src/app.test.ts` (Expected: PASS)

- [ ] **Step 13: Criar `services/store/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 14: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root services/store` (Expected: PASS, 2 testes)

Run: `npm run build --workspace=@clube/store && npm run typecheck --workspace=@clube/store` (Expected: sem erro)

- [ ] **Step 15: Commit**

```bash
git add services/store package-lock.json
git commit -m "feat: scaffold store service"
```

---

### Task 11: `services/cashback`

Mesmo padrão da Task 9/10. Porta 3007, schema `cashback`.

- [ ] **Step 1: Criar `services/cashback/package.json`**

```json
{
  "name": "@clube/cashback",
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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `services/cashback/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `services/cashback/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `services/cashback/.env.example`**

```bash
PORT=3007
NODE_ENV=development
```

- [ ] **Step 5: Criar `services/cashback/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['cashback'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

- [ ] **Step 6: Criar `services/cashback/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3007),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 7: Escrever teste de `DomainError` (vai falhar)**

Create `services/cashback/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Ledger entry not found', 'LEDGER_ENTRY_NOT_FOUND', 404)

    expect(error.message).toBe('Ledger entry not found')
    expect(error.code).toBe('LEDGER_ENTRY_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root services/cashback src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `services/cashback/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root services/cashback src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 9: Criar `services/cashback/src/infrastructure/db/schema/index.ts`**

```typescript
export const schema = {}
```

- [ ] **Step 10: Criar `services/cashback/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 11: Escrever teste de `app.ts` (vai falhar)**

Create `services/cashback/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 12: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root services/cashback src/app.test.ts` (Expected: FAIL)

Create `services/cashback/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Cashback')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root services/cashback src/app.test.ts` (Expected: PASS)

- [ ] **Step 13: Criar `services/cashback/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 14: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root services/cashback` (Expected: PASS, 2 testes)

Run: `npm run build --workspace=@clube/cashback && npm run typecheck --workspace=@clube/cashback` (Expected: sem erro)

- [ ] **Step 15: Commit**

```bash
git add services/cashback package-lock.json
git commit -m "feat: scaffold cashback service"
```

---

### Task 12: `services/raffles`

Mesmo padrão. Porta 3008, schema `raffles`.

- [ ] **Step 1: Criar `services/raffles/package.json`**

```json
{
  "name": "@clube/raffles",
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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `services/raffles/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `services/raffles/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `services/raffles/.env.example`**

```bash
PORT=3008
NODE_ENV=development
```

- [ ] **Step 5: Criar `services/raffles/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['raffles'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

- [ ] **Step 6: Criar `services/raffles/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3008),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 7: Escrever teste de `DomainError` (vai falhar)**

Create `services/raffles/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Raffle not found', 'RAFFLE_NOT_FOUND', 404)

    expect(error.message).toBe('Raffle not found')
    expect(error.code).toBe('RAFFLE_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root services/raffles src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `services/raffles/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root services/raffles src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 9: Criar `services/raffles/src/infrastructure/db/schema/index.ts`**

```typescript
export const schema = {}
```

- [ ] **Step 10: Criar `services/raffles/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 11: Escrever teste de `app.ts` (vai falhar)**

Create `services/raffles/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 12: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root services/raffles src/app.test.ts` (Expected: FAIL)

Create `services/raffles/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Raffles')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root services/raffles src/app.test.ts` (Expected: PASS)

- [ ] **Step 13: Criar `services/raffles/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 14: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root services/raffles` (Expected: PASS, 2 testes)

Run: `npm run build --workspace=@clube/raffles && npm run typecheck --workspace=@clube/raffles` (Expected: sem erro)

- [ ] **Step 15: Commit**

```bash
git add services/raffles package-lock.json
git commit -m "feat: scaffold raffles service"
```

---

### Task 13: `services/tournaments`

Mesmo padrão. Porta 3009, schema `tournaments`.

- [ ] **Step 1: Criar `services/tournaments/package.json`**

```json
{
  "name": "@clube/tournaments",
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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `services/tournaments/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `services/tournaments/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `services/tournaments/.env.example`**

```bash
PORT=3009
NODE_ENV=development
```

- [ ] **Step 5: Criar `services/tournaments/drizzle.config.ts`**

```typescript
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
```

- [ ] **Step 6: Criar `services/tournaments/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3009),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 7: Escrever teste de `DomainError` (vai falhar)**

Create `services/tournaments/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Tournament not found', 'TOURNAMENT_NOT_FOUND', 404)

    expect(error.message).toBe('Tournament not found')
    expect(error.code).toBe('TOURNAMENT_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root services/tournaments src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `services/tournaments/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root services/tournaments src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 9: Criar `services/tournaments/src/infrastructure/db/schema/index.ts`**

```typescript
export const schema = {}
```

- [ ] **Step 10: Criar `services/tournaments/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 11: Escrever teste de `app.ts` (vai falhar)**

Create `services/tournaments/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 12: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root services/tournaments src/app.test.ts` (Expected: FAIL)

Create `services/tournaments/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Tournaments')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root services/tournaments src/app.test.ts` (Expected: PASS)

- [ ] **Step 13: Criar `services/tournaments/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 14: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root services/tournaments` (Expected: PASS, 2 testes)

Run: `npm run build --workspace=@clube/tournaments && npm run typecheck --workspace=@clube/tournaments` (Expected: sem erro)

- [ ] **Step 15: Commit**

```bash
git add services/tournaments package-lock.json
git commit -m "feat: scaffold tournaments service"
```

---

### Task 14: `services/community`

Mesmo padrão. Porta 3010, schema `community`.

- [ ] **Step 1: Criar `services/community/package.json`**

```json
{
  "name": "@clube/community",
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
    "@clube/fastify-plugins": "*",
    "@t3-oss/env-core": "^0.11.1",
    "fastify": "^5.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `services/community/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `services/community/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar `services/community/.env.example`**

```bash
PORT=3010
NODE_ENV=development
```

- [ ] **Step 5: Criar `services/community/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  schemaFilter: ['community'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

- [ ] **Step 6: Criar `services/community/src/shared/env.ts`**

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3010),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

- [ ] **Step 7: Escrever teste de `DomainError` (vai falhar)**

Create `services/community/src/domain/errors/domain-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Topic not found', 'TOPIC_NOT_FOUND', 404)

    expect(error.message).toBe('Topic not found')
    expect(error.code).toBe('TOPIC_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 8: Rodar teste e confirmar falha, depois implementar `domain-error.ts`**

Run: `npm install && npx vitest run --root services/community src/domain/errors/domain-error.test.ts` (Expected: FAIL)

Create `services/community/src/domain/errors/domain-error.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

Run: `npx vitest run --root services/community src/domain/errors/domain-error.test.ts` (Expected: PASS)

- [ ] **Step 9: Criar `services/community/src/infrastructure/db/schema/index.ts`**

```typescript
export const schema = {}
```

- [ ] **Step 10: Criar `services/community/src/infrastructure/http/proxy.ts`**

```typescript
import {
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
  type Tenant,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export { requireAuth, requireManager, requireOwner, requireSubscriber, requireSuperAdmin }
```

- [ ] **Step 11: Escrever teste de `app.ts` (vai falhar)**

Create `services/community/src/app.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp({ logger: false })
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 12: Rodar teste e confirmar falha, depois implementar `app.ts`**

Run: `npx vitest run --root services/community src/app.test.ts` (Expected: FAIL)

Create `services/community/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Community')
  await registerHealth(app)

  return app
}
```

Run: `npm run build --workspace=@clube/shared-types && npm run build --workspace=@clube/fastify-plugins && npx vitest run --root services/community src/app.test.ts` (Expected: PASS)

- [ ] **Step 13: Criar `services/community/src/index.ts`**

```typescript
import { buildApp } from './app'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 14: Rodar suite completa, build e typecheck**

Run: `npx vitest run --root services/community` (Expected: PASS, 2 testes)

Run: `npm run build --workspace=@clube/community && npm run typecheck --workspace=@clube/community` (Expected: sem erro)

- [ ] **Step 15: Commit**

```bash
git add services/community package-lock.json
git commit -m "feat: scaffold community service"
```

---

### Task 15: `apps/landing`

**Files:**
- Create: `apps/landing/package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `vitest.setup.ts`, `.env.example`
- Create: `apps/landing/src/app/layout.tsx`, `src/app/page.tsx` + `page.test.tsx`, `src/app/globals.css`
- Create: `apps/landing/src/shared/utils/cn.ts`

**Interfaces:**
- Consumes: `Button`/`cn` de `@clube/ui` (Task 7), `Role`/`Tenant` de `@clube/shared-types` (Task 2) — não usados ainda no placeholder, mas já listados como dependência pra fases seguintes.
- Produces: nada consumido por outro workspace.

- [ ] **Step 1: Criar `apps/landing/package.json`**

```json
{
  "name": "@clube/landing",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/shared-types": "*",
    "@clube/ui": "*",
    "next": "14.2.15",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `apps/landing/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Criar `apps/landing/next.config.js`**

```javascript
const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@clube/ui', '@clube/shared-types'],
}

module.exports = nextConfig
```

- [ ] **Step 4: Criar `apps/landing/tailwind.config.ts` e `postcss.config.js`**

Create `apps/landing/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

Create `apps/landing/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Criar `apps/landing/vitest.config.ts` e `vitest.setup.ts`**

Create `apps/landing/vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `apps/landing/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Criar `apps/landing/.env.example`**

```bash
NEXT_PUBLIC_BFF_URL=http://localhost:3004
NODE_ENV=development
```

- [ ] **Step 7: Criar `apps/landing/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Criar `apps/landing/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clube de Vendas com Assinaturas',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Criar `apps/landing/src/shared/utils/cn.ts`**

```typescript
export { cn } from '@clube/ui'
```

- [ ] **Step 10: Escrever teste da home (vai falhar)**

Create `apps/landing/src/app/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from './page'

describe('Landing home page', () => {
  it('renders the placeholder heading', () => {
    render(<Home />)
    expect(screen.getByText('Em construção.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Rodar teste e confirmar falha, depois implementar `page.tsx`**

Run: `npm install && npx vitest run --root apps/landing src/app/page.test.tsx` (Expected: FAIL)

Create `apps/landing/src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <h1>Clube de Vendas com Assinaturas — Landing</h1>
      <p>Em construção.</p>
    </main>
  )
}
```

Run: `npm run build --workspace=@clube/ui && npx vitest run --root apps/landing src/app/page.test.tsx` (Expected: PASS)

- [ ] **Step 12: Rodar suite completa, typecheck e build**

Run: `npx vitest run --root apps/landing` (Expected: PASS, 1 teste)

Run: `npm run typecheck --workspace=@clube/landing` (Expected: sem erro)

Run: `npm run build --workspace=@clube/landing` (Expected: build do Next.js completa sem erro)

- [ ] **Step 13: Commit**

```bash
git add apps/landing package-lock.json
git commit -m "feat: scaffold landing app"
```

---

### Task 16: `apps/pwa`

Mesmo padrão da Task 15, mais o `middleware.ts` de resolução de tenant. Porta 3001.

**Files:** iguais à Task 15 em `apps/pwa/`, mais `apps/pwa/src/middleware.ts`.

- [ ] **Step 1: Criar `apps/pwa/package.json`**

```json
{
  "name": "@clube/pwa",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/shared-types": "*",
    "@clube/ui": "*",
    "next": "14.2.15",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `apps/pwa/tsconfig.json`** (idêntico à Task 15, Step 2)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Criar `apps/pwa/next.config.js`**

```javascript
const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@clube/ui', '@clube/shared-types'],
}

module.exports = nextConfig
```

- [ ] **Step 4: Criar `apps/pwa/tailwind.config.ts` e `postcss.config.js`** (idênticos à Task 15, Step 4, mesmo conteúdo)

Create `apps/pwa/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

Create `apps/pwa/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Criar `apps/pwa/vitest.config.ts` e `vitest.setup.ts`**

Create `apps/pwa/vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `apps/pwa/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Criar `apps/pwa/.env.example`**

```bash
NEXT_PUBLIC_BFF_URL=http://localhost:3004
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NODE_ENV=development
```

- [ ] **Step 7: Criar `apps/pwa/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Criar `apps/pwa/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sou Pescador',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Criar `apps/pwa/src/shared/utils/cn.ts`**

```typescript
export { cn } from '@clube/ui'
```

- [ ] **Step 10: Escrever teste da home (vai falhar)**

Create `apps/pwa/src/app/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from './page'

describe('PWA home page', () => {
  it('renders the placeholder heading', () => {
    render(<Home />)
    expect(screen.getByText('Em construção.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Rodar teste e confirmar falha, depois implementar `page.tsx`**

Run: `npm install && npx vitest run --root apps/pwa src/app/page.test.tsx` (Expected: FAIL)

Create `apps/pwa/src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <h1>Sou Pescador — Área do Membro</h1>
      <p>Em construção.</p>
    </main>
  )
}
```

Run: `npm run build --workspace=@clube/ui && npx vitest run --root apps/pwa src/app/page.test.tsx` (Expected: PASS)

- [ ] **Step 12: Escrever teste do `middleware.ts`**

Create `apps/pwa/src/middleware.test.ts`:

```typescript
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { middleware } from './middleware'

describe('middleware', () => {
  it('sets x-tenant-slug for a *.clube.com.br subdomain', () => {
    const request = new NextRequest('https://soupescador.clube.com.br/', {
      headers: { host: 'soupescador.clube.com.br' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-tenant-slug')).toBe('soupescador')
  })

  it('sets x-tenant-domain for a custom domain', () => {
    const request = new NextRequest('https://minhaloja.com.br/', {
      headers: { host: 'minhaloja.com.br' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-tenant-domain')).toBe('minhaloja.com.br')
  })
})
```

- [ ] **Step 13: Rodar teste e confirmar falha, depois implementar `middleware.ts`**

Run: `npx vitest run --root apps/pwa src/middleware.test.ts` (Expected: FAIL)

Create `apps/pwa/src/middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const domain = host.replace('www.', '').split(':')[0]

  const slug = domain.endsWith('.clube.com.br') ? domain.replace('.clube.com.br', '') : null

  const response = NextResponse.next()
  if (slug) {
    response.headers.set('x-tenant-slug', slug)
  } else {
    response.headers.set('x-tenant-domain', domain)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Run: `npx vitest run --root apps/pwa src/middleware.test.ts` (Expected: PASS, 2 testes)

- [ ] **Step 14: Rodar suite completa, typecheck e build**

Run: `npx vitest run --root apps/pwa` (Expected: PASS, 3 testes)

Run: `npm run typecheck --workspace=@clube/pwa` (Expected: sem erro)

Run: `npm run build --workspace=@clube/pwa` (Expected: build completa sem erro)

- [ ] **Step 15: Commit**

```bash
git add apps/pwa package-lock.json
git commit -m "feat: scaffold pwa app with tenant-resolution middleware"
```

---

### Task 17: `apps/admin`

Mesmo padrão da Task 16 (com `middleware.ts`). Porta 3002.

- [ ] **Step 1: Criar `apps/admin/package.json`**

```json
{
  "name": "@clube/admin",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/shared-types": "*",
    "@clube/ui": "*",
    "next": "14.2.15",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `apps/admin/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Criar `apps/admin/next.config.js`**

```javascript
const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@clube/ui', '@clube/shared-types'],
}

module.exports = nextConfig
```

- [ ] **Step 4: Criar `apps/admin/tailwind.config.ts` e `postcss.config.js`**

Create `apps/admin/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

Create `apps/admin/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Criar `apps/admin/vitest.config.ts` e `vitest.setup.ts`**

Create `apps/admin/vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `apps/admin/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Criar `apps/admin/.env.example`**

```bash
NEXT_PUBLIC_BFF_URL=http://localhost:3004
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NODE_ENV=development
```

- [ ] **Step 7: Criar `apps/admin/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Criar `apps/admin/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Painel do Lojista — Sou Pescador',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Criar `apps/admin/src/shared/utils/cn.ts`**

```typescript
export { cn } from '@clube/ui'
```

- [ ] **Step 10: Escrever teste da home (vai falhar)**

Create `apps/admin/src/app/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from './page'

describe('Admin home page', () => {
  it('renders the placeholder heading', () => {
    render(<Home />)
    expect(screen.getByText('Em construção.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Rodar teste e confirmar falha, depois implementar `page.tsx`**

Run: `npm install && npx vitest run --root apps/admin src/app/page.test.tsx` (Expected: FAIL)

Create `apps/admin/src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <h1>Admin — Sou Pescador</h1>
      <p>Em construção.</p>
    </main>
  )
}
```

Run: `npm run build --workspace=@clube/ui && npx vitest run --root apps/admin src/app/page.test.tsx` (Expected: PASS)

- [ ] **Step 12: Escrever teste do `middleware.ts`**

Create `apps/admin/src/middleware.test.ts`:

```typescript
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { middleware } from './middleware'

describe('middleware', () => {
  it('sets x-tenant-slug for a *.clube.com.br subdomain', () => {
    const request = new NextRequest('https://admin.soupescador.clube.com.br/', {
      headers: { host: 'admin.soupescador.clube.com.br' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-tenant-slug')).toBe('admin.soupescador')
  })

  it('sets x-tenant-domain for a custom domain', () => {
    const request = new NextRequest('https://admin.minhaloja.com.br/', {
      headers: { host: 'admin.minhaloja.com.br' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-tenant-domain')).toBe('admin.minhaloja.com.br')
  })
})
```

- [ ] **Step 13: Rodar teste e confirmar falha, depois implementar `middleware.ts`**

Run: `npx vitest run --root apps/admin src/middleware.test.ts` (Expected: FAIL)

Create `apps/admin/src/middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const domain = host.replace('www.', '').split(':')[0]

  const slug = domain.endsWith('.clube.com.br') ? domain.replace('.clube.com.br', '') : null

  const response = NextResponse.next()
  if (slug) {
    response.headers.set('x-tenant-slug', slug)
  } else {
    response.headers.set('x-tenant-domain', domain)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Run: `npx vitest run --root apps/admin src/middleware.test.ts` (Expected: PASS, 2 testes)

- [ ] **Step 14: Rodar suite completa, typecheck e build**

Run: `npx vitest run --root apps/admin` (Expected: PASS, 3 testes)

Run: `npm run typecheck --workspace=@clube/admin` (Expected: sem erro)

Run: `npm run build --workspace=@clube/admin` (Expected: build completa sem erro)

- [ ] **Step 15: Commit**

```bash
git add apps/admin package-lock.json
git commit -m "feat: scaffold admin app with tenant-resolution middleware"
```

---

### Task 18: `apps/super-admin`

Mesmo padrão da Task 15 (sem middleware — domínio fixo `superadmin.clube.com.br`). Porta 3003.

- [ ] **Step 1: Criar `apps/super-admin/package.json`**

```json
{
  "name": "@clube/super-admin",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3003",
    "build": "next build",
    "start": "next start -p 3003",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clube/shared-types": "*",
    "@clube/ui": "*",
    "next": "14.2.15",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Criar `apps/super-admin/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Criar `apps/super-admin/next.config.js`**

```javascript
const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@clube/ui', '@clube/shared-types'],
}

module.exports = nextConfig
```

- [ ] **Step 4: Criar `apps/super-admin/tailwind.config.ts` e `postcss.config.js`**

Create `apps/super-admin/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

Create `apps/super-admin/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Criar `apps/super-admin/vitest.config.ts` e `vitest.setup.ts`**

Create `apps/super-admin/vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `apps/super-admin/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Criar `apps/super-admin/.env.example`**

```bash
NEXT_PUBLIC_BFF_URL=http://localhost:3004
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NODE_ENV=development
```

- [ ] **Step 7: Criar `apps/super-admin/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Criar `apps/super-admin/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Super Admin — Clube de Vendas com Assinaturas',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Criar `apps/super-admin/src/shared/utils/cn.ts`**

```typescript
export { cn } from '@clube/ui'
```

- [ ] **Step 10: Escrever teste da home (vai falhar)**

Create `apps/super-admin/src/app/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from './page'

describe('Super Admin home page', () => {
  it('renders the placeholder heading', () => {
    render(<Home />)
    expect(screen.getByText('Em construção.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Rodar teste e confirmar falha, depois implementar `page.tsx`**

Run: `npm install && npx vitest run --root apps/super-admin src/app/page.test.tsx` (Expected: FAIL)

Create `apps/super-admin/src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <h1>Super Admin</h1>
      <p>Em construção.</p>
    </main>
  )
}
```

Run: `npm run build --workspace=@clube/ui && npx vitest run --root apps/super-admin src/app/page.test.tsx` (Expected: PASS)

- [ ] **Step 12: Rodar suite completa, typecheck e build**

Run: `npx vitest run --root apps/super-admin` (Expected: PASS, 1 teste)

Run: `npm run typecheck --workspace=@clube/super-admin` (Expected: sem erro)

Run: `npm run build --workspace=@clube/super-admin` (Expected: build completa sem erro)

- [ ] **Step 13: Commit**

```bash
git add apps/super-admin package-lock.json
git commit -m "feat: scaffold super-admin app"
```

---

### Task 19: Dockerfiles de produção

**Files:**
- Create: `Dockerfile.landing`, `Dockerfile.pwa`, `Dockerfile.admin`, `Dockerfile.super-admin` (padrão Next.js standalone)
- Create: `Dockerfile.bff`, `Dockerfile.subscriptions`, `Dockerfile.store`, `Dockerfile.cashback`, `Dockerfile.raffles`, `Dockerfile.tournaments`, `Dockerfile.community` (padrão Fastify + tsc)
- Create: `.dockerignore`

**Interfaces:** nenhuma — arquivos de build, não código consumido por outros workspaces.

- [ ] **Step 1: Criar `.dockerignore`**

```
node_modules
**/node_modules
**/dist
**/.next
**/.turbo
.git
.env
```

- [ ] **Step 2: Criar `Dockerfile.landing`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/landing --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/landing

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/landing/.next/standalone ./
COPY --from=builder /app/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=builder /app/apps/landing/public ./apps/landing/public
EXPOSE 3000
CMD ["node", "apps/landing/server.js"]
```

- [ ] **Step 3: Criar `Dockerfile.pwa`** (idêntico, trocando `landing`→`pwa`, porta 3001)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/pwa --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/pwa

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/pwa/.next/standalone ./
COPY --from=builder /app/apps/pwa/.next/static ./apps/pwa/.next/static
COPY --from=builder /app/apps/pwa/public ./apps/pwa/public
EXPOSE 3001
CMD ["node", "apps/pwa/server.js"]
```

- [ ] **Step 4: Criar `Dockerfile.admin`** (trocando `pwa`→`admin`, porta 3002)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/admin --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/admin

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public
EXPOSE 3002
CMD ["node", "apps/admin/server.js"]
```

- [ ] **Step 5: Criar `Dockerfile.super-admin`** (trocando `admin`→`super-admin`, porta 3003)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/super-admin --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/super-admin

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/super-admin/.next/standalone ./
COPY --from=builder /app/apps/super-admin/.next/static ./apps/super-admin/.next/static
COPY --from=builder /app/apps/super-admin/public ./apps/super-admin/public
EXPOSE 3003
CMD ["node", "apps/super-admin/server.js"]
```

- [ ] **Step 6: Criar `Dockerfile.bff`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/bff --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/bff

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/bff/dist ./apps/bff/dist
COPY --from=builder /app/apps/bff/package.json ./apps/bff/package.json
EXPOSE 3004
CMD ["node", "apps/bff/dist/index.js"]
```

- [ ] **Step 7: Criar `Dockerfile.subscriptions`** (trocando `bff`→`subscriptions`, porta 3005)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/subscriptions --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/subscriptions

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/subscriptions/dist ./services/subscriptions/dist
COPY --from=builder /app/services/subscriptions/package.json ./services/subscriptions/package.json
EXPOSE 3005
CMD ["node", "services/subscriptions/dist/index.js"]
```

- [ ] **Step 8: Criar `Dockerfile.store`** (trocando `subscriptions`→`store`, porta 3006)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/store --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/store

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/store/dist ./services/store/dist
COPY --from=builder /app/services/store/package.json ./services/store/package.json
EXPOSE 3006
CMD ["node", "services/store/dist/index.js"]
```

- [ ] **Step 9: Criar `Dockerfile.cashback`** (porta 3007)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/cashback --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/cashback

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/cashback/dist ./services/cashback/dist
COPY --from=builder /app/services/cashback/package.json ./services/cashback/package.json
EXPOSE 3007
CMD ["node", "services/cashback/dist/index.js"]
```

- [ ] **Step 10: Criar `Dockerfile.raffles`** (porta 3008)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/raffles --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/raffles

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/raffles/dist ./services/raffles/dist
COPY --from=builder /app/services/raffles/package.json ./services/raffles/package.json
EXPOSE 3008
CMD ["node", "services/raffles/dist/index.js"]
```

- [ ] **Step 11: Criar `Dockerfile.tournaments`** (porta 3009)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/tournaments --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/tournaments

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/tournaments/dist ./services/tournaments/dist
COPY --from=builder /app/services/tournaments/package.json ./services/tournaments/package.json
EXPOSE 3009
CMD ["node", "services/tournaments/dist/index.js"]
```

- [ ] **Step 12: Criar `Dockerfile.community`** (porta 3010)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @clube/community --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=@clube/community

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/community/dist ./services/community/dist
COPY --from=builder /app/services/community/package.json ./services/community/package.json
EXPOSE 3010
CMD ["node", "services/community/dist/index.js"]
```

- [ ] **Step 13: Commit**

```bash
git add Dockerfile.landing Dockerfile.pwa Dockerfile.admin Dockerfile.super-admin Dockerfile.bff Dockerfile.subscriptions Dockerfile.store Dockerfile.cashback Dockerfile.raffles Dockerfile.tournaments Dockerfile.community .dockerignore
git commit -m "chore: add production Dockerfiles for all apps and services"
```

---

### Task 20: Verificação final de integração

**Files:** nenhum arquivo novo — só validação de tudo junto.

- [ ] **Step 1: Instalar tudo do zero**

Run: `rm -rf node_modules && npm install`
Expected: instala as 17 workspaces sem erro.

- [ ] **Step 2: Build completo via Turborepo**

Run: `npm run build`
Expected: as 17 workspaces buildam sem erro (packages primeiro, depois apps/services, por causa do `dependsOn: ["^build"]`).

- [ ] **Step 3: Typecheck completo**

Run: `npm run typecheck`
Expected: sem erros em nenhum workspace.

- [ ] **Step 4: Suite de testes completa**

Run: `npm run test`
Expected: todos os smoke tests passam (2 por package/service/BFF + 1-3 por app Next.js).

- [ ] **Step 5: Lint com Biome**

Run: `npx biome check .`
Expected: sem erros. Se houver problemas de formatação, rodar `npx biome check --write .` e revisar o diff antes de commitar.

- [ ] **Step 6: Verificar infraestrutura remota**

Run: `npm run verify:infra`
Expected: `Postgres: OK` e `Redis: OK`.

- [ ] **Step 7: Smoke test de todos os servidores rodando juntos**

Run: `npm run dev &` (roda em background; aguardar ~15s para todos os processos subirem)

Run cada um destes e conferir `{"status":"ok"}`:
```bash
curl -s http://localhost:3004/health
curl -s http://localhost:3005/health
curl -s http://localhost:3006/health
curl -s http://localhost:3007/health
curl -s http://localhost:3008/health
curl -s http://localhost:3009/health
curl -s http://localhost:3010/health
```

Run cada um destes e conferir status HTTP 200:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003
```

Encerrar todos os processos: `kill %1` (ou `pkill -f "turbo run dev"`).

- [ ] **Step 8: Commit final (se `biome check --write` tiver alterado algo)**

```bash
git add -A
git commit -m "chore: final Fase 0 verification pass"
```

Se nada mudou no Step 5, pular este commit.
