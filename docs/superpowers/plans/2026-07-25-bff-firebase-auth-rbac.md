# BFF Firebase Auth + RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Firebase Auth JWT validation real (not a stub), give the BFF a first real business route pair (`POST /v1/auth/register`, `GET /v1/auth/me`), and ship the RBAC status-code contract (401 vs 403, `TOKEN_EXPIRED` vs `INVALID_TOKEN`) the whole platform's role hierarchy depends on.

**Architecture:** Firebase Admin SDK initialization is owned by `@clube/firebase-utils` (already exists, already does this correctly — this plan exposes it rather than rebuilding it). `packages/fastify-plugins`'s `createTenantAuthPreHandler`/`guards.ts` get corrected to use that shared initializer and to return the right status codes. `apps/bff` gets its first Clean Architecture vertical slice: a `tenants.users` table (domain entity + interface + Drizzle repository + testcontainers test), two usecases (`RegisterUserUseCase`, `GetMeUseCase`), and two routes wired via explicit dependency injection (not hidden module-level singletons — this keeps the routes unit-testable without a database, mirroring the fix already applied to `proxy.ts` in the previous plan).

**Tech Stack:** `firebase-admin` (already a transitive concern via `@clube/firebase-utils`), `@sinclair/typebox` (new to `apps/bff`), Drizzle ORM (extending the existing `tenants` schema), Vitest + `@testcontainers/postgresql` (established pattern).

## Global Constraints

- **`tenants.users` is the persistence home for this task**, confirmed with the user: a new table in the `tenants` schema (not the `subscriptions` schema, which is still an empty Fase-0 placeholder with zero real implementation anywhere in the repo). `id, tenant_id, uid, role, created_at`. When the `subscriptions` service is eventually built (Fase 2), it owns separate paid-subscription data (plan, XP, badges) linked by the same `uid`/`tenant_id` — this table is deliberately just the base "registered account" record, not a subscription.
- **Reuse `@clube/firebase-utils`'s existing Firebase Admin initializer — do not build a second one.** It already has a private `getFirebaseApp()` that lazily calls `initializeApp()` guarded by `getApps()[0]` (a correct singleton). This plan exports it and has `apps/bff/src/infrastructure/external/firebase/admin.ts` delegate to it, and has `packages/fastify-plugins/src/tenant-auth.ts` call `getAuth(getFirebaseApp())` explicitly instead of the current bare `getAuth()` (which silently depends on some other module having initialized the default app first — fragile, and there is currently no guarantee of that ordering anywhere in the codebase).
- **No `@/*` path aliases** in `apps/bff` — this repo's `tsx watch`/plain-`tsc`-then-`node` setup doesn't rewrite TS path aliases at runtime. Use relative imports for all new cross-file references, matching the established pattern from the previous plan.
- **Routes get their dependencies by explicit injection, not by importing singletons from `container.ts` directly.** `apps/bff/src/infrastructure/http/routes/auth.ts` exports `registerAuthRoutes(app, deps)` where `deps` is a plain object of preHandlers + usecases. `container.ts` builds the real (DB-backed) deps; `app.ts` wires them together. This is what makes the route file testable with zero database — a lesson already learned once in the previous plan (`proxy.ts` had to be extracted out of `container.ts` for the same reason after a final-review finding).
- **`FIREBASE_SERVICE_ACCOUNT`/`FIREBASE_PROJECT_ID` in this worktree's `.env` are a syntactically-valid but fake placeholder** (self-signed RSA key, fake project id `clube-dev-placeholder`) — confirmed empirically that `initializeApp()`/`getAuth()` construct without throwing and without any network call. This is sufficient for `npm run dev` to boot and for every automated test in this plan (all of which mock `firebase-admin/auth`'s actual network-calling methods like `verifyIdToken`/`setCustomUserClaims`/`getUser`). **A real Firebase project's service account is required before this can validate real client tokens** — that's on the user to provide via the actual deployment environment's secrets, not something this plan can fabricate.
- **RLS on `tenants.users`**: same pattern as `domains`/`landing_configs` from the previous plan — `ENABLE ROW LEVEL SECURITY` + a `tenant_isolation` policy using `current_setting('app.tenant_id', true)` (two-arg form, so it degrades to zero rows instead of hard-erroring for a future non-superuser role; the current superuser connection bypasses RLS regardless — this is a known, already-documented limitation, not new to this plan).
- **`Role` is imported from `@clube/shared-types`**, never redefined — the `User` domain entity and the new Drizzle `user_role` enum both mirror this existing 6-value union (`super_admin | store_owner | store_manager | community_mod | subscriber | user`); don't invent a parallel `UserRole` type.
- Every endpoint gets a TypeBox response schema (`@sinclair/typebox`, new dependency for `apps/bff`), per CLAUDE.md's "todo endpoint tem schema TypeBox com response tipado" rule — this is the first route in the BFF, so it's also establishing the pattern.
- Tests are colocated (`foo.ts` + `foo.test.ts`) except the two repository tests (`tenant.repository.test.ts`, and this plan's new `user.repository.test.ts`), which live in `repositories/__tests__/` to match the established sibling.
- This plan does **not** touch `services/subscriptions` or any other service — everything is scoped to `apps/bff` plus the two shared packages (`packages/firebase-utils`, `packages/fastify-plugins`) that the task explicitly requires changes in.

---

## File Structure

```
packages/firebase-utils/
  src/index.ts                                                     [modify: export getFirebaseApp]
  src/index.test.ts                                                [new]
packages/fastify-plugins/
  src/tenant-auth.ts                                                [modify: real getAuth(getFirebaseApp()), try/catch expired/invalid]
  src/tenant-auth.test.ts                                           [modify: add expired/invalid-token cases]
  src/guards.ts                                                     [modify: 401 when no user, 403 when wrong role]
  src/guards.test.ts                                                [modify: add no-user → 401 case]
apps/bff/
  package.json                                                     [modify]
  .env.example                                                      [modify]
  src/
    shared/env.ts                                                   [modify: FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT]
    domain/
      entities/
        user.ts                                                     [new]
        user.test.ts                                                [new]
      interfaces/
        IUserRepository.ts                                          [new]
      errors/
        user-already-registered.error.ts                            [new]
        user-already-registered.error.test.ts                       [new]
    infrastructure/
      external/
        firebase/
          admin.ts                                                  [new]
          admin.test.ts                                              [new]
      db/
        schema/
          tenants.ts                                                 [modify: add users table + user_role enum]
        migrations/                                                  [generated: 0001_*.sql]
        repositories/
          user.repository.ts                                        [new]
          __tests__/
            user.repository.test.ts                                 [new]
      http/
        container.ts                                                 [modify: wire UserRepository + usecases]
        proxy.ts                                                     [unchanged — re-exports already sufficient]
        schemas/
          auth.ts                                                    [new]
        routes/
          auth.ts                                                    [new]
          auth.test.ts                                                [new]
    app.ts                                                           [modify: register auth routes]
    app.test.ts                                                      [unchanged, still passes]
  application/tenants/
    register-user.usecase.ts                                        [new]
    register-user.usecase.test.ts                                    [new]
    get-me.usecase.ts                                                 [new]
    get-me.usecase.test.ts                                            [new]
  scripts/
    seed-super-admin.ts                                              [new]
```

---

### Task 1: Firebase Admin SDK config

**Files:**
- Modify: `packages/firebase-utils/src/index.ts`
- Create: `packages/firebase-utils/src/index.test.ts`
- Modify: `apps/bff/src/shared/env.ts`
- Modify: `apps/bff/.env.example`
- Modify: `apps/bff/package.json`
- Create: `apps/bff/src/infrastructure/external/firebase/admin.ts`
- Create: `apps/bff/src/infrastructure/external/firebase/admin.test.ts`

**Interfaces:**
- Produces: `getFirebaseApp(): App` (exported from `@clube/firebase-utils`), `getFirebaseAdmin(): App` (`apps/bff/src/infrastructure/external/firebase/admin.ts`, delegates to the former). Consumed by Task 2 (`tenant-auth.ts`).

- [ ] **Step 1: Write the failing test for `getFirebaseApp`**

Create `packages/firebase-utils/src/index.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'

const { getApps, initializeApp, cert } = vi.hoisted(() => ({
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  cert: vi.fn((serviceAccount: unknown) => serviceAccount),
}))

vi.mock('firebase-admin/app', () => ({ getApps, initializeApp, cert }))
vi.mock('firebase-admin/auth', () => ({ getAuth: vi.fn() }))

describe('getFirebaseApp', () => {
  it('throws when FIREBASE_SERVICE_ACCOUNT is not set', async () => {
    const original = process.env.FIREBASE_SERVICE_ACCOUNT
    process.env.FIREBASE_SERVICE_ACCOUNT = ''
    getApps.mockReturnValue([])

    const { getFirebaseApp } = await import('./index')

    expect(() => getFirebaseApp()).toThrow(
      'FIREBASE_SERVICE_ACCOUNT env var is required',
    )

    process.env.FIREBASE_SERVICE_ACCOUNT = original
  })

  it('reuses the existing app instead of initializing twice', async () => {
    const existingApp = { name: '[DEFAULT]' }
    getApps.mockReturnValue([existingApp])

    const { getFirebaseApp } = await import('./index')
    const app = getFirebaseApp()

    expect(app).toBe(existingApp)
    expect(initializeApp).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@clube/firebase-utils`
Expected: FAIL — `getFirebaseApp is not exported` (it's currently a private, non-exported function).

- [ ] **Step 3: Export `getFirebaseApp`**

In `packages/firebase-utils/src/index.ts`, change:
```typescript
function getFirebaseApp(): App {
```
to:
```typescript
export function getFirebaseApp(): App {
```
(No other change to this file — `setRole`/`getRole`/`revokeRole` already work and already call `getFirebaseApp()` internally.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@clube/firebase-utils`
Expected: PASS (2/2)

- [ ] **Step 5: Add `FIREBASE_PROJECT_ID`/`FIREBASE_SERVICE_ACCOUNT` to the BFF's env validation**

In `apps/bff/src/shared/env.ts`, add to the `server` object (after `DATABASE_URL`):
```typescript
    DATABASE_URL: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_SERVICE_ACCOUNT: z.string().min(1),
```

- [ ] **Step 6: Add the same keys to `apps/bff/.env.example`**

Append to `apps/bff/.env.example`:
```bash
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=
```

- [ ] **Step 7: Add new dependencies to `apps/bff/package.json`**

Add to `dependencies`:
```json
    "@clube/firebase-utils": "*",
    "@clube/shared-types": "*",
    "@sinclair/typebox": "^0.32.35",
```
(Alphabetical position: `@clube/db-client`, `@clube/fastify-plugins`, `@clube/firebase-utils`, `@clube/shared-types`, `@sinclair/typebox`, `@t3-oss/env-core`, ...)

- [ ] **Step 8: Write the failing test for `getFirebaseAdmin`**

Create `apps/bff/src/infrastructure/external/firebase/admin.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'

const { getFirebaseApp } = vi.hoisted(() => ({
  getFirebaseApp: vi.fn(),
}))

vi.mock('@clube/firebase-utils', () => ({ getFirebaseApp }))

describe('getFirebaseAdmin', () => {
  it('delegates to @clube/firebase-utils getFirebaseApp', async () => {
    const fakeApp = { name: '[DEFAULT]' }
    getFirebaseApp.mockReturnValue(fakeApp)

    const { getFirebaseAdmin } = await import('./admin')
    const app = getFirebaseAdmin()

    expect(app).toBe(fakeApp)
    expect(getFirebaseApp).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 9: Run test to verify it fails**

Run: `npm install && npm run test --workspace=apps/bff -- admin.test.ts`
Expected: FAIL — `Cannot find module './admin'`

- [ ] **Step 10: Implement `getFirebaseAdmin`**

Create `apps/bff/src/infrastructure/external/firebase/admin.ts`:

```typescript
import { getFirebaseApp } from '@clube/firebase-utils'
import type { App } from 'firebase-admin/app'

// Delegates to @clube/firebase-utils's singleton initializer instead of
// calling initializeApp() again here — firebase-admin throws if a second
// caller tries to initialize the default app independently.
export function getFirebaseAdmin(): App {
  return getFirebaseApp()
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- admin.test.ts`
Expected: PASS

- [ ] **Step 12: Verify the whole BFF suite and typecheck still pass**

Run: `npm run test --workspace=apps/bff && npm run typecheck --workspace=apps/bff`
Expected: all PASS (this worktree's root `.env` already has a placeholder `FIREBASE_SERVICE_ACCOUNT`/`FIREBASE_PROJECT_ID` — confirmed working before this plan was written)

- [ ] **Step 13: Commit**

```bash
git add packages/firebase-utils/src/index.ts packages/firebase-utils/src/index.test.ts apps/bff/src/shared/env.ts apps/bff/.env.example apps/bff/package.json apps/bff/src/infrastructure/external/firebase/admin.ts apps/bff/src/infrastructure/external/firebase/admin.test.ts package-lock.json
git commit -m "feat: expose Firebase Admin SDK initializer and validate its env vars in the BFF"
```

---

### Task 2: Real JWT validation + correct auth status codes

**Files:**
- Modify: `packages/fastify-plugins/src/tenant-auth.ts`
- Modify: `packages/fastify-plugins/src/tenant-auth.test.ts`
- Modify: `packages/fastify-plugins/src/guards.ts`
- Modify: `packages/fastify-plugins/src/guards.test.ts`
- Modify: `packages/fastify-plugins/package.json`

**Interfaces:**
- Modifies: `createTenantAuthPreHandler` internals only — signature unchanged, still `(resolveTenant: ResolveTenant) => preHandler`. `guard()` internals only — `requireAuth`/`requireSubscriber`/etc. keep their current exported names and allowed-role lists.

- [ ] **Step 1: Add `@clube/firebase-utils` as a dependency of `packages/fastify-plugins`**

In `packages/fastify-plugins/package.json`, add to `dependencies`:
```json
    "@clube/firebase-utils": "*",
```
(alongside the existing `@clube/shared-types`, `firebase-admin`, `fastify` entries — keep alphabetical)

- [ ] **Step 2: Write the failing tests for expired/invalid token handling**

Add to `packages/fastify-plugins/src/tenant-auth.test.ts`, inside the existing `describe('createTenantAuthPreHandler', ...)` block (after the last existing `it`, before the closing `})`):

```typescript
  it('replies 401 with TOKEN_EXPIRED when the token is expired', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Firebase ID token has expired'), {
        code: 'auth/id-token-expired',
      }),
    )
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = {
      headers: {
        host: 'soupescador.clube.com.br',
        authorization: 'Bearer expired-token',
      },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
    })
    expect(request.user).toBeUndefined()
  })

  it('replies 401 with INVALID_TOKEN for any other verification failure', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Decoding Firebase ID token failed'), {
        code: 'auth/argument-error',
      }),
    )
    const tenant = { id: '1', slug: 'soupescador' }
    const preHandler = createTenantAuthPreHandler(async () => tenant)
    const request = {
      headers: {
        host: 'soupescador.clube.com.br',
        authorization: 'Bearer malformed-token',
      },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    })
    expect(request.user).toBeUndefined()
  })
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test --workspace=packages/fastify-plugins -- tenant-auth.test.ts`
Expected: FAIL — both new tests fail because the rejected promise currently propagates uncaught out of the preHandler (unhandled rejection), rather than being caught and turned into a 401.

- [ ] **Step 4: Implement real JWT verification with distinct error handling**

Replace `packages/fastify-plugins/src/tenant-auth.ts` in full:

```typescript
import { getFirebaseApp } from '@clube/firebase-utils'
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
    const allowSlugHeader = process.env.NODE_ENV !== 'production'
    const slugHeader = request.headers['x-tenant-slug']
    const host = request.headers.host ?? ''
    const domain =
      allowSlugHeader && typeof slugHeader === 'string' && slugHeader.length > 0
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
      try {
        const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token)
        request.user = {
          uid: decoded.uid,
          role: (decoded.role as Role) ?? 'user',
          tenant_id: (decoded.tenant_id as string) ?? null,
        }
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code === 'auth/id-token-expired') {
          reply.status(401).send({
            error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
          })
          return
        }
        reply.status(401).send({
          error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
        })
        return
      }
    }
  }
}
```

(Two changes from the previous version: `getAuth()` → `getAuth(getFirebaseApp())` so verification no longer depends on some other module having called `initializeApp()` first; and the whole `verifyIdToken` call is now wrapped in `try/catch`, branching on Firebase's `auth/id-token-expired` error code.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test --workspace=packages/fastify-plugins -- tenant-auth.test.ts`
Expected: PASS — all 6 tests (4 existing + 2 new)

- [ ] **Step 6: Write the failing test for the 401-vs-403 distinction in guards**

Add to `packages/fastify-plugins/src/guards.test.ts`, inside the existing `describe('guards', ...)` block:

```typescript
  it('requireSubscriber replies 401 when there is no authenticated user at all', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    })
  })

  it('requireSubscriber replies 403 (not 401) when a valid user has the wrong role', async () => {
    const reply = createMockReply()
    await requireSubscriber(createRequestWithRole('user'), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    })
  })
```

Note: the existing test `requireSuperAdmin rejects a missing role` currently asserts `403` for a missing role — this needs updating too, since a *missing* role means no authenticated user, which per the new contract is `401`, not `403`. Change it from:
```typescript
  it('requireSuperAdmin rejects a missing role', async () => {
    const reply = createMockReply()
    await requireSuperAdmin(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })
```
to:
```typescript
  it('requireSuperAdmin rejects a missing role with 401', async () => {
    const reply = createMockReply()
    await requireSuperAdmin(createRequestWithRole(undefined), reply)
    expect(reply.status).toHaveBeenCalledWith(401)
  })
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `npm run test --workspace=packages/fastify-plugins -- guards.test.ts`
Expected: FAIL — the updated/new tests expect `401` but the current `guard()` always sends `403`.

- [ ] **Step 8: Implement the 401-vs-403 distinction**

Replace `packages/fastify-plugins/src/guards.ts` in full:

```typescript
import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'

function guard(...allowedRoles: Role[]) {
  return async function guardPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.user) {
      reply.status(401).send({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      })
      return
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      })
      return
    }
  }
}

export const requireSuperAdmin = guard('super_admin')

export const requireOwner = guard('store_owner', 'super_admin')

export const requireManager = guard(
  'store_manager',
  'store_owner',
  'super_admin',
)

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

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm run test --workspace=packages/fastify-plugins -- guards.test.ts`
Expected: PASS — all 6 tests (4 existing, one updated, one new... actually: original 4 + 2 new = 6, with 1 of the original 4 modified in place)

- [ ] **Step 10: Full package verification**

Run: `npm install && npm run test --workspace=packages/fastify-plugins && npm run typecheck --workspace=packages/fastify-plugins`
Expected: all PASS

- [ ] **Step 11: Commit**

```bash
git add packages/fastify-plugins package-lock.json
git commit -m "fix: verify Firebase tokens via the shared app instance and return 401/403 correctly"
```

---

### Task 3: `tenants.users` schema, domain entity, interface, migration

**Files:**
- Modify: `apps/bff/src/infrastructure/db/schema/tenants.ts`
- Modify: `apps/bff/src/infrastructure/db/schema/index.ts`
- Create: `apps/bff/src/domain/entities/user.ts`
- Create: `apps/bff/src/domain/entities/user.test.ts`
- Create: `apps/bff/src/domain/interfaces/IUserRepository.ts`
- Generated: `apps/bff/src/infrastructure/db/migrations/0001_*.sql` (+ RLS hand-edit)

**Interfaces:**
- Produces: `users` Drizzle table, `User` entity (`id, tenantId, uid, role: Role, createdAt`), `IUserRepository` (`findByUid(uid, tenantId): Promise<User | null>`, `create(data: CreateUserDto): Promise<User>`), `CreateUserDto = { tenantId: string; uid: string; role: Role }`. Consumed by Task 4 (`UserRepository`) and Task 5 (usecases).

- [ ] **Step 1: Write the failing entity test**

Create `apps/bff/src/domain/entities/user.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { User } from './user'

describe('User', () => {
  it('exposes all props through getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const user = User.create({
      id: 'user-1',
      tenantId: 'tenant-1',
      uid: 'firebase-uid-1',
      role: 'user',
      createdAt,
    })

    expect(user.id).toBe('user-1')
    expect(user.tenantId).toBe('tenant-1')
    expect(user.uid).toBe('firebase-uid-1')
    expect(user.role).toBe('user')
    expect(user.createdAt).toBe(createdAt)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/bff -- user.test.ts`
Expected: FAIL — `Cannot find module './user'`

- [ ] **Step 3: Implement the entity**

Create `apps/bff/src/domain/entities/user.ts`:

```typescript
import type { Role } from '@clube/shared-types'

export type UserProps = {
  id: string
  tenantId: string
  uid: string
  role: Role
  createdAt: Date
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get uid(): string {
    return this.props.uid
  }

  get role(): Role {
    return this.props.role
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- user.test.ts`
Expected: PASS

- [ ] **Step 5: Create the repository interface**

Create `apps/bff/src/domain/interfaces/IUserRepository.ts`:

```typescript
import type { Role } from '@clube/shared-types'
import type { User } from '../entities/user'

export type CreateUserDto = {
  tenantId: string
  uid: string
  role: Role
}

export interface IUserRepository {
  findByUid(uid: string, tenantId: string): Promise<User | null>
  create(data: CreateUserDto): Promise<User>
}
```

- [ ] **Step 6: Add the `users` table to the Drizzle schema**

In `apps/bff/src/infrastructure/db/schema/tenants.ts`, add after the existing `templateIdEnum` declaration:

```typescript
// Mirrors @clube/shared-types's Role union — keep both in sync.
export const userRoleEnum = tenantsSchema.enum('user_role', [
  'super_admin',
  'store_owner',
  'store_manager',
  'community_mod',
  'subscriber',
  'user',
])
```

And after the `domains` table declaration (before `landingConfigs`), add:

```typescript
export const users = tenantsSchema.table(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    uid: text('uid').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uidTenantIdx: uniqueIndex('users_uid_tenant_idx').on(
      table.uid,
      table.tenantId,
    ),
  }),
)
```

- [ ] **Step 7: Update `schema/index.ts` to include `users`**

Replace `apps/bff/src/infrastructure/db/schema/index.ts`:

```typescript
export * from './tenants'

import { domains, landingConfigs, tenants, users } from './tenants'

export const schema = {
  tenants,
  domains,
  landingConfigs,
  users,
}
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck --workspace=apps/bff`
Expected: clean

- [ ] **Step 9: Generate the migration**

Run: `cd apps/bff && npx drizzle-kit generate && cd ../..`
Expected: creates a new `apps/bff/src/infrastructure/db/migrations/0001_<name>.sql` (drizzle-kit diffs against the existing `0000_round_infant_terrible.sql` snapshot, so this one should contain only the new `user_role` enum, the `users` table, its FK, and its unique index). Run `ls apps/bff/src/infrastructure/db/migrations/*.sql` to get the exact filename.

- [ ] **Step 10: Append RLS to the generated migration**

Open the generated `0001_*.sql` file and append at the end:

```sql
--> statement-breakpoint
-- Same rationale as the 0000 migration: current_setting uses
-- missing_ok=true because nothing sets app.tenant_id yet, and the
-- superuser connection bypasses RLS regardless.
ALTER TABLE "tenants"."users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants"."users"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

- [ ] **Step 11: Apply the migration to the remote dev database**

Run: `cd apps/bff && npx drizzle-kit migrate && cd ../..`
Expected: no errors.

- [ ] **Step 12: Verify the table exists**

Run:
```bash
node -e "
require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(\"select table_name from information_schema.tables where table_schema = 'tenants' order by table_name\");
  console.log(res.rows);
  const rls = await client.query(\"select relname, relrowsecurity from pg_class where relnamespace = 'tenants'::regnamespace and relkind = 'r' order by relname\");
  console.log(rls.rows);
  await client.end();
})();
"
```
Expected: table list now includes `{ table_name: 'users' }` alongside the existing three; RLS list shows `{ relname: 'users', relrowsecurity: true }`.

- [ ] **Step 13: Commit**

```bash
git add apps/bff/src/domain/entities/user.ts apps/bff/src/domain/entities/user.test.ts apps/bff/src/domain/interfaces/IUserRepository.ts apps/bff/src/infrastructure/db/schema apps/bff/src/infrastructure/db/migrations
git commit -m "feat(bff): add tenants.users table, User entity, and IUserRepository"
```

---

### Task 4: `UserRepository` implementation + integration test

**Files:**
- Create: `apps/bff/src/infrastructure/db/repositories/user.repository.ts`
- Create: `apps/bff/src/infrastructure/db/repositories/__tests__/user.repository.test.ts`

**Interfaces:**
- Consumes: `User`, `IUserRepository`/`CreateUserDto` (Task 3), `schema`/`users`/`tenants` (Task 3).
- Produces: `UserRepository` class implementing `IUserRepository`, constructor `(db: NodePgDatabase<typeof schema>)`. Consumed by Task 5's usecases via Task 6's `container.ts`.

**Prerequisite:** Docker daemon running locally (same testcontainers setup as the previous plan's `tenant.repository.test.ts`).

- [ ] **Step 1: Write the failing integration test**

Create `apps/bff/src/infrastructure/db/repositories/__tests__/user.repository.test.ts`:

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
import { tenants } from '../../schema/tenants'
import { UserRepository } from '../user.repository'

describe('UserRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: UserRepository
  let tenantId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new UserRepository(db)

    const [tenant] = await db
      .insert(tenants)
      .values({ slug: 'dev', name: 'Dev Tenant', ownerUid: 'owner-1' })
      .returning()

    tenantId = tenant.id
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a user and finds it by uid + tenant', async () => {
    const created = await repository.create({
      tenantId,
      uid: 'firebase-uid-1',
      role: 'user',
    })

    const found = await repository.findByUid('firebase-uid-1', tenantId)

    expect(found?.id).toBe(created.id)
    expect(found?.uid).toBe('firebase-uid-1')
    expect(found?.role).toBe('user')
    expect(found?.tenantId).toBe(tenantId)
  })

  it('returns null when the uid does not exist for the tenant', async () => {
    const found = await repository.findByUid('unknown-uid', tenantId)
    expect(found).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/bff -- user.repository.test.ts`
Expected: FAIL — `Cannot find module '../user.repository'`

- [ ] **Step 3: Implement the repository**

Create `apps/bff/src/infrastructure/db/repositories/user.repository.ts`:

```typescript
import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { User } from '../../../domain/entities/user'
import type {
  CreateUserDto,
  IUserRepository,
} from '../../../domain/interfaces/IUserRepository'
import type { schema } from '../schema'
import { users } from '../schema/tenants'

type UserRow = typeof users.$inferSelect

function toDomain(row: UserRow): User {
  return User.create({
    id: row.id,
    tenantId: row.tenantId,
    uid: row.uid,
    role: row.role,
    createdAt: row.createdAt,
  })
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByUid(uid: string, tenantId: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.uid, uid), eq(users.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateUserDto): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        tenantId: data.tenantId,
        uid: data.uid,
        role: data.role,
      })
      .returning()

    return toDomain(row as UserRow)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- user.repository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/infrastructure/db/repositories/user.repository.ts apps/bff/src/infrastructure/db/repositories/__tests__/user.repository.test.ts
git commit -m "feat(bff): implement UserRepository with testcontainers integration test"
```

---

### Task 5: `RegisterUserUseCase` + `GetMeUseCase`

**Files:**
- Create: `apps/bff/src/domain/errors/user-already-registered.error.ts`
- Create: `apps/bff/src/domain/errors/user-already-registered.error.test.ts`
- Create: `apps/bff/src/application/tenants/register-user.usecase.ts`
- Create: `apps/bff/src/application/tenants/register-user.usecase.test.ts`
- Create: `apps/bff/src/application/tenants/get-me.usecase.ts`
- Create: `apps/bff/src/application/tenants/get-me.usecase.test.ts`

**Interfaces:**
- Consumes: `IUserRepository` (Task 3), `UserRepository` (Task 4, via Task 6's `container.ts` — these usecases only depend on the interface), `setRole` (`@clube/firebase-utils`), `DomainError` (existing, `apps/bff/src/domain/errors/domain-error.ts`).
- Produces: `RegisterUserUseCase` (`.execute({uid, tenantId}): Promise<User>`), `GetMeUseCase` (`.execute({uid, tenantId, role}): Promise<GetMeResult>` where `GetMeResult = {uid, role, tenantId, registeredAt: Date | null}`). Consumed by Task 6.

- [ ] **Step 1: Write the failing error test**

Create `apps/bff/src/domain/errors/user-already-registered.error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'
import { UserAlreadyRegisteredError } from './user-already-registered.error'

describe('UserAlreadyRegisteredError', () => {
  it('carries the right code and status', () => {
    const error = new UserAlreadyRegisteredError('firebase-uid-1')

    expect(error.message).toBe('User firebase-uid-1 is already registered')
    expect(error.code).toBe('USER_ALREADY_REGISTERED')
    expect(error.statusCode).toBe(409)
    expect(error).toBeInstanceOf(DomainError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/bff -- user-already-registered.error.test.ts`
Expected: FAIL — `Cannot find module './user-already-registered.error'`

- [ ] **Step 3: Implement the error**

Create `apps/bff/src/domain/errors/user-already-registered.error.ts`:

```typescript
import { DomainError } from './domain-error'

export class UserAlreadyRegisteredError extends DomainError {
  constructor(uid: string) {
    super(`User ${uid} is already registered`, 'USER_ALREADY_REGISTERED', 409)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/bff -- user-already-registered.error.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing `RegisterUserUseCase` tests**

Create `apps/bff/src/application/tenants/register-user.usecase.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'

const { setRole } = vi.hoisted(() => ({ setRole: vi.fn() }))
vi.mock('@clube/firebase-utils', () => ({ setRole }))

import { User } from '../../domain/entities/user'
import { UserAlreadyRegisteredError } from '../../domain/errors/user-already-registered.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { RegisterUserUseCase } from './register-user.usecase'

function fakeUser(): User {
  return User.create({
    id: 'user-1',
    tenantId: 'tenant-1',
    uid: 'firebase-uid-1',
    role: 'user',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('RegisterUserUseCase', () => {
  it('creates the user and sets the Firebase role', async () => {
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(fakeUser()),
    }
    const useCase = new RegisterUserUseCase(repository)

    const user = await useCase.execute({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
    })

    expect(user.uid).toBe('firebase-uid-1')
    expect(repository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'firebase-uid-1',
      role: 'user',
    })
    expect(setRole).toHaveBeenCalledWith('firebase-uid-1', 'user', 'tenant-1')
  })

  it('throws UserAlreadyRegisteredError when the uid is already registered for the tenant', async () => {
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(fakeUser()),
      create: vi.fn(),
    }
    const useCase = new RegisterUserUseCase(repository)

    await expect(
      useCase.execute({ uid: 'firebase-uid-1', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(UserAlreadyRegisteredError)
    expect(repository.create).not.toHaveBeenCalled()
    expect(setRole).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm run test --workspace=apps/bff -- register-user.usecase.test.ts`
Expected: FAIL — `Cannot find module './register-user.usecase'`

- [ ] **Step 7: Implement `RegisterUserUseCase`**

Create `apps/bff/src/application/tenants/register-user.usecase.ts`:

```typescript
import { setRole } from '@clube/firebase-utils'
import type { User } from '../../domain/entities/user'
import { UserAlreadyRegisteredError } from '../../domain/errors/user-already-registered.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'

export type RegisterUserInput = {
  uid: string
  tenantId: string
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existing = await this.userRepository.findByUid(
      input.uid,
      input.tenantId,
    )
    if (existing) {
      throw new UserAlreadyRegisteredError(input.uid)
    }

    const user = await this.userRepository.create({
      tenantId: input.tenantId,
      uid: input.uid,
      role: 'user',
    })

    await setRole(input.uid, 'user', input.tenantId)

    return user
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test --workspace=apps/bff -- register-user.usecase.test.ts`
Expected: PASS

- [ ] **Step 9: Write the failing `GetMeUseCase` tests**

Create `apps/bff/src/application/tenants/get-me.usecase.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { User } from '../../domain/entities/user'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { GetMeUseCase } from './get-me.usecase'

describe('GetMeUseCase', () => {
  it('returns uid/role/tenantId plus the registration date when a user record exists', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(
        User.create({
          id: 'user-1',
          tenantId: 'tenant-1',
          uid: 'firebase-uid-1',
          role: 'user',
          createdAt,
        }),
      ),
      create: vi.fn(),
    }
    const useCase = new GetMeUseCase(repository)

    const result = await useCase.execute({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
      role: 'user',
    })

    expect(result).toEqual({
      uid: 'firebase-uid-1',
      role: 'user',
      tenantId: 'tenant-1',
      registeredAt: createdAt,
    })
  })

  it('returns registeredAt null when no user record exists yet', async () => {
    const repository: IUserRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    }
    const useCase = new GetMeUseCase(repository)

    const result = await useCase.execute({
      uid: 'firebase-uid-2',
      tenantId: 'tenant-1',
      role: 'super_admin',
    })

    expect(result.registeredAt).toBeNull()
    expect(result.role).toBe('super_admin')
  })
})
```

- [ ] **Step 10: Run tests to verify they fail**

Run: `npm run test --workspace=apps/bff -- get-me.usecase.test.ts`
Expected: FAIL — `Cannot find module './get-me.usecase'`

- [ ] **Step 11: Implement `GetMeUseCase`**

Create `apps/bff/src/application/tenants/get-me.usecase.ts`:

```typescript
import type { Role } from '@clube/shared-types'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'

export type GetMeInput = {
  uid: string
  tenantId: string
  role: Role
}

export type GetMeResult = {
  uid: string
  role: Role
  tenantId: string
  registeredAt: Date | null
}

export class GetMeUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetMeInput): Promise<GetMeResult> {
    const user = await this.userRepository.findByUid(
      input.uid,
      input.tenantId,
    )

    return {
      uid: input.uid,
      role: input.role,
      tenantId: input.tenantId,
      registeredAt: user?.createdAt ?? null,
    }
  }
}
```

- [ ] **Step 12: Run tests to verify they pass**

Run: `npm run test --workspace=apps/bff -- get-me.usecase.test.ts`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add apps/bff/src/domain/errors/user-already-registered.error.ts apps/bff/src/domain/errors/user-already-registered.error.test.ts apps/bff/src/application
git commit -m "feat(bff): add RegisterUserUseCase and GetMeUseCase"
```

---

### Task 6: Auth routes + wiring into `app.ts`

**Files:**
- Create: `apps/bff/src/infrastructure/http/schemas/auth.ts`
- Create: `apps/bff/src/infrastructure/http/routes/auth.ts`
- Create: `apps/bff/src/infrastructure/http/routes/auth.test.ts`
- Modify: `apps/bff/src/infrastructure/http/container.ts`
- Modify: `apps/bff/src/app.ts`

**Interfaces:**
- Consumes: `tenantAuthPreHandler` (existing, `container.ts`), `requireAuth` (existing, `proxy.ts` re-export), `RegisterUserUseCase`/`GetMeUseCase` (Task 5), `UserRepository` (Task 4).
- Produces: `registerAuthRoutes(app: FastifyInstance, deps: AuthRouteDeps): Promise<void>` where `AuthRouteDeps = { tenantAuthPreHandler, requireAuth, registerUserUseCase: RegisterUserUseCase, getMeUseCase: GetMeUseCase }`.

- [ ] **Step 1: Create the TypeBox response schemas**

Create `apps/bff/src/infrastructure/http/schemas/auth.ts`:

```typescript
import { Type } from '@sinclair/typebox'

export const RegisterUserResponseSchema = Type.Object({
  id: Type.String(),
  tenantId: Type.String(),
  uid: Type.String(),
  role: Type.String(),
  createdAt: Type.String(),
})

export const MeResponseSchema = Type.Object({
  uid: Type.String(),
  role: Type.String(),
  tenantId: Type.String(),
  registeredAt: Type.Union([Type.String(), Type.Null()]),
})
```

- [ ] **Step 2: Write the failing route tests**

Create `apps/bff/src/infrastructure/http/routes/auth.test.ts`:

```typescript
import Fastify, { type FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { GetMeUseCase } from '../../../application/tenants/get-me.usecase'
import type { RegisterUserUseCase } from '../../../application/tenants/register-user.usecase'
import { type AuthRouteDeps, registerAuthRoutes } from './auth'

function buildTestApp(overrides: Partial<AuthRouteDeps> = {}) {
  const app = Fastify()
  const deps: AuthRouteDeps = {
    tenantAuthPreHandler: async (request: FastifyRequest) => {
      request.tenant = { id: 'tenant-1', slug: 'dev' }
    },
    requireAuth: async (request: FastifyRequest) => {
      request.user = { uid: 'firebase-uid-1', role: 'user', tenant_id: 'tenant-1' }
    },
    registerUserUseCase: {
      execute: vi.fn().mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        uid: 'firebase-uid-1',
        role: 'user',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as unknown as RegisterUserUseCase,
    getMeUseCase: {
      execute: vi.fn().mockResolvedValue({
        uid: 'firebase-uid-1',
        role: 'user',
        tenantId: 'tenant-1',
        registeredAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as unknown as GetMeUseCase,
    ...overrides,
  }
  return { app, deps }
}

describe('auth routes', () => {
  it('POST /v1/auth/register returns the created user', async () => {
    const { app, deps } = buildTestApp()
    await registerAuthRoutes(app, deps)

    const response = await app.inject({ method: 'POST', url: '/v1/auth/register' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: 'user-1',
      tenantId: 'tenant-1',
      uid: 'firebase-uid-1',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(deps.registerUserUseCase.execute).toHaveBeenCalledWith({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
    })
  })

  it('GET /v1/auth/me returns uid, role, tenantId and registeredAt', async () => {
    const { app, deps } = buildTestApp()
    await registerAuthRoutes(app, deps)

    const response = await app.inject({ method: 'GET', url: '/v1/auth/me' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      uid: 'firebase-uid-1',
      role: 'user',
      tenantId: 'tenant-1',
      registeredAt: '2026-01-01T00:00:00.000Z',
    })
    expect(deps.getMeUseCase.execute).toHaveBeenCalledWith({
      uid: 'firebase-uid-1',
      tenantId: 'tenant-1',
      role: 'user',
    })
  })

  it('does not call the usecase when requireAuth rejects the request', async () => {
    const { app, deps } = buildTestApp({
      requireAuth: async (_request, reply) => {
        reply.status(401).send({
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        })
      },
    })
    await registerAuthRoutes(app, deps)

    const response = await app.inject({ method: 'GET', url: '/v1/auth/me' })

    expect(response.statusCode).toBe(401)
    expect(deps.getMeUseCase.execute).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test --workspace=apps/bff -- auth.test.ts`
Expected: FAIL — `Cannot find module './auth'` (the routes/ directory doesn't exist yet)

- [ ] **Step 4: Implement the routes with explicit dependency injection**

Create `apps/bff/src/infrastructure/http/routes/auth.ts`:

```typescript
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { GetMeUseCase } from '../../../application/tenants/get-me.usecase'
import type { RegisterUserUseCase } from '../../../application/tenants/register-user.usecase'
import { MeResponseSchema, RegisterUserResponseSchema } from '../schemas/auth'

export type AuthRouteDeps = {
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  registerUserUseCase: RegisterUserUseCase
  getMeUseCase: GetMeUseCase
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  deps: AuthRouteDeps,
): Promise<void> {
  app.post(
    '/v1/auth/register',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: RegisterUserResponseSchema } },
    },
    async (request, reply) => {
      const user = await deps.registerUserUseCase.execute({
        uid: request.user!.uid,
        tenantId: request.tenant!.id,
      })

      reply.status(200).send({
        id: user.id,
        tenantId: user.tenantId,
        uid: user.uid,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      })
    },
  )

  app.get(
    '/v1/auth/me',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: MeResponseSchema } },
    },
    async (request, reply) => {
      const result = await deps.getMeUseCase.execute({
        uid: request.user!.uid,
        tenantId: request.tenant!.id,
        role: request.user!.role,
      })

      reply.status(200).send({
        uid: result.uid,
        role: result.role,
        tenantId: result.tenantId,
        registeredAt: result.registeredAt?.toISOString() ?? null,
      })
    },
  )
}
```

(The non-null assertions on `request.user!`/`request.tenant!` are safe: both preHandlers run first in the chain and `reply.send()` short-circuits Fastify's handler chain on failure, so the route body only ever runs once both are guaranteed set.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test --workspace=apps/bff -- auth.test.ts`
Expected: PASS

- [ ] **Step 6: Wire real dependencies into `container.ts`**

Replace `apps/bff/src/infrastructure/http/container.ts`:

```typescript
import { createTenantAuthPreHandler } from '@clube/fastify-plugins'
import { GetMeUseCase } from '../../application/tenants/get-me.usecase'
import { RegisterUserUseCase } from '../../application/tenants/register-user.usecase'
import { db } from '../db'
import { TenantRepository } from '../db/repositories/tenant.repository'
import { UserRepository } from '../db/repositories/user.repository'
import { createResolveTenant } from './proxy'

const tenantRepository = new TenantRepository(db)
const userRepository = new UserRepository(db)

export const tenantAuthPreHandler = createTenantAuthPreHandler(
  createResolveTenant(tenantRepository),
)

export const registerUserUseCase = new RegisterUserUseCase(userRepository)
export const getMeUseCase = new GetMeUseCase(userRepository)
```

- [ ] **Step 7: Register the routes in `app.ts`**

Replace `apps/bff/src/app.ts`:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  getMeUseCase,
  registerUserUseCase,
  tenantAuthPreHandler,
} from './infrastructure/http/container'
import { requireAuth } from './infrastructure/http/proxy'
import { registerAuthRoutes } from './infrastructure/http/routes/auth'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube BFF')
  await registerHealth(app)
  await registerAuthRoutes(app, {
    tenantAuthPreHandler,
    requireAuth,
    registerUserUseCase,
    getMeUseCase,
  })

  return app
}
```

- [ ] **Step 8: Run the full BFF suite and typecheck**

Run: `npm run test --workspace=apps/bff && npm run typecheck --workspace=apps/bff`
Expected: all PASS, including the pre-existing `app.test.ts` (`/health` is unaffected by the new routes)

- [ ] **Step 9: Commit**

```bash
git add apps/bff/src/infrastructure/http apps/bff/src/app.ts
git commit -m "feat(bff): add POST /v1/auth/register and GET /v1/auth/me routes"
```

---

### Task 7: `seed-super-admin.ts` script

**Files:**
- Create: `apps/bff/scripts/seed-super-admin.ts`
- Modify: `apps/bff/package.json`

**Interfaces:**
- Consumes: `setRole` (`@clube/firebase-utils`).

- [ ] **Step 1: Add the convenience npm script**

In `apps/bff/package.json`'s `"scripts"` block (alongside the existing `"seed"` entry):
```json
    "seed:super-admin": "tsx scripts/seed-super-admin.ts"
```

- [ ] **Step 2: Write the script**

Create `apps/bff/scripts/seed-super-admin.ts`:

```typescript
import { resolve } from 'node:path'
import { setRole } from '@clube/firebase-utils'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../../../.env') })

async function main(): Promise<void> {
  const uid = process.argv[2]

  if (!uid) {
    console.error('Uso: npx tsx scripts/seed-super-admin.ts <uid>')
    process.exit(1)
  }

  await setRole(uid, 'super_admin')

  console.log(`Role 'super_admin' atribuída ao usuário ${uid}.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falha ao atribuir role super_admin:', error)
    process.exit(1)
  })
```

- [ ] **Step 3: Typecheck (this file is covered by the existing `tsconfig.scripts.json`, whose `include: ["scripts", ...]` already sweeps up every file under `scripts/`)**

Run: `npm run typecheck --workspace=apps/bff`
Expected: clean

- [ ] **Step 4: Verify the missing-argument path**

Run: `cd apps/bff && npx tsx scripts/seed-super-admin.ts && cd ../..`
Expected: prints `Uso: npx tsx scripts/seed-super-admin.ts <uid>` and exits 1 (this worktree's placeholder Firebase credential means an actual `setRole` call against a real uid would hit the network and fail against the fake project — this argument-validation path is what's mechanically verifiable here; note this limitation in the commit/report rather than attempting a real `setRole` call)

- [ ] **Step 5: Commit**

```bash
git add apps/bff/scripts/seed-super-admin.ts apps/bff/package.json
git commit -m "feat(bff): add seed-super-admin script"
```

---

### Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full build, typecheck, test, lint across the monorepo**

Run:
```bash
npm run build
npm run typecheck
npm run test
npm run lint
```
Expected: all green. This confirms the `packages/fastify-plugins` changes (Task 2) didn't break any of the other six services' `proxy.ts` stubs (they all call `createTenantAuthPreHandler`/the guards with the same unchanged signatures).

- [ ] **Step 2: Boot the BFF dev server and exercise the status-code contract**

Run: `npm run dev --workspace=apps/bff` (background)
Then:
```bash
curl -s http://localhost:3004/health
curl -s -o /dev/null -w "%{http_code}\n" -X GET http://localhost:3004/v1/auth/me -H "x-tenant-slug: dev"
curl -s -X GET http://localhost:3004/v1/auth/me -H "x-tenant-slug: dev"
curl -s -o /dev/null -w "%{http_code}\n" -X GET http://localhost:3004/v1/auth/me -H "x-tenant-slug: dev" -H "Authorization: Bearer not-a-real-token"
```
Expected:
- `/health` → `{"status":"ok"}`
- `GET /v1/auth/me` with no `Authorization` header → `401` (no token → `requireAuth`'s `UNAUTHENTICATED` branch, since `request.user` was never set)
- Same request body → `{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}`
- `GET /v1/auth/me` with a garbage Bearer token → `401` (this exercises the real `getAuth(getFirebaseApp()).verifyIdToken` call against the placeholder Firebase project, which will reject a garbage token as invalid — expect `INVALID_TOKEN`, not a 500; this is the one part of the acceptance criteria requiring a live-ish Firebase Admin SDK call, and it's exactly what Task 2 built)

- [ ] **Step 3: Stop the dev server**

Stop the process started in Step 2.

- [ ] **Step 4: Confirm `verify:infra` still passes**

Run: `npm run verify:infra`
Expected: `Postgres: OK` / `Redis: OK`

No commit for this task — verification only.

---

## Self-Review Notes

- **Spec coverage:** task steps 1-2 map to Task 1 (admin.ts + firebase-utils export + env vars); step 3 ("atualizar proxy.ts para validar JWT real") is implemented in `tenant-auth.ts` instead, since that's where the actual `verifyIdToken` call lives — `apps/bff/proxy.ts` already delegates to it correctly and needs no code change, called out explicitly in Global Constraints; step 4 is Task 5's `RegisterUserUseCase`; step 5 is Task 6's `POST /v1/auth/register`; step 6 is Task 6's `GET /v1/auth/me`; step 7 is Task 7; step 8 ("testes unitários para proxy.ts mockando firebase-admin") is realized as Task 2's expanded `tenant-auth.test.ts`, which already mocks `firebase-admin/auth` — the file that actually contains the JWT logic under test.
- **Resultado esperado coverage:** "sem token → 401" and "token válido de user em rota requireSubscriber → 403" are Task 2's `guards.ts` fix; "token inválido → 401 INVALID_TOKEN" is Task 2's `tenant-auth.ts` fix; "GET /v1/auth/me → {uid, role, tenant_id}" is Task 6 (returns those three plus `registeredAt`, matching the confirmed `tenants.users` design); "seed-super-admin.ts altera o role" is Task 7 (mechanically verifiable only for the argument-validation path in this environment, documented as a limitation, not silently skipped).
- **Type consistency checked:** `IUserRepository` (Task 3) → `UserRepository` (Task 4) → `RegisterUserUseCase`/`GetMeUseCase` (Task 5) → `container.ts`/`routes/auth.ts` (Task 6) — method names (`findByUid`, `create`) and the `CreateUserDto`/`GetMeInput`/`GetMeResult` shapes match across all tasks.
- **No placeholders:** every step has complete, runnable code — confirmed on final pass.
