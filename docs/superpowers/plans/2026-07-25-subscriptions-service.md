# Subscriptions Service (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `services/subscriptions` end-to-end following Clean Architecture — plans, subscribers, XP/levels, Asaas checkout, and webhook-driven activation via BullMQ — then wire the BFF to delegate `/v1/subscriptions/*` to it. This is Fase 2 of the roadmap ("Assinaturas (Asaas + webhook + BullMQ → subscriber)"), the first real business logic on top of Fase 0's empty scaffold and Fase 1's BFF auth/RBAC work.

**Architecture:** Same layering already established in `apps/bff` (domain entities/interfaces/errors → application usecases → infrastructure repositories/http/queue). One material deviation from the BFF pattern: `services/subscriptions` does **not** do host-based tenant resolution (`createTenantAuthPreHandler`) because it doesn't own the `tenants` table and CLAUDE.md forbids cross-service DB access. Instead it gets a new, smaller `createFirebaseAuthPreHandler` (JWT verification only, no tenant lookup) added to `@clube/fastify-plugins`, and trusts `tenant_id` from the verified JWT's custom claims — exactly what `apps/bff` already put there. The BFF's new `/v1/subscriptions/*` routes are thin proxies: they forward the client's `Authorization` header and body to `services/subscriptions` over HTTP and pass the response through, so end-user auth is verified independently by each service (no shared-trust headers to invent or secure).

**Tech Stack:** Drizzle ORM + `drizzle-kit` (new `subscriptions` Postgres schema), BullMQ + ioredis (new to the repo — `REDIS_URL` already provisioned and verified reachable), `@clube/asaas-sdk` (extended with typed customer/subscription methods), `@sinclair/typebox` (route schemas), Vitest + `@testcontainers/postgresql` (repository tests, established pattern).

## Global Constraints

- **`plans` (subscription pricing) and `levels` (XP tiers) are separate tables** — confirmed with the user. `plans` is tenant-scoped (a lojista's R$19,90/mês offering, extensible to other price points later). `levels` is a global, un-tenanted, seeded catalog: Bronze/Prata/Ouro/Diamante/Lenda with `min_xp`, `store_discount_pct`, `cashback_pct` exactly as CLAUDE.md's "Níveis e descontos" table. `GET /v1/subscriptions/plans` returns rows from `plans`, not `levels`.
- **No tenant-table access from this service.** `services/subscriptions` never queries `tenants.*`. Tenant scoping for every route comes from `request.user.tenant_id`, populated by the new `createFirebaseAuthPreHandler` from the already-verified JWT custom claims (same claims `apps/bff` writes via `setRole`). Do not attempt to resolve a `Tenant { id, slug }` object in this service — `services/subscriptions/src/infrastructure/http/proxy.ts` keeps the existing "TODO Fase 1" `resolveTenant` stub file as-is (unused by the new routes) so it stays consistent with the other still-unbuilt sibling services (cashback, store, raffles, tournaments, community).
- **Cashback integration is out of scope for this plan.** CLAUDE.md's roadmap places cashback at phase 7+, and `services/cashback` is still an empty Fase-0 scaffold with no real schema — there is nothing to call yet. `ProcessWebhookUseCase` grants XP and flips role/status on `PAYMENT_CONFIRMED`; it does not call any cashback code. Do not add a cashback call site "for later" — that would be exactly the kind of half-finished stub CLAUDE.md prohibits.
- **Money is stored as integer cents** (`price_cents`), never floats, matching the `Money` value-object mention in CLAUDE.md's Clean Architecture folder layout. Convert to/from reais only at the Asaas API boundary (`value: priceCents / 100`).
- **No `@/*` path aliases** — this repo's `tsx watch`/plain-`tsc`-then-`node` setup doesn't rewrite them at runtime (same constraint already documented and applied in the BFF plans). Use relative imports throughout `services/subscriptions`.
- **`Role` always comes from `@clube/shared-types`** — never redefined locally.
- Webhook route responds `200` immediately and enqueues a BullMQ job; it never calls `ProcessWebhookUseCase` synchronously in the request handler, per CLAUDE.md's explicit webhook rule.
- Every endpoint gets a TypeBox response schema (`@sinclair/typebox`), per CLAUDE.md.
- Tests are colocated (`foo.ts` + `foo.test.ts`) except repository tests, which live in `repositories/__tests__/` matching the established `apps/bff` sibling pattern.
- `DATABASE_URL` and `REDIS_URL` are already provisioned and reachable (`npm run verify:infra` passes as of this plan) — the earlier Cloudflare port-blocking issue is resolved, no infra blocker remains for this work.
- Root `.env` is loaded explicitly in `env.ts`/`drizzle.config.ts` via `dotenv`'s `config({ path: resolve(__dirname, '../../.env') })`, exactly like `apps/bff` — never rely on cwd-relative implicit loading.

---

## File Structure

```
packages/fastify-plugins/
  src/firebase-auth.ts                                              [new: createFirebaseAuthPreHandler]
  src/firebase-auth.test.ts                                         [new]
  src/index.ts                                                      [modify: export createFirebaseAuthPreHandler]

packages/asaas-sdk/
  src/index.ts                                                      [modify: add typed customer/subscription methods + types]
  src/index.test.ts                                                 [modify: add tests for new methods]

services/subscriptions/
  package.json                                                      [modify: add deps]
  .env.example                                                      [modify]
  drizzle.config.ts                                                 [modify: load root .env]
  src/
    shared/env.ts                                                   [modify: DATABASE_URL, REDIS_URL, ASAAS_*, FIREBASE_*]
    domain/
      entities/
        Level.ts                                                    [new]
        Level.test.ts                                                [new]
        Plan.ts                                                      [new]
        Plan.test.ts                                                 [new]
        Subscription.ts                                              [new]
        Subscription.test.ts                                         [new]
      errors/
        index.ts                                                    [new: SubscriptionNotFoundError, PlanNotFoundError, SubscriptionAlreadyActiveError]
        index.test.ts                                                [new]
      interfaces/
        ILevelRepository.ts                                          [new]
        IPlanRepository.ts                                           [new]
        ISubscriptionRepository.ts                                    [new]
    infrastructure/
      db/
        index.ts                                                     [new: db client]
        schema/
          index.ts                                                   [modify: aggregate schema export]
          subscriptions.ts                                           [new: levels, plans, subscribers, xp_events tables]
        migrations/                                                   [generated]
        repositories/
          level.repository.ts                                        [new]
          plan.repository.ts                                          [new]
          subscription.repository.ts                                  [new]
          __tests__/
            level.repository.test.ts                                  [new]
            plan.repository.test.ts                                   [new]
            subscription.repository.test.ts                           [new]
      external/
        asaas/
          client.ts                                                   [new: env-configured AsaasClient singleton]
      queue/
        subscriptions.queue.ts                                        [new: BullMQ Queue producer]
        worker.ts                                                     [new: BullMQ Worker]
      http/
        proxy.ts                                                      [modify: export subscriptionsAuthPreHandler]
        container.ts                                                  [new: wires repos + usecases + queue]
        schemas/
          plans.ts                                                    [new]
          subscriptions.ts                                            [new]
        routes/
          plans.ts                                                    [new]
          subscriptions.ts                                            [new]
          webhook.ts                                                   [new]
    application/
      subscriptions/
        list-plans.usecase.ts                                         [new]
        list-plans.usecase.test.ts                                    [new]
        create-checkout.usecase.ts                                    [new]
        create-checkout.usecase.test.ts                               [new]
        process-webhook.usecase.ts                                    [new]
        process-webhook.usecase.test.ts                               [new: testcontainers integration test]
      xp/
        grant-xp.usecase.ts                                           [new]
        grant-xp.usecase.test.ts                                      [new]
    app.ts                                                            [modify: register routes]
    index.ts                                                          [modify: start worker alongside Fastify]
  scripts/
    seed-levels.ts                                                    [new: seeds the 5 global levels]

apps/bff/
  package.json                                                       [no dep changes needed — uses global fetch]
  .env.example                                                        [modify: SUBSCRIPTIONS_SERVICE_URL]
  src/
    shared/env.ts                                                    [modify: SUBSCRIPTIONS_SERVICE_URL]
    infrastructure/http/
      routes/
        subscriptions.ts                                              [new: proxy routes]
        subscriptions.test.ts                                         [new]
    app.ts                                                            [modify: register proxy routes]
```

---

### Task 1: `createFirebaseAuthPreHandler` in `@clube/fastify-plugins`

**Files:**
- Create: `packages/fastify-plugins/src/firebase-auth.ts`
- Create: `packages/fastify-plugins/src/firebase-auth.test.ts`
- Modify: `packages/fastify-plugins/src/index.ts`

**Interfaces:**
- Produces: `createFirebaseAuthPreHandler(): preHandlerHookHandler` — verifies the bearer token if present, sets `request.user`, replies 401 (`TOKEN_EXPIRED`/`INVALID_TOKEN`) on a bad token, does nothing (no `request.user`) when there's no token. Never touches `request.tenant`. Consumed by Task 14 (`services/subscriptions` proxy.ts).

- [ ] **Step 1: Write the failing test**

Create `packages/fastify-plugins/src/firebase-auth.test.ts`:

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { createFirebaseAuthPreHandler } from './firebase-auth'

const { verifyIdToken } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
}))

vi.mock('@clube/firebase-utils', () => ({
  getFirebaseApp: () => ({}),
}))

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply
}

describe('createFirebaseAuthPreHandler', () => {
  it('does nothing when there is no authorization header', async () => {
    const preHandler = createFirebaseAuthPreHandler()
    const request = { headers: {} } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(request.user).toBeUndefined()
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('maps a verified JWT into request.user without touching request.tenant', async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: 'user-1',
      role: 'subscriber',
      tenant_id: 'tenant-1',
    })
    const preHandler = createFirebaseAuthPreHandler()
    const request = {
      headers: { authorization: 'Bearer fake-token' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(verifyIdToken).toHaveBeenCalledWith('fake-token')
    expect(request.user).toEqual({
      uid: 'user-1',
      role: 'subscriber',
      tenant_id: 'tenant-1',
    })
    expect(request.tenant).toBeUndefined()
  })

  it('replies 401 with TOKEN_EXPIRED when the token is expired', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Firebase ID token has expired'), {
        code: 'auth/id-token-expired',
      }),
    )
    const preHandler = createFirebaseAuthPreHandler()
    const request = {
      headers: { authorization: 'Bearer expired-token' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
    })
  })

  it('replies 401 with INVALID_TOKEN for any other verification failure', async () => {
    verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('Decoding Firebase ID token failed'), {
        code: 'auth/argument-error',
      }),
    )
    const preHandler = createFirebaseAuthPreHandler()
    const request = {
      headers: { authorization: 'Bearer malformed-token' },
    } as unknown as FastifyRequest
    const reply = createMockReply()

    await preHandler(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@clube/fastify-plugins`
Expected: FAIL — `./firebase-auth` module not found.

- [ ] **Step 3: Implement `createFirebaseAuthPreHandler`**

Create `packages/fastify-plugins/src/firebase-auth.ts`:

```typescript
import { getFirebaseApp } from '@clube/firebase-utils'
import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAuth } from 'firebase-admin/auth'

export function createFirebaseAuthPreHandler() {
  return async function firebaseAuthPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = request.headers.authorization?.split('Bearer ')[1]
    if (!token) return

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
    }
  }
}
```

In `packages/fastify-plugins/src/index.ts`, add:

```typescript
export { createFirebaseAuthPreHandler } from './firebase-auth'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@clube/fastify-plugins`
Expected: PASS (all 4 new cases plus existing suite).

- [ ] **Step 5: Commit**

```bash
git add packages/fastify-plugins/src/firebase-auth.ts packages/fastify-plugins/src/firebase-auth.test.ts packages/fastify-plugins/src/index.ts
git commit -m "feat(fastify-plugins): add auth-only preHandler for services without tenant DB access"
```

---

### Task 2: Extend `@clube/asaas-sdk` with typed customer/subscription methods

**Files:**
- Modify: `packages/asaas-sdk/src/index.ts`
- Modify: `packages/asaas-sdk/src/index.test.ts`

**Interfaces:**
- Produces: `AsaasCustomer`, `AsaasSubscription` types; `AsaasClient.findCustomerByExternalReference(externalReference: string): Promise<AsaasCustomer | null>`, `AsaasClient.createCustomer(data: CreateAsaasCustomerDto): Promise<AsaasCustomer>`, `AsaasClient.createSubscription(data: CreateAsaasSubscriptionDto): Promise<AsaasSubscription>`. Consumed by Task 11 (`create-checkout.usecase.ts`).

- [ ] **Step 1: Write the failing tests**

Add to `packages/asaas-sdk/src/index.test.ts` (append inside the existing `describe('AsaasClient', ...)` block, keeping the existing two tests):

```typescript
  it('finds a customer by externalReference', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'cus_1', externalReference: 'uid-1' }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const customer = await client.findCustomerByExternalReference('uid-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers?externalReference=uid-1',
      expect.anything(),
    )
    expect(customer).toEqual({ id: 'cus_1', externalReference: 'uid-1' })
  })

  it('returns null when no customer matches the externalReference', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const customer = await client.findCustomerByExternalReference('uid-1')

    expect(customer).toBeNull()
  })

  it('creates a customer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cus_1', externalReference: 'uid-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const customer = await client.createCustomer({
      name: 'Jane Doe',
      cpfCnpj: '12345678900',
      externalReference: 'uid-1',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(customer).toEqual({ id: 'cus_1', externalReference: 'uid-1' })
  })

  it('creates a subscription', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'sub_1', status: 'ACTIVE' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new AsaasClient('fake-key', 'sandbox')
    const subscription = await client.createSubscription({
      customer: 'cus_1',
      billingType: 'UNDEFINED',
      value: 19.9,
      cycle: 'MONTHLY',
      nextDueDate: '2026-08-01',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/subscriptions',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(subscription).toEqual({ id: 'sub_1', status: 'ACTIVE' })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=@clube/asaas-sdk`
Expected: FAIL — `findCustomerByExternalReference`/`createCustomer`/`createSubscription` are not functions.

- [ ] **Step 3: Implement the typed methods**

In `packages/asaas-sdk/src/index.ts`, add after the existing `AsaasClient` class body (before its closing brace, i.e. as new methods) and add the new types above the class:

```typescript
export type AsaasCustomer = {
  id: string
  externalReference?: string
  name?: string
  cpfCnpj?: string
}

export type CreateAsaasCustomerDto = {
  name: string
  cpfCnpj: string
  externalReference: string
}

export type AsaasSubscription = {
  id: string
  status: string
  paymentLink?: string
}

export type CreateAsaasSubscriptionDto = {
  customer: string
  billingType: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  cycle: 'MONTHLY'
  nextDueDate: string
}
```

Add these methods inside the `AsaasClient` class, after `request`:

```typescript
  async findCustomerByExternalReference(
    externalReference: string,
  ): Promise<AsaasCustomer | null> {
    const result = await this.request<{ data: AsaasCustomer[] }>(
      `/customers?externalReference=${encodeURIComponent(externalReference)}`,
    )
    return result.data[0] ?? null
  }

  async createCustomer(data: CreateAsaasCustomerDto): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createSubscription(
    data: CreateAsaasSubscriptionDto,
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/asaas-sdk`
Expected: PASS (6 tests total).

- [ ] **Step 5: Commit**

```bash
git add packages/asaas-sdk/src/index.ts packages/asaas-sdk/src/index.test.ts
git commit -m "feat(asaas-sdk): add typed customer and subscription methods"
```

---

### Task 3: Domain entities — `Level`, `Plan`, `Subscription`

**Files:**
- Create: `services/subscriptions/src/domain/entities/Level.ts`, `Level.test.ts`
- Create: `services/subscriptions/src/domain/entities/Plan.ts`, `Plan.test.ts`
- Create: `services/subscriptions/src/domain/entities/Subscription.ts`, `Subscription.test.ts`

**Interfaces:**
- Produces: `Level.create(props: LevelProps): Level` with getters `id, name, minXp, storeDiscountPct, cashbackPct`. `Plan.create(props: PlanProps): Plan` with getters `id, tenantId, name, priceCents, active, createdAt`. `Subscription.create(props: SubscriptionProps): Subscription` with getters `id, tenantId, uid, planId, asaasCustomerId, asaasSubscriptionId, status ('inactive'|'active'|'overdue'|'cancelled'), totalXp, levelId, createdAt, updatedAt`. Consumed by every repository/usecase task below.

- [ ] **Step 1: Write the failing tests**

Create `services/subscriptions/src/domain/entities/Level.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { Level } from './Level'

describe('Level', () => {
  it('exposes all props via getters', () => {
    const level = Level.create({
      id: 'level-1',
      name: 'Bronze',
      minXp: 0,
      storeDiscountPct: 5,
      cashbackPct: 3,
    })

    expect(level.id).toBe('level-1')
    expect(level.name).toBe('Bronze')
    expect(level.minXp).toBe(0)
    expect(level.storeDiscountPct).toBe(5)
    expect(level.cashbackPct).toBe(3)
  })
})
```

Create `services/subscriptions/src/domain/entities/Plan.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { Plan } from './Plan'

describe('Plan', () => {
  it('exposes all props via getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const plan = Plan.create({
      id: 'plan-1',
      tenantId: 'tenant-1',
      name: 'Assinatura Mensal',
      priceCents: 1990,
      active: true,
      createdAt,
    })

    expect(plan.id).toBe('plan-1')
    expect(plan.tenantId).toBe('tenant-1')
    expect(plan.name).toBe('Assinatura Mensal')
    expect(plan.priceCents).toBe(1990)
    expect(plan.active).toBe(true)
    expect(plan.createdAt).toBe(createdAt)
  })
})
```

Create `services/subscriptions/src/domain/entities/Subscription.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { Subscription } from './Subscription'

describe('Subscription', () => {
  it('exposes all props via getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const updatedAt = new Date('2026-01-02T00:00:00Z')
    const subscription = Subscription.create({
      id: 'sub-1',
      tenantId: 'tenant-1',
      uid: 'uid-1',
      planId: 'plan-1',
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_1',
      status: 'inactive',
      totalXp: 0,
      levelId: null,
      createdAt,
      updatedAt,
    })

    expect(subscription.id).toBe('sub-1')
    expect(subscription.tenantId).toBe('tenant-1')
    expect(subscription.uid).toBe('uid-1')
    expect(subscription.planId).toBe('plan-1')
    expect(subscription.asaasCustomerId).toBe('cus_1')
    expect(subscription.asaasSubscriptionId).toBe('asub_1')
    expect(subscription.status).toBe('inactive')
    expect(subscription.totalXp).toBe(0)
    expect(subscription.levelId).toBeNull()
    expect(subscription.createdAt).toBe(createdAt)
    expect(subscription.updatedAt).toBe(updatedAt)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — `./Level`, `./Plan`, `./Subscription` not found.

- [ ] **Step 3: Implement the entities**

Create `services/subscriptions/src/domain/entities/Level.ts`:

```typescript
export type LevelProps = {
  id: string
  name: string
  minXp: number
  storeDiscountPct: number
  cashbackPct: number
}

export class Level {
  private constructor(private readonly props: LevelProps) {}

  static create(props: LevelProps): Level {
    return new Level(props)
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get minXp(): number {
    return this.props.minXp
  }

  get storeDiscountPct(): number {
    return this.props.storeDiscountPct
  }

  get cashbackPct(): number {
    return this.props.cashbackPct
  }
}
```

Create `services/subscriptions/src/domain/entities/Plan.ts`:

```typescript
export type PlanProps = {
  id: string
  tenantId: string
  name: string
  priceCents: number
  active: boolean
  createdAt: Date
}

export class Plan {
  private constructor(private readonly props: PlanProps) {}

  static create(props: PlanProps): Plan {
    return new Plan(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get name(): string {
    return this.props.name
  }

  get priceCents(): number {
    return this.props.priceCents
  }

  get active(): boolean {
    return this.props.active
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
```

Create `services/subscriptions/src/domain/entities/Subscription.ts`:

```typescript
export type SubscriptionStatus = 'inactive' | 'active' | 'overdue' | 'cancelled'

export type SubscriptionProps = {
  id: string
  tenantId: string
  uid: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: SubscriptionStatus
  totalXp: number
  levelId: string | null
  createdAt: Date
  updatedAt: Date
}

export class Subscription {
  private constructor(private readonly props: SubscriptionProps) {}

  static create(props: SubscriptionProps): Subscription {
    return new Subscription(props)
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

  get planId(): string {
    return this.props.planId
  }

  get asaasCustomerId(): string | null {
    return this.props.asaasCustomerId
  }

  get asaasSubscriptionId(): string | null {
    return this.props.asaasSubscriptionId
  }

  get status(): SubscriptionStatus {
    return this.props.status
  }

  get totalXp(): number {
    return this.props.totalXp
  }

  get levelId(): string | null {
    return this.props.levelId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS (3 new tests, plus the existing `app.test.ts` and `domain-error.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add services/subscriptions/src/domain/entities
git commit -m "feat(subscriptions): add Level, Plan, and Subscription domain entities"
```

---

### Task 4: Domain errors

**Files:**
- Create: `services/subscriptions/src/domain/errors/index.ts`
- Create: `services/subscriptions/src/domain/errors/index.test.ts`

**Interfaces:**
- Produces: `SubscriptionNotFoundError`, `PlanNotFoundError`, `SubscriptionAlreadyActiveError` — all extend the existing `services/subscriptions/src/domain/errors/domain-error.ts`'s `DomainError`. Consumed by Tasks 7, 10, 11, 12.

- [ ] **Step 1: Write the failing test**

Create `services/subscriptions/src/domain/errors/index.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import {
  PlanNotFoundError,
  SubscriptionAlreadyActiveError,
  SubscriptionNotFoundError,
} from './index'

describe('subscriptions domain errors', () => {
  it('SubscriptionNotFoundError carries a 404 and the subscription id', () => {
    const error = new SubscriptionNotFoundError('sub-1')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('SUBSCRIPTION_NOT_FOUND')
    expect(error.message).toContain('sub-1')
  })

  it('PlanNotFoundError carries a 404 and the plan id', () => {
    const error = new PlanNotFoundError('plan-1')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('PLAN_NOT_FOUND')
    expect(error.message).toContain('plan-1')
  })

  it('SubscriptionAlreadyActiveError carries a 409 and the uid', () => {
    const error = new SubscriptionAlreadyActiveError('uid-1')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('SUBSCRIPTION_ALREADY_ACTIVE')
    expect(error.message).toContain('uid-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — `./index` (errors) not found.

- [ ] **Step 3: Implement the errors**

Create `services/subscriptions/src/domain/errors/index.ts`:

```typescript
import { DomainError } from './domain-error'

export class SubscriptionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Subscription ${id} not found`, 'SUBSCRIPTION_NOT_FOUND', 404)
  }
}

export class PlanNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Plan ${id} not found`, 'PLAN_NOT_FOUND', 404)
  }
}

export class SubscriptionAlreadyActiveError extends DomainError {
  constructor(uid: string) {
    super(
      `Subscription for ${uid} is already active`,
      'SUBSCRIPTION_ALREADY_ACTIVE',
      409,
    )
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/subscriptions/src/domain/errors/index.ts services/subscriptions/src/domain/errors/index.test.ts
git commit -m "feat(subscriptions): add SubscriptionNotFoundError, PlanNotFoundError, SubscriptionAlreadyActiveError"
```

---

### Task 5: Domain repository interfaces

**Files:**
- Create: `services/subscriptions/src/domain/interfaces/ILevelRepository.ts`
- Create: `services/subscriptions/src/domain/interfaces/IPlanRepository.ts`
- Create: `services/subscriptions/src/domain/interfaces/ISubscriptionRepository.ts`

No test — these are type-only interfaces (nothing to execute); the repository tasks below verify their implementations.

**Interfaces:**
- Produces: the three interfaces below. Consumed by Task 7 (repository implementations) and Tasks 9–12 (usecases, via constructor injection).

- [ ] **Step 1: Create the interfaces**

Create `services/subscriptions/src/domain/interfaces/ILevelRepository.ts`:

```typescript
import type { Level } from '../entities/Level'

export interface ILevelRepository {
  findAll(): Promise<Level[]>
  findHighestForXp(totalXp: number): Promise<Level | null>
}
```

Create `services/subscriptions/src/domain/interfaces/IPlanRepository.ts`:

```typescript
import type { Plan } from '../entities/Plan'

export interface IPlanRepository {
  findActiveByTenant(tenantId: string): Promise<Plan[]>
  findById(id: string): Promise<Plan | null>
}
```

Create `services/subscriptions/src/domain/interfaces/ISubscriptionRepository.ts`:

```typescript
import type { Subscription, SubscriptionStatus } from '../entities/Subscription'

export type CreateSubscriptionDto = {
  tenantId: string
  uid: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: SubscriptionStatus
}

export interface ISubscriptionRepository {
  findByUid(uid: string, tenantId: string): Promise<Subscription | null>
  findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null>
  create(data: CreateSubscriptionDto): Promise<Subscription>
  updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription>
  updateXp(
    id: string,
    totalXp: number,
    levelId: string | null,
  ): Promise<Subscription>
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace=@clube/subscriptions`
Expected: PASS (interfaces reference only the entities from Task 3, which already compile).

- [ ] **Step 3: Commit**

```bash
git add services/subscriptions/src/domain/interfaces
git commit -m "feat(subscriptions): add ILevelRepository, IPlanRepository, ISubscriptionRepository"
```

---

### Task 6: Drizzle schema, migration, db client, env vars

**Files:**
- Modify: `services/subscriptions/package.json`
- Modify: `services/subscriptions/.env.example`
- Modify: `services/subscriptions/drizzle.config.ts`
- Modify: `services/subscriptions/src/shared/env.ts`
- Create: `services/subscriptions/src/infrastructure/db/schema/subscriptions.ts`
- Modify: `services/subscriptions/src/infrastructure/db/schema/index.ts`
- Create: `services/subscriptions/src/infrastructure/db/index.ts`

**Interfaces:**
- Produces: `schema` (aggregated Drizzle schema object), `db: NodePgDatabase<typeof schema>`, tables `levels`, `plans`, `subscribers`, `xpEvents`. Consumed by Task 7 (repositories) and Task 8 (seed script).

- [ ] **Step 1: Add dependencies**

In `services/subscriptions/package.json`, replace the `dependencies`/`devDependencies` blocks with:

```json
  "dependencies": {
    "@clube/asaas-sdk": "*",
    "@clube/db-client": "*",
    "@clube/fastify-plugins": "*",
    "@clube/firebase-utils": "*",
    "@clube/shared-types": "*",
    "@sinclair/typebox": "^0.32.35",
    "@t3-oss/env-core": "^0.11.1",
    "bullmq": "^5.12.9",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.33.0",
    "fastify": "^5.0.0",
    "ioredis": "^5.4.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testcontainers/postgresql": "^12.0.1",
    "@types/node": "^20.14.15",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
```

Also add `"seed:levels": "tsx scripts/seed-levels.ts"` to `scripts` (used by Task 8).

Run: `npm install`

- [ ] **Step 2: Update env**

In `services/subscriptions/.env.example`, replace contents with:

```bash
PORT=3005
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/clube?schema=subscriptions
REDIS_URL=redis://localhost:6379
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=
ASAAS_API_KEY=
ASAAS_ENV=sandbox
ASAAS_WEBHOOK_TOKEN=
```

In `services/subscriptions/src/shared/env.ts`, replace the file with:

```typescript
import { resolve } from 'node:path'
import type { createEnv as CreateEnvFn } from '@t3-oss/env-core/types'
import { config } from 'dotenv'
import { z } from 'zod'

config({ path: resolve(__dirname, '../../../.env') })

const { createEnv } = require('@t3-oss/env-core') as {
  createEnv: typeof CreateEnvFn
}

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3005),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_SERVICE_ACCOUNT: z.string().min(1),
    ASAAS_API_KEY: z.string().min(1),
    ASAAS_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    ASAAS_WEBHOOK_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
})
```

(Keep the same explanatory comment block above `createEnv` that already exists in `apps/bff/src/shared/env.ts` — copy it verbatim so future readers understand the ESM/CJS interop reasoning; omitted here only for plan brevity.)

In `services/subscriptions/drizzle.config.ts`, replace with:

```typescript
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
```

- [ ] **Step 3: Write the Drizzle schema**

Create `services/subscriptions/src/infrastructure/db/schema/subscriptions.ts`:

```typescript
import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const subscriptionsSchema = pgSchema('subscriptions')

export const subscriptionStatusEnum = subscriptionsSchema.enum(
  'subscription_status',
  ['inactive', 'active', 'overdue', 'cancelled'],
)

export const levels = subscriptionsSchema.table('levels', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  minXp: integer('min_xp').notNull(),
  storeDiscountPct: numeric('store_discount_pct', {
    precision: 5,
    scale: 2,
  }).notNull(),
  cashbackPct: numeric('cashback_pct', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const plans = subscriptionsSchema.table('plans', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const subscribers = subscriptionsSchema.table(
  'subscribers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    uid: text('uid').notNull(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    asaasCustomerId: text('asaas_customer_id'),
    asaasSubscriptionId: text('asaas_subscription_id'),
    status: subscriptionStatusEnum('status').notNull().default('inactive'),
    totalXp: integer('total_xp').notNull().default(0),
    levelId: uuid('level_id').references(() => levels.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uidTenantIdx: uniqueIndex('subscribers_uid_tenant_idx').on(
      table.uid,
      table.tenantId,
    ),
    asaasSubscriptionIdx: uniqueIndex('subscribers_asaas_subscription_idx').on(
      table.asaasSubscriptionId,
    ),
  }),
)

export const xpEvents = subscriptionsSchema.table('xp_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  subscriberId: uuid('subscriber_id')
    .notNull()
    .references(() => subscribers.id),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
```

Update `services/subscriptions/src/infrastructure/db/schema/index.ts`:

```typescript
import { levels, plans, subscribers, xpEvents } from './subscriptions'

export const schema = { levels, plans, subscribers, xpEvents }
```

- [ ] **Step 4: Create the db client**

Create `services/subscriptions/src/infrastructure/db/index.ts`:

```typescript
import { createDbClient } from '@clube/db-client'
import { env } from '../../shared/env'
import { schema } from './schema'

export const db = createDbClient(schema, env.DATABASE_URL)
```

- [ ] **Step 5: Generate and apply the migration**

Run:
```bash
cd services/subscriptions
npx drizzle-kit generate
npx drizzle-kit migrate
cd ../..
```
Expected: a new SQL file appears under `services/subscriptions/src/infrastructure/db/migrations/`, creates the `subscriptions` schema, the `subscription_status` enum, and the four tables. `migrate` applies it against `DATABASE_URL` with no errors (infra already verified reachable).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/subscriptions/package.json services/subscriptions/package-lock.json services/subscriptions/.env.example services/subscriptions/drizzle.config.ts services/subscriptions/src/shared/env.ts services/subscriptions/src/infrastructure/db
git commit -m "feat(subscriptions): add Drizzle schema (levels, plans, subscribers, xp_events) and migration"
```

---

### Task 7: Repositories — `LevelRepository`, `PlanRepository`, `SubscriptionRepository`

**Files:**
- Create: `services/subscriptions/src/infrastructure/db/repositories/level.repository.ts`
- Create: `services/subscriptions/src/infrastructure/db/repositories/plan.repository.ts`
- Create: `services/subscriptions/src/infrastructure/db/repositories/subscription.repository.ts`
- Create: `services/subscriptions/src/infrastructure/db/repositories/__tests__/level.repository.test.ts`
- Create: `services/subscriptions/src/infrastructure/db/repositories/__tests__/plan.repository.test.ts`
- Create: `services/subscriptions/src/infrastructure/db/repositories/__tests__/subscription.repository.test.ts`

**Interfaces:**
- Consumes: `ILevelRepository`, `IPlanRepository`, `ISubscriptionRepository` (Task 5), `schema`/`db` (Task 6), entities (Task 3).
- Produces: `LevelRepository`, `PlanRepository`, `SubscriptionRepository` classes, each `implements` its interface, constructed with `(db: NodePgDatabase<typeof schema>)`. Consumed by Task 9–12 (usecases) and Task 14 (`container.ts`).

- [ ] **Step 1: Write the failing repository tests**

Create `services/subscriptions/src/infrastructure/db/repositories/__tests__/level.repository.test.ts`:

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
import { levels } from '../../schema/subscriptions'
import { LevelRepository } from '../level.repository'

describe('LevelRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: LevelRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new LevelRepository(db)

    await db.insert(levels).values([
      { name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' },
      { name: 'Prata', minXp: 500, storeDiscountPct: '10', cashbackPct: '4' },
      { name: 'Ouro', minXp: 1500, storeDiscountPct: '15', cashbackPct: '5' },
    ])
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('lists all levels', async () => {
    const all = await repository.findAll()
    expect(all).toHaveLength(3)
  })

  it('finds the highest level whose minXp does not exceed the given XP', async () => {
    const level = await repository.findHighestForXp(600)
    expect(level?.name).toBe('Prata')
  })

  it('returns null when no level qualifies', async () => {
    await db.delete(levels)
    const level = await repository.findHighestForXp(0)
    expect(level).toBeNull()
  })
})
```

Create `services/subscriptions/src/infrastructure/db/repositories/__tests__/plan.repository.test.ts`:

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
import { PlanRepository } from '../plan.repository'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const OTHER_TENANT_ID = '00000000-0000-0000-0000-000000000002'

describe('PlanRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: PlanRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new PlanRepository(db)
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a plan and finds it by id', async () => {
    const [{ id }] = await db
      .insert(schema.plans)
      .values({
        tenantId: TENANT_ID,
        name: 'Assinatura Mensal',
        priceCents: 1990,
        active: true,
      })
      .returning({ id: schema.plans.id })

    const found = await repository.findById(id)
    expect(found?.name).toBe('Assinatura Mensal')
    expect(found?.priceCents).toBe(1990)
  })

  it('returns null when the plan does not exist', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    )
    expect(found).toBeNull()
  })

  it('lists only active plans scoped to the tenant', async () => {
    await db.insert(schema.plans).values([
      {
        tenantId: TENANT_ID,
        name: 'Ativo',
        priceCents: 1990,
        active: true,
      },
      {
        tenantId: TENANT_ID,
        name: 'Inativo',
        priceCents: 1990,
        active: false,
      },
      {
        tenantId: OTHER_TENANT_ID,
        name: 'Outro tenant',
        priceCents: 1990,
        active: true,
      },
    ])

    const found = await repository.findActiveByTenant(TENANT_ID)
    expect(found.every((plan) => plan.active)).toBe(true)
    expect(found.every((plan) => plan.tenantId === TENANT_ID)).toBe(true)
  })
})
```

Create `services/subscriptions/src/infrastructure/db/repositories/__tests__/subscription.repository.test.ts`:

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
import { SubscriptionRepository } from '../subscription.repository'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

describe('SubscriptionRepository', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let repository: SubscriptionRepository
  let planId: string
  let levelId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    repository = new SubscriptionRepository(db)

    const [plan] = await db
      .insert(schema.plans)
      .values({ tenantId: TENANT_ID, name: 'Plano', priceCents: 1990, active: true })
      .returning({ id: schema.plans.id })
    planId = plan.id

    const [level] = await db
      .insert(schema.levels)
      .values({ name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' })
      .returning({ id: schema.levels.id })
    levelId = level.id
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  it('creates a subscription and finds it by uid + tenant', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-1',
      planId,
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_1',
      status: 'inactive',
    })

    const found = await repository.findByUid('uid-1', TENANT_ID)
    expect(found?.id).toBe(created.id)
    expect(found?.status).toBe('inactive')
  })

  it('finds a subscription by its Asaas subscription id', async () => {
    const found = await repository.findByAsaasSubscriptionId('asub_1')
    expect(found?.uid).toBe('uid-1')
  })

  it('updates status', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-2',
      planId,
      asaasCustomerId: 'cus_2',
      asaasSubscriptionId: 'asub_2',
      status: 'inactive',
    })

    const updated = await repository.updateStatus(created.id, 'active')
    expect(updated.status).toBe('active')
  })

  it('updates XP and level', async () => {
    const created = await repository.create({
      tenantId: TENANT_ID,
      uid: 'uid-3',
      planId,
      asaasCustomerId: 'cus_3',
      asaasSubscriptionId: 'asub_3',
      status: 'active',
    })

    const updated = await repository.updateXp(created.id, 50, levelId)
    expect(updated.totalXp).toBe(50)
    expect(updated.levelId).toBe(levelId)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — repository modules not found.

- [ ] **Step 3: Implement the repositories**

Create `services/subscriptions/src/infrastructure/db/repositories/level.repository.ts`:

```typescript
import { desc, lte } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Level } from '../../../domain/entities/Level'
import type { ILevelRepository } from '../../../domain/interfaces/ILevelRepository'
import type { schema } from '../schema'
import { levels } from '../schema/subscriptions'

type LevelRow = typeof levels.$inferSelect

function toDomain(row: LevelRow): Level {
  return Level.create({
    id: row.id,
    name: row.name,
    minXp: row.minXp,
    storeDiscountPct: Number(row.storeDiscountPct),
    cashbackPct: Number(row.cashbackPct),
  })
}

export class LevelRepository implements ILevelRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAll(): Promise<Level[]> {
    const rows = await this.db.select().from(levels).orderBy(levels.minXp)
    return rows.map(toDomain)
  }

  async findHighestForXp(totalXp: number): Promise<Level | null> {
    const [row] = await this.db
      .select()
      .from(levels)
      .where(lte(levels.minXp, totalXp))
      .orderBy(desc(levels.minXp))
      .limit(1)

    return row ? toDomain(row) : null
  }
}
```

Create `services/subscriptions/src/infrastructure/db/repositories/plan.repository.ts`:

```typescript
import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Plan } from '../../../domain/entities/Plan'
import type { IPlanRepository } from '../../../domain/interfaces/IPlanRepository'
import type { schema } from '../schema'
import { plans } from '../schema/subscriptions'

type PlanRow = typeof plans.$inferSelect

function toDomain(row: PlanRow): Plan {
  return Plan.create({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    priceCents: row.priceCents,
    active: row.active,
    createdAt: row.createdAt,
  })
}

export class PlanRepository implements IPlanRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findActiveByTenant(tenantId: string): Promise<Plan[]> {
    const rows = await this.db
      .select()
      .from(plans)
      .where(and(eq(plans.tenantId, tenantId), eq(plans.active, true)))

    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Plan | null> {
    const [row] = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }
}
```

Create `services/subscriptions/src/infrastructure/db/repositories/subscription.repository.ts`:

```typescript
import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Subscription } from '../../../domain/entities/Subscription'
import type {
  CreateSubscriptionDto,
  ISubscriptionRepository,
} from '../../../domain/interfaces/ISubscriptionRepository'
import type { SubscriptionStatus } from '../../../domain/entities/Subscription'
import type { schema } from '../schema'
import { subscribers } from '../schema/subscriptions'

type SubscriberRow = typeof subscribers.$inferSelect

function toDomain(row: SubscriberRow): Subscription {
  return Subscription.create({
    id: row.id,
    tenantId: row.tenantId,
    uid: row.uid,
    planId: row.planId,
    asaasCustomerId: row.asaasCustomerId,
    asaasSubscriptionId: row.asaasSubscriptionId,
    status: row.status,
    totalXp: row.totalXp,
    levelId: row.levelId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByUid(uid: string, tenantId: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(and(eq(subscribers.uid, uid), eq(subscribers.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.asaasSubscriptionId, asaasSubscriptionId))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateSubscriptionDto): Promise<Subscription> {
    const [row] = await this.db
      .insert(subscribers)
      .values({
        tenantId: data.tenantId,
        uid: data.uid,
        planId: data.planId,
        asaasCustomerId: data.asaasCustomerId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        status: data.status,
      })
      .returning()

    return toDomain(row as SubscriberRow)
  }

  async updateStatus(
    id: string,
    status: SubscriptionStatus,
  ): Promise<Subscription> {
    const [row] = await this.db
      .update(subscribers)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscribers.id, id))
      .returning()

    return toDomain(row as SubscriberRow)
  }

  async updateXp(
    id: string,
    totalXp: number,
    levelId: string | null,
  ): Promise<Subscription> {
    const [row] = await this.db
      .update(subscribers)
      .set({ totalXp, levelId, updatedAt: new Date() })
      .where(eq(subscribers.id, id))
      .returning()

    return toDomain(row as SubscriberRow)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS (11 new repository tests). This step needs Docker running locally for `testcontainers` — same requirement as the existing `apps/bff` repository tests.

- [ ] **Step 5: Commit**

```bash
git add services/subscriptions/src/infrastructure/db/repositories
git commit -m "feat(subscriptions): implement LevelRepository, PlanRepository, SubscriptionRepository"
```

---

### Task 8: Seed script for the 5 global levels

**Files:**
- Create: `services/subscriptions/scripts/seed-levels.ts`

**Interfaces:**
- Consumes: `db` (Task 6), `levels` schema (Task 6).

- [ ] **Step 1: Implement the seed script**

Create `services/subscriptions/scripts/seed-levels.ts`:

```typescript
import { db } from '../src/infrastructure/db'
import { levels } from '../src/infrastructure/db/schema/subscriptions'

const LEVELS = [
  { name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' },
  { name: 'Prata', minXp: 500, storeDiscountPct: '10', cashbackPct: '4' },
  { name: 'Ouro', minXp: 1500, storeDiscountPct: '15', cashbackPct: '5' },
  { name: 'Diamante', minXp: 5000, storeDiscountPct: '20', cashbackPct: '6' },
  { name: 'Lenda', minXp: 15000, storeDiscountPct: '25', cashbackPct: '8' },
]

async function seed(): Promise<void> {
  for (const level of LEVELS) {
    await db.insert(levels).values(level)
  }
  console.log('Seed concluído: 5 níveis (Bronze a Lenda) inseridos.')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed falhou:', error)
    process.exit(1)
  })
```

This is a dev-only convenience script (`npm run seed:levels --workspace=@clube/subscriptions`), not idempotent by design — matching that this table is only ever seeded once per environment. Do not run it twice against the same database without truncating `levels` first.

- [ ] **Step 2: Verify manually**

Run: `npm run seed:levels --workspace=@clube/subscriptions`
Expected: prints the success message; `SELECT * FROM subscriptions.levels` shows 5 rows.

- [ ] **Step 3: Commit**

```bash
git add services/subscriptions/scripts/seed-levels.ts services/subscriptions/package.json
git commit -m "feat(subscriptions): add seed script for the 5 global XP levels"
```

---

### Task 9: `ListPlansUseCase`

**Files:**
- Create: `services/subscriptions/src/application/subscriptions/list-plans.usecase.ts`
- Create: `services/subscriptions/src/application/subscriptions/list-plans.usecase.test.ts`

**Interfaces:**
- Consumes: `IPlanRepository` (Task 5).
- Produces: `ListPlansUseCase.execute(input: { tenantId: string }): Promise<Plan[]>`. Consumed by Task 14 (`routes/plans.ts`).

- [ ] **Step 1: Write the failing test**

Create `services/subscriptions/src/application/subscriptions/list-plans.usecase.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { Plan } from '../../domain/entities/Plan'
import { ListPlansUseCase } from './list-plans.usecase'

describe('ListPlansUseCase', () => {
  it('returns active plans for the given tenant', async () => {
    const plan = Plan.create({
      id: 'plan-1',
      tenantId: 'tenant-1',
      name: 'Assinatura Mensal',
      priceCents: 1990,
      active: true,
      createdAt: new Date(),
    })
    const planRepository = { findActiveByTenant: vi.fn().mockResolvedValue([plan]) }

    const usecase = new ListPlansUseCase(planRepository)
    const result = await usecase.execute({ tenantId: 'tenant-1' })

    expect(planRepository.findActiveByTenant).toHaveBeenCalledWith('tenant-1')
    expect(result).toEqual([plan])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — `./list-plans.usecase` not found.

- [ ] **Step 3: Implement the usecase**

Create `services/subscriptions/src/application/subscriptions/list-plans.usecase.ts`:

```typescript
import type { Plan } from '../../domain/entities/Plan'
import type { IPlanRepository } from '../../domain/interfaces/IPlanRepository'

export type ListPlansInput = {
  tenantId: string
}

export class ListPlansUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(input: ListPlansInput): Promise<Plan[]> {
    return this.planRepository.findActiveByTenant(input.tenantId)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/subscriptions/src/application/subscriptions/list-plans.usecase.ts services/subscriptions/src/application/subscriptions/list-plans.usecase.test.ts
git commit -m "feat(subscriptions): add ListPlansUseCase"
```

---

### Task 10: `GrantXpUseCase`

**Files:**
- Create: `services/subscriptions/src/application/xp/grant-xp.usecase.ts`
- Create: `services/subscriptions/src/application/xp/grant-xp.usecase.test.ts`

**Interfaces:**
- Consumes: `ISubscriptionRepository`, `ILevelRepository` (Task 5), `SubscriptionNotFoundError` (Task 4).
- Produces: `GrantXpUseCase.execute(input: { subscriptionId: string; tenantId: string; amount: number; source: string }): Promise<Subscription>`. Consumed by Task 12 (`ProcessWebhookUseCase`).

Note: `xp_events` insertion happens here too (audit trail), even though the interface doesn't expose a dedicated repository for it — this usecase takes the raw `db`/`xpEvents` table dependency directly since it's a pure append-only insert with no query logic worth abstracting behind an interface (YAGNI: one insert statement doesn't need a repository).

- [ ] **Step 1: Write the failing test**

Create `services/subscriptions/src/application/xp/grant-xp.usecase.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { Level } from '../../domain/entities/Level'
import { Subscription } from '../../domain/entities/Subscription'
import { SubscriptionNotFoundError } from '../../domain/errors'
import { GrantXpUseCase } from './grant-xp.usecase'

function makeSubscription(totalXp: number) {
  return Subscription.create({
    id: 'sub-1',
    tenantId: 'tenant-1',
    uid: 'uid-1',
    planId: 'plan-1',
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    status: 'active',
    totalXp,
    levelId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('GrantXpUseCase', () => {
  it('throws when the subscription does not exist', async () => {
    const subscriptionRepository = {
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    }
    const levelRepository = { findAll: vi.fn(), findHighestForXp: vi.fn() }
    const insertXpEvent = vi.fn()

    const usecase = new GrantXpUseCase(
      subscriptionRepository,
      levelRepository,
      insertXpEvent,
    )

    await expect(
      usecase.execute({
        subscriptionId: 'sub-1',
        tenantId: 'tenant-1',
        amount: 50,
        source: 'subscription_payment',
      }),
    ).rejects.toThrow(SubscriptionNotFoundError)
  })

  it('adds the XP, records the event, and updates the level when it changed', async () => {
    const subscription = makeSubscription(480)
    const bronze = Level.create({
      id: 'level-bronze',
      name: 'Bronze',
      minXp: 0,
      storeDiscountPct: 5,
      cashbackPct: 3,
    })
    const prata = Level.create({
      id: 'level-prata',
      name: 'Prata',
      minXp: 500,
      storeDiscountPct: 10,
      cashbackPct: 4,
    })
    const updated = makeSubscription(530)

    const subscriptionRepository = {
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateXp: vi.fn().mockResolvedValue(updated),
      findById: vi.fn().mockResolvedValue(subscription),
    }
    const levelRepository = {
      findAll: vi.fn(),
      findHighestForXp: vi.fn().mockResolvedValue(prata),
    }
    const insertXpEvent = vi.fn()

    const usecase = new GrantXpUseCase(
      subscriptionRepository,
      levelRepository,
      insertXpEvent,
    )

    const result = await usecase.execute({
      subscriptionId: 'sub-1',
      tenantId: 'tenant-1',
      amount: 50,
      source: 'subscription_payment',
    })

    expect(levelRepository.findHighestForXp).toHaveBeenCalledWith(530)
    expect(subscriptionRepository.updateXp).toHaveBeenCalledWith(
      'sub-1',
      530,
      'level-prata',
    )
    expect(insertXpEvent).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      subscriberId: 'sub-1',
      amount: 50,
      source: 'subscription_payment',
    })
    expect(result).toBe(updated)
    void bronze
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — `./grant-xp.usecase` not found, and `subscriptionRepository` needs a `findById` method not yet in `ISubscriptionRepository`.

- [ ] **Step 3: Add `findById` to `ISubscriptionRepository` and its implementation**

In `services/subscriptions/src/domain/interfaces/ISubscriptionRepository.ts`, add to the interface:

```typescript
  findById(id: string): Promise<Subscription | null>
```

In `services/subscriptions/src/infrastructure/db/repositories/subscription.repository.ts`, add the method (mirrors `findByAsaasSubscriptionId`):

```typescript
  async findById(id: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }
```

- [ ] **Step 4: Implement `GrantXpUseCase`**

Create `services/subscriptions/src/application/xp/grant-xp.usecase.ts`:

```typescript
import type { Subscription } from '../../domain/entities/Subscription'
import { SubscriptionNotFoundError } from '../../domain/errors'
import type { ILevelRepository } from '../../domain/interfaces/ILevelRepository'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'

export type GrantXpInput = {
  subscriptionId: string
  tenantId: string
  amount: number
  source: string
}

export type InsertXpEvent = (event: {
  tenantId: string
  subscriberId: string
  amount: number
  source: string
}) => Promise<void>

export class GrantXpUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly levelRepository: ILevelRepository,
    private readonly insertXpEvent: InsertXpEvent,
  ) {}

  async execute(input: GrantXpInput): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(
      input.subscriptionId,
    )
    if (!subscription) {
      throw new SubscriptionNotFoundError(input.subscriptionId)
    }

    const totalXp = subscription.totalXp + input.amount
    const level = await this.levelRepository.findHighestForXp(totalXp)

    const updated = await this.subscriptionRepository.updateXp(
      subscription.id,
      totalXp,
      level?.id ?? subscription.levelId,
    )

    await this.insertXpEvent({
      tenantId: input.tenantId,
      subscriberId: subscription.id,
      amount: input.amount,
      source: input.source,
    })

    return updated
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/subscriptions/src/application/xp services/subscriptions/src/domain/interfaces/ISubscriptionRepository.ts services/subscriptions/src/infrastructure/db/repositories/subscription.repository.ts
git commit -m "feat(subscriptions): add GrantXpUseCase and ISubscriptionRepository.findById"
```

---

### Task 11: Asaas client wrapper + `CreateCheckoutUseCase`

**Files:**
- Create: `services/subscriptions/src/infrastructure/external/asaas/client.ts`
- Create: `services/subscriptions/src/application/subscriptions/create-checkout.usecase.ts`
- Create: `services/subscriptions/src/application/subscriptions/create-checkout.usecase.test.ts`

**Interfaces:**
- Consumes: `AsaasClient` (Task 2), `ISubscriptionRepository`, `IPlanRepository` (Task 5), `PlanNotFoundError`, `SubscriptionAlreadyActiveError` (Task 4).
- Produces: `getAsaasClient(): AsaasClient` (env-configured singleton). `CreateCheckoutUseCase.execute(input: { uid: string; tenantId: string; planId: string }): Promise<{ paymentUrl: string | null }>`. Consumed by Task 14 (`routes/subscriptions.ts`).

- [ ] **Step 1: Create the env-configured Asaas client**

Create `services/subscriptions/src/infrastructure/external/asaas/client.ts`:

```typescript
import { AsaasClient } from '@clube/asaas-sdk'
import { env } from '../../../shared/env'

let instance: AsaasClient | null = null

export function getAsaasClient(): AsaasClient {
  if (!instance) {
    instance = new AsaasClient(env.ASAAS_API_KEY, env.ASAAS_ENV)
  }
  return instance
}
```

- [ ] **Step 2: Write the failing test for `CreateCheckoutUseCase`**

Create `services/subscriptions/src/application/subscriptions/create-checkout.usecase.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { Plan } from '../../domain/entities/Plan'
import { Subscription } from '../../domain/entities/Subscription'
import {
  PlanNotFoundError,
  SubscriptionAlreadyActiveError,
} from '../../domain/errors'
import { CreateCheckoutUseCase } from './create-checkout.usecase'

function makePlan(overrides: Partial<Parameters<typeof Plan.create>[0]> = {}) {
  return Plan.create({
    id: 'plan-1',
    tenantId: 'tenant-1',
    name: 'Assinatura Mensal',
    priceCents: 1990,
    active: true,
    createdAt: new Date(),
    ...overrides,
  })
}

function makeSubscription(
  overrides: Partial<Parameters<typeof Subscription.create>[0]> = {},
) {
  return Subscription.create({
    id: 'sub-1',
    tenantId: 'tenant-1',
    uid: 'uid-1',
    planId: 'plan-1',
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    status: 'inactive',
    totalXp: 0,
    levelId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
}

describe('CreateCheckoutUseCase', () => {
  it('throws PlanNotFoundError when the plan does not exist for the tenant', async () => {
    const planRepository = { findActiveByTenant: vi.fn(), findById: vi.fn().mockResolvedValue(null) }
    const subscriptionRepository = {
      findByUid: vi.fn(),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await expect(
      usecase.execute({ uid: 'uid-1', tenantId: 'tenant-1', planId: 'plan-1' }),
    ).rejects.toThrow(PlanNotFoundError)
  })

  it('throws SubscriptionAlreadyActiveError when the subscriber is already active', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findByUid: vi.fn().mockResolvedValue(makeSubscription({ status: 'active' })),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn(),
      createCustomer: vi.fn(),
      createSubscription: vi.fn(),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await expect(
      usecase.execute({ uid: 'uid-1', tenantId: 'tenant-1', planId: 'plan-1' }),
    ).rejects.toThrow(SubscriptionAlreadyActiveError)
  })

  it('creates an Asaas customer, subscription, and a local inactive subscriber, returning the payment URL', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi.fn().mockResolvedValue(null),
      createCustomer: vi.fn().mockResolvedValue({ id: 'cus_1' }),
      createSubscription: vi
        .fn()
        .mockResolvedValue({ id: 'asub_1', status: 'PENDING', paymentLink: 'https://pay.asaas.com/x' }),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
    })

    expect(asaasClient.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: 'uid-1' }),
    )
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_1', value: 19.9, cycle: 'MONTHLY' }),
    )
    expect(subscriptionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        uid: 'uid-1',
        planId: 'plan-1',
        asaasCustomerId: 'cus_1',
        asaasSubscriptionId: 'asub_1',
        status: 'inactive',
      }),
    )
    expect(result).toEqual({ paymentUrl: 'https://pay.asaas.com/x' })
  })

  it('reuses an existing Asaas customer instead of creating a duplicate', async () => {
    const planRepository = {
      findActiveByTenant: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
    }
    const subscriptionRepository = {
      findByUid: vi.fn().mockResolvedValue(null),
      findByAsaasSubscriptionId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(makeSubscription()),
      updateStatus: vi.fn(),
      updateXp: vi.fn(),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi
        .fn()
        .mockResolvedValue({ id: 'cus_existing' }),
      createCustomer: vi.fn(),
      createSubscription: vi
        .fn()
        .mockResolvedValue({ id: 'asub_1', status: 'PENDING' }),
    }

    const usecase = new CreateCheckoutUseCase(
      subscriptionRepository,
      planRepository,
      asaasClient as never,
    )

    await usecase.execute({ uid: 'uid-1', tenantId: 'tenant-1', planId: 'plan-1' })

    expect(asaasClient.createCustomer).not.toHaveBeenCalled()
    expect(asaasClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    )
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — `./create-checkout.usecase` not found.

- [ ] **Step 4: Implement `CreateCheckoutUseCase`**

Create `services/subscriptions/src/application/subscriptions/create-checkout.usecase.ts`:

```typescript
import type { AsaasClient } from '@clube/asaas-sdk'
import {
  PlanNotFoundError,
  SubscriptionAlreadyActiveError,
} from '../../domain/errors'
import type { IPlanRepository } from '../../domain/interfaces/IPlanRepository'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'

export type CreateCheckoutInput = {
  uid: string
  tenantId: string
  planId: string
}

export type CreateCheckoutOutput = {
  paymentUrl: string | null
}

export class CreateCheckoutUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
    private readonly asaasClient: AsaasClient,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    const plan = await this.planRepository.findById(input.planId)
    if (!plan || plan.tenantId !== input.tenantId) {
      throw new PlanNotFoundError(input.planId)
    }

    const existing = await this.subscriptionRepository.findByUid(
      input.uid,
      input.tenantId,
    )
    if (existing?.status === 'active') {
      throw new SubscriptionAlreadyActiveError(input.uid)
    }

    let customer = await this.asaasClient.findCustomerByExternalReference(
      input.uid,
    )
    if (!customer) {
      customer = await this.asaasClient.createCustomer({
        name: input.uid,
        cpfCnpj: '',
        externalReference: input.uid,
      })
    }

    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 1)

    const subscription = await this.asaasClient.createSubscription({
      customer: customer.id,
      billingType: 'UNDEFINED',
      value: plan.priceCents / 100,
      cycle: 'MONTHLY',
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
    })

    await this.subscriptionRepository.create({
      tenantId: input.tenantId,
      uid: input.uid,
      planId: input.planId,
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      status: 'inactive',
    })

    return { paymentUrl: subscription.paymentLink ?? null }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/subscriptions/src/infrastructure/external/asaas services/subscriptions/src/application/subscriptions/create-checkout.usecase.ts services/subscriptions/src/application/subscriptions/create-checkout.usecase.test.ts
git commit -m "feat(subscriptions): add Asaas client wrapper and CreateCheckoutUseCase"
```

---

### Task 12: `ProcessWebhookUseCase`

**Files:**
- Create: `services/subscriptions/src/application/subscriptions/process-webhook.usecase.ts`
- Create: `services/subscriptions/src/application/subscriptions/process-webhook.usecase.test.ts` (testcontainers integration test)

**Interfaces:**
- Consumes: `ISubscriptionRepository` (Task 5), `GrantXpUseCase` (Task 10), `setRole`/`revokeRole` (`@clube/firebase-utils`).
- Produces: `ProcessWebhookUseCase.execute(event: AsaasWebhookEvent): Promise<void>`, `AsaasWebhookEvent` type. Consumed by Task 13 (`worker.ts`).

- [ ] **Step 1: Write the failing integration test**

Create `services/subscriptions/src/application/subscriptions/process-webhook.usecase.test.ts`:

```typescript
import { setRole } from '@clube/firebase-utils'
import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { schema } from '../../infrastructure/db/schema'
import { levels, plans } from '../../infrastructure/db/schema/subscriptions'
import { LevelRepository } from '../../infrastructure/db/repositories/level.repository'
import { SubscriptionRepository } from '../../infrastructure/db/repositories/subscription.repository'
import { GrantXpUseCase } from '../xp/grant-xp.usecase'
import { ProcessWebhookUseCase } from './process-webhook.usecase'

vi.mock('@clube/firebase-utils', () => ({
  setRole: vi.fn(),
  revokeRole: vi.fn(),
}))

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

describe('ProcessWebhookUseCase', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let subscriptionRepository: SubscriptionRepository
  let planId: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    subscriptionRepository = new SubscriptionRepository(db)

    const [plan] = await db
      .insert(plans)
      .values({ tenantId: TENANT_ID, name: 'Plano', priceCents: 1990, active: true })
      .returning({ id: plans.id })
    planId = plan.id

    await db
      .insert(levels)
      .values({ name: 'Bronze', minXp: 0, storeDiscountPct: '5', cashbackPct: '3' })
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function buildUseCase() {
    const levelRepository = new LevelRepository(db)
    const insertXpEvent = async () => {}
    const grantXpUseCase = new GrantXpUseCase(
      subscriptionRepository,
      levelRepository,
      insertXpEvent,
    )
    return new ProcessWebhookUseCase(subscriptionRepository, grantXpUseCase)
  }

  it('activates the subscriber, grants role, and grants XP on PAYMENT_CONFIRMED', async () => {
    const created = await subscriptionRepository.create({
      tenantId: TENANT_ID,
      uid: 'uid-confirmed',
      planId,
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_confirmed',
      status: 'inactive',
    })

    const usecase = buildUseCase()
    await usecase.execute({
      event: 'PAYMENT_CONFIRMED',
      payment: { subscription: 'asub_confirmed' },
    })

    const updated = await subscriptionRepository.findById(created.id)
    expect(updated?.status).toBe('active')
    expect(updated?.totalXp).toBe(50)
    expect(setRole).toHaveBeenCalledWith('uid-confirmed', 'subscriber', TENANT_ID)
  })

  it('marks the subscriber overdue and revokes the role on PAYMENT_OVERDUE', async () => {
    const { revokeRole } = await import('@clube/firebase-utils')
    const created = await subscriptionRepository.create({
      tenantId: TENANT_ID,
      uid: 'uid-overdue',
      planId,
      asaasCustomerId: 'cus_2',
      asaasSubscriptionId: 'asub_overdue',
      status: 'active',
    })

    const usecase = buildUseCase()
    await usecase.execute({
      event: 'PAYMENT_OVERDUE',
      payment: { subscription: 'asub_overdue' },
    })

    const updated = await subscriptionRepository.findById(created.id)
    expect(updated?.status).toBe('overdue')
    expect(revokeRole).toHaveBeenCalledWith('uid-overdue')
  })

  it('cancels the subscriber and revokes the role on SUBSCRIPTION_CANCELLED', async () => {
    const { revokeRole } = await import('@clube/firebase-utils')
    const created = await subscriptionRepository.create({
      tenantId: TENANT_ID,
      uid: 'uid-cancelled',
      planId,
      asaasCustomerId: 'cus_3',
      asaasSubscriptionId: 'asub_cancelled',
      status: 'active',
    })

    const usecase = buildUseCase()
    await usecase.execute({
      event: 'SUBSCRIPTION_CANCELLED',
      payment: { subscription: 'asub_cancelled' },
    })

    const updated = await subscriptionRepository.findById(created.id)
    expect(updated?.status).toBe('cancelled')
    expect(revokeRole).toHaveBeenCalledWith('uid-cancelled')
  })

  it('does nothing when no subscriber matches the Asaas subscription id', async () => {
    const usecase = buildUseCase()
    await expect(
      usecase.execute({
        event: 'PAYMENT_CONFIRMED',
        payment: { subscription: 'does-not-exist' },
      }),
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: FAIL — `./process-webhook.usecase` not found.

- [ ] **Step 3: Implement `ProcessWebhookUseCase`**

Create `services/subscriptions/src/application/subscriptions/process-webhook.usecase.ts`:

```typescript
import { revokeRole, setRole } from '@clube/firebase-utils'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'
import type { GrantXpUseCase } from '../xp/grant-xp.usecase'

export type AsaasWebhookEvent = {
  event: 'PAYMENT_CONFIRMED' | 'PAYMENT_OVERDUE' | 'SUBSCRIPTION_CANCELLED' | string
  payment: {
    subscription: string
  }
}

const SUBSCRIPTION_PAYMENT_XP = 50

export class ProcessWebhookUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly grantXpUseCase: GrantXpUseCase,
  ) {}

  async execute(event: AsaasWebhookEvent): Promise<void> {
    const subscription = await this.subscriptionRepository.findByAsaasSubscriptionId(
      event.payment.subscription,
    )
    if (!subscription) return

    switch (event.event) {
      case 'PAYMENT_CONFIRMED': {
        await this.subscriptionRepository.updateStatus(subscription.id, 'active')
        await setRole(subscription.uid, 'subscriber', subscription.tenantId)
        await this.grantXpUseCase.execute({
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: SUBSCRIPTION_PAYMENT_XP,
          source: 'subscription_payment',
        })
        return
      }
      case 'PAYMENT_OVERDUE': {
        await this.subscriptionRepository.updateStatus(subscription.id, 'overdue')
        await revokeRole(subscription.uid)
        return
      }
      case 'SUBSCRIPTION_CANCELLED': {
        await this.subscriptionRepository.updateStatus(subscription.id, 'cancelled')
        await revokeRole(subscription.uid)
        return
      }
      default:
        return
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@clube/subscriptions`
Expected: PASS (4 integration test cases).

- [ ] **Step 5: Commit**

```bash
git add services/subscriptions/src/application/subscriptions/process-webhook.usecase.ts services/subscriptions/src/application/subscriptions/process-webhook.usecase.test.ts
git commit -m "feat(subscriptions): add ProcessWebhookUseCase with role/status/XP orchestration"
```

---

### Task 13: BullMQ queue producer and worker

**Files:**
- Create: `services/subscriptions/src/infrastructure/queue/subscriptions.queue.ts`
- Create: `services/subscriptions/src/infrastructure/queue/worker.ts`

**Interfaces:**
- Consumes: `ProcessWebhookUseCase` (Task 12), `env.REDIS_URL` (Task 6).
- Produces: `subscriptionsQueue: Queue` (job name `'process-webhook'`), `startSubscriptionsWorker(processWebhookUseCase: ProcessWebhookUseCase): Worker`. Consumed by Task 14 (`routes/webhook.ts`) and Task 15 (`index.ts`).

- [ ] **Step 1: Implement the queue producer**

Create `services/subscriptions/src/infrastructure/queue/subscriptions.queue.ts`:

```typescript
import { Queue } from 'bullmq'
import { env } from '../../shared/env'
import type { AsaasWebhookEvent } from '../../application/subscriptions/process-webhook.usecase'

export const SUBSCRIPTIONS_QUEUE_NAME = 'subscriptions-queue'

export const subscriptionsQueue = new Queue<AsaasWebhookEvent>(
  SUBSCRIPTIONS_QUEUE_NAME,
  { connection: { url: env.REDIS_URL } },
)

export async function enqueueProcessWebhook(
  event: AsaasWebhookEvent,
): Promise<void> {
  await subscriptionsQueue.add('process-webhook', event)
}
```

- [ ] **Step 2: Implement the worker**

Create `services/subscriptions/src/infrastructure/queue/worker.ts`:

```typescript
import { Worker } from 'bullmq'
import { env } from '../../shared/env'
import type { ProcessWebhookUseCase } from '../../application/subscriptions/process-webhook.usecase'
import { SUBSCRIPTIONS_QUEUE_NAME } from './subscriptions.queue'

export function startSubscriptionsWorker(
  processWebhookUseCase: ProcessWebhookUseCase,
): Worker {
  return new Worker(
    SUBSCRIPTIONS_QUEUE_NAME,
    async (job) => {
      if (job.name === 'process-webhook') {
        await processWebhookUseCase.execute(job.data)
      }
    },
    { connection: { url: env.REDIS_URL } },
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add services/subscriptions/src/infrastructure/queue
git commit -m "feat(subscriptions): add BullMQ queue producer and worker for webhook processing"
```

---

### Task 14: HTTP layer — `proxy.ts`, `container.ts`, schemas, routes

**Files:**
- Modify: `services/subscriptions/src/infrastructure/http/proxy.ts`
- Create: `services/subscriptions/src/infrastructure/http/container.ts`
- Create: `services/subscriptions/src/infrastructure/http/schemas/plans.ts`
- Create: `services/subscriptions/src/infrastructure/http/schemas/subscriptions.ts`
- Create: `services/subscriptions/src/infrastructure/http/routes/plans.ts`
- Create: `services/subscriptions/src/infrastructure/http/routes/subscriptions.ts`
- Create: `services/subscriptions/src/infrastructure/http/routes/webhook.ts`

**Interfaces:**
- Consumes: everything from Tasks 6, 7, 9–13.
- Produces: `registerPlansRoutes(app, deps)`, `registerSubscriptionsRoutes(app, deps)`, `registerWebhookRoutes(app, deps)`; `subscriptionsAuthPreHandler`, `requireAuth`, `requireSubscriber` re-exported from `proxy.ts`. Consumed by Task 15 (`app.ts`).

- [ ] **Step 1: Update `proxy.ts`**

Replace `services/subscriptions/src/infrastructure/http/proxy.ts` with:

```typescript
import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const subscriptionsAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireSubscriber }
```

- [ ] **Step 2: Write TypeBox schemas**

Create `services/subscriptions/src/infrastructure/http/schemas/plans.ts`:

```typescript
import { Type } from '@sinclair/typebox'

export const PlanSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  priceCents: Type.Number(),
})

export const ListPlansResponseSchema = Type.Array(PlanSchema)
```

Create `services/subscriptions/src/infrastructure/http/schemas/subscriptions.ts`:

```typescript
import { Type } from '@sinclair/typebox'

export const CreateCheckoutBodySchema = Type.Object({
  planId: Type.String(),
})

export const CreateCheckoutResponseSchema = Type.Object({
  paymentUrl: Type.Union([Type.String(), Type.Null()]),
})

export const MySubscriptionResponseSchema = Type.Union([
  Type.Object({
    id: Type.String(),
    planId: Type.String(),
    status: Type.String(),
    totalXp: Type.Number(),
    levelId: Type.Union([Type.String(), Type.Null()]),
  }),
  Type.Null(),
])
```

- [ ] **Step 3: Write `routes/plans.ts`**

Create `services/subscriptions/src/infrastructure/http/routes/plans.ts`:

```typescript
import type { FastifyInstance } from 'fastify'
import type { ListPlansUseCase } from '../../../application/subscriptions/list-plans.usecase'
import { ListPlansResponseSchema } from '../schemas/plans'

export type PlansRouteDeps = {
  listPlansUseCase: ListPlansUseCase
}

export async function registerPlansRoutes(
  app: FastifyInstance,
  deps: PlansRouteDeps,
): Promise<void> {
  app.get(
    '/plans',
    { schema: { response: { 200: ListPlansResponseSchema } } },
    async (request, reply) => {
      const tenantId = request.headers['x-tenant-id']
      if (typeof tenantId !== 'string') {
        reply.status(400).send({
          error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
        })
        return
      }

      const plans = await deps.listPlansUseCase.execute({ tenantId })
      reply.status(200).send(
        plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          priceCents: plan.priceCents,
        })),
      )
    },
  )
}
```

> This route is public (no auth preHandler, matching step 15's "GET / (lista planos, público)"), but it still needs to know which tenant's plans to list. Since there's no end-user JWT to read `tenant_id` from on a public route, the caller (the BFF, per Task 16) passes it via the `x-tenant-id` header — the BFF already knows the tenant from its own host-based resolution.

- [ ] **Step 4: Write `routes/subscriptions.ts`**

Create `services/subscriptions/src/infrastructure/http/routes/subscriptions.ts`:

```typescript
import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateCheckoutUseCase } from '../../../application/subscriptions/create-checkout.usecase'
import type { ISubscriptionRepository } from '../../../domain/interfaces/ISubscriptionRepository'
import {
  CreateCheckoutBodySchema,
  CreateCheckoutResponseSchema,
  MySubscriptionResponseSchema,
} from '../schemas/subscriptions'

export type SubscriptionsRouteDeps = {
  subscriptionsAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  createCheckoutUseCase: CreateCheckoutUseCase
  subscriptionRepository: ISubscriptionRepository
}

export async function registerSubscriptionsRoutes(
  app: FastifyInstance,
  deps: SubscriptionsRouteDeps,
): Promise<void> {
  app.post(
    '/subscriptions/checkout',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireAuth],
      schema: {
        body: CreateCheckoutBodySchema,
        response: { 200: CreateCheckoutResponseSchema },
      },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser
      const { planId } = request.body as { planId: string }

      const result = await deps.createCheckoutUseCase.execute({
        uid: user.uid,
        tenantId: user.tenant_id as string,
        planId,
      })

      reply.status(200).send(result)
    },
  )

  app.get(
    '/subscriptions/me',
    {
      preHandler: [deps.subscriptionsAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: MySubscriptionResponseSchema } },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser

      const subscription = await deps.subscriptionRepository.findByUid(
        user.uid,
        user.tenant_id as string,
      )

      if (!subscription) {
        reply.status(200).send(null)
        return
      }

      reply.status(200).send({
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        totalXp: subscription.totalXp,
        levelId: subscription.levelId,
      })
    },
  )
}
```

- [ ] **Step 5: Write `routes/webhook.ts`**

Create `services/subscriptions/src/infrastructure/http/routes/webhook.ts`:

```typescript
import type { FastifyInstance } from 'fastify'
import type { AsaasWebhookEvent } from '../../../application/subscriptions/process-webhook.usecase'
import { env } from '../../../shared/env'

export type WebhookRouteDeps = {
  enqueueProcessWebhook: (event: AsaasWebhookEvent) => Promise<void>
}

export async function registerWebhookRoutes(
  app: FastifyInstance,
  deps: WebhookRouteDeps,
): Promise<void> {
  app.post('/webhook', async (request, reply) => {
    const token = request.headers['asaas-access-token']
    if (token !== env.ASAAS_WEBHOOK_TOKEN) {
      reply.status(401).send({
        error: { code: 'INVALID_WEBHOOK_TOKEN', message: 'Invalid webhook token' },
      })
      return
    }

    reply.status(200).send({ received: true })

    await deps.enqueueProcessWebhook(request.body as AsaasWebhookEvent)
  })
}
```

- [ ] **Step 6: Write `container.ts`**

Create `services/subscriptions/src/infrastructure/http/container.ts`:

```typescript
import { CreateCheckoutUseCase } from '../../application/subscriptions/create-checkout.usecase'
import { ListPlansUseCase } from '../../application/subscriptions/list-plans.usecase'
import { ProcessWebhookUseCase } from '../../application/subscriptions/process-webhook.usecase'
import { GrantXpUseCase } from '../../application/xp/grant-xp.usecase'
import { db } from '../db'
import { LevelRepository } from '../db/repositories/level.repository'
import { PlanRepository } from '../db/repositories/plan.repository'
import { SubscriptionRepository } from '../db/repositories/subscription.repository'
import { xpEvents } from '../db/schema/subscriptions'
import { getAsaasClient } from '../external/asaas/client'
import { enqueueProcessWebhook } from '../queue/subscriptions.queue'
import { requireAuth, subscriptionsAuthPreHandler } from './proxy'

export const subscriptionRepository = new SubscriptionRepository(db)
export const planRepository = new PlanRepository(db)
export const levelRepository = new LevelRepository(db)

export const listPlansUseCase = new ListPlansUseCase(planRepository)
export const createCheckoutUseCase = new CreateCheckoutUseCase(
  subscriptionRepository,
  planRepository,
  getAsaasClient(),
)

async function insertXpEvent(event: {
  tenantId: string
  subscriberId: string
  amount: number
  source: string
}): Promise<void> {
  await db.insert(xpEvents).values(event)
}

export const grantXpUseCase = new GrantXpUseCase(
  subscriptionRepository,
  levelRepository,
  insertXpEvent,
)
export const processWebhookUseCase = new ProcessWebhookUseCase(
  subscriptionRepository,
  grantXpUseCase,
)

export { subscriptionsAuthPreHandler, requireAuth, enqueueProcessWebhook }
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck --workspace=@clube/subscriptions`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add services/subscriptions/src/infrastructure/http
git commit -m "feat(subscriptions): add plans/subscriptions/webhook routes and container wiring"
```

---

### Task 15: Bootstrap — `app.ts`, `index.ts`

**Files:**
- Modify: `services/subscriptions/src/app.ts`
- Modify: `services/subscriptions/src/index.ts`

**Interfaces:**
- Consumes: `container.ts` exports (Task 14), `startSubscriptionsWorker` (Task 13).

- [ ] **Step 1: Update `app.ts`**

Replace `services/subscriptions/src/app.ts` with:

```typescript
import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  createCheckoutUseCase,
  enqueueProcessWebhook,
  listPlansUseCase,
  requireAuth,
  subscriptionRepository,
  subscriptionsAuthPreHandler,
} from './infrastructure/http/container'
import { registerPlansRoutes } from './infrastructure/http/routes/plans'
import { registerSubscriptionsRoutes } from './infrastructure/http/routes/subscriptions'
import { registerWebhookRoutes } from './infrastructure/http/routes/webhook'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Subscriptions')
  await registerHealth(app)
  await registerPlansRoutes(app, { listPlansUseCase })
  await registerSubscriptionsRoutes(app, {
    subscriptionsAuthPreHandler,
    requireAuth,
    createCheckoutUseCase,
    subscriptionRepository,
  })
  await registerWebhookRoutes(app, { enqueueProcessWebhook })

  return app
}
```

- [ ] **Step 2: Update `index.ts`**

Replace `services/subscriptions/src/index.ts` with:

```typescript
import { buildApp } from './app'
import { processWebhookUseCase } from './infrastructure/http/container'
import { startSubscriptionsWorker } from './infrastructure/queue/worker'
import { env } from './shared/env'

async function bootstrap() {
  const app = await buildApp()
  startSubscriptionsWorker(processWebhookUseCase)
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

bootstrap()
```

- [ ] **Step 3: Run the full test suite and typecheck**

Run: `npm run test --workspace=@clube/subscriptions && npm run typecheck --workspace=@clube/subscriptions`
Expected: PASS (existing `app.test.ts`'s `GET /health` case still passes — it doesn't touch any new route).

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev --workspace=@clube/subscriptions`
Expected: boots on port 3005, `/docs` (Scalar) lists `/plans`, `/subscriptions/checkout`, `/subscriptions/me`, `/webhook`, `/health`; logs show the BullMQ worker connected to Redis with no errors.

- [ ] **Step 5: Commit**

```bash
git add services/subscriptions/src/app.ts services/subscriptions/src/index.ts
git commit -m "feat(subscriptions): wire routes and BullMQ worker into the app bootstrap"
```

---

### Task 16: BFF delegation routes

**Files:**
- Modify: `apps/bff/.env.example`
- Modify: `apps/bff/src/shared/env.ts`
- Create: `apps/bff/src/infrastructure/http/routes/subscriptions.ts`
- Create: `apps/bff/src/infrastructure/http/routes/subscriptions.test.ts`
- Modify: `apps/bff/src/app.ts`

**Interfaces:**
- Produces: `registerSubscriptionsProxyRoutes(app, deps)` — thin HTTP proxy. Terminal task; nothing downstream consumes it.

- [ ] **Step 1: Add `SUBSCRIPTIONS_SERVICE_URL` to env**

In `apps/bff/.env.example`, add:

```bash
SUBSCRIPTIONS_SERVICE_URL=http://localhost:3005
```

In `apps/bff/src/shared/env.ts`, add to the `server` object:

```typescript
    SUBSCRIPTIONS_SERVICE_URL: z.string().url().default('http://localhost:3005'),
```

- [ ] **Step 2: Write the failing route test**

Create `apps/bff/src/infrastructure/http/routes/subscriptions.test.ts`, following the exact deps-injection mocking pattern already used in `apps/bff/src/infrastructure/http/routes/auth.test.ts` (a `buildTestApp` helper with fake `tenantAuthPreHandler`/`requireAuth` that stamp `request.tenant`/`request.user` directly, no real Firebase/DB involved):

```typescript
import Fastify, { type FastifyRequest } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type SubscriptionsProxyDeps,
  registerSubscriptionsProxyRoutes,
} from './subscriptions'

function buildTestApp(overrides: Partial<SubscriptionsProxyDeps> = {}) {
  const app = Fastify()
  const deps: SubscriptionsProxyDeps = {
    subscriptionsServiceUrl: 'http://localhost:3005',
    tenantAuthPreHandler: async (request: FastifyRequest) => {
      request.tenant = { id: 'tenant-1', slug: 'dev' }
    },
    requireAuth: async (request: FastifyRequest) => {
      request.user = {
        uid: 'firebase-uid-1',
        role: 'subscriber',
        tenant_id: 'tenant-1',
      }
    },
    ...overrides,
  }
  return { app, deps }
}

describe('subscriptions proxy routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards GET /v1/subscriptions/plans to the subscriptions service with x-tenant-id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => [{ id: 'plan-1', name: 'Mensal', priceCents: 1990 }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/subscriptions/plans',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3005/plans',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-tenant-id': 'tenant-1' }),
      }),
    )
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      { id: 'plan-1', name: 'Mensal', priceCents: 1990 },
    ])
  })

  it('forwards the Authorization header and body for POST /v1/subscriptions/checkout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ paymentUrl: 'https://pay.asaas.com/x' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/checkout',
      headers: { authorization: 'Bearer token-123' },
      payload: { planId: 'plan-1' },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3005/subscriptions/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer token-123',
          'content-type': 'application/json',
        }),
        body: JSON.stringify({ planId: 'plan-1' }),
      }),
    )
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ paymentUrl: 'https://pay.asaas.com/x' })
  })

  it('does not forward the request when requireAuth rejects it', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp({
      requireAuth: async (_request, reply) => {
        reply.status(401).send({
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        })
      },
    })
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'GET',
      url: '/v1/subscriptions/me',
    })

    expect(response.statusCode).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards POST /v1/subscriptions/webhook without requiring tenant/auth preHandlers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ received: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { app, deps } = buildTestApp()
    await registerSubscriptionsProxyRoutes(app, deps)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/webhook',
      headers: { 'asaas-access-token': 'webhook-token' },
      payload: { event: 'PAYMENT_CONFIRMED', payment: { subscription: 'asub_1' } },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3005/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'asaas-access-token': 'webhook-token' }),
      }),
    )
    expect(response.statusCode).toBe(200)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test --workspace=@clube/bff`
Expected: FAIL — `./subscriptions` route module not found.

- [ ] **Step 4: Implement the proxy routes**

Create `apps/bff/src/infrastructure/http/routes/subscriptions.ts`. `GET /plans` needs `tenantAuthPreHandler` (to populate `request.tenant.id` for the `x-tenant-id` header) but not `requireAuth` — CLAUDE.md step 15 marks the underlying `/plans` route as público. `POST /checkout` and `GET /me`/`me/xp` need both, matching `requireAuth` usage on those routes in `services/subscriptions`. `POST /webhook` needs neither (Asaas calls it directly, with its own token, not a Firebase JWT):

```typescript
import type { Tenant } from '@clube/fastify-plugins'
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from 'fastify'

export type SubscriptionsProxyDeps = {
  subscriptionsServiceUrl: string
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
}

async function forward(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: SubscriptionsProxyDeps,
  path: string,
): Promise<void> {
  const tenant = request.tenant as Tenant
  const headers: Record<string, string> = { 'x-tenant-id': tenant.id }

  const authorization = request.headers.authorization
  if (authorization) headers.authorization = authorization

  const init: RequestInit = { method: request.method, headers }
  if (request.method !== 'GET' && request.body !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(request.body)
  }

  const response = await fetch(`${deps.subscriptionsServiceUrl}${path}`, init)
  const body = await response.json()
  reply.status(response.status).send(body)
}

export async function registerSubscriptionsProxyRoutes(
  app: FastifyInstance,
  deps: SubscriptionsProxyDeps,
): Promise<void> {
  app.get(
    '/v1/subscriptions/plans',
    { preHandler: [deps.tenantAuthPreHandler] },
    async (request, reply) => {
      await forward(request, reply, deps, '/plans')
    },
  )

  app.post(
    '/v1/subscriptions/checkout',
    { preHandler: [deps.tenantAuthPreHandler, deps.requireAuth] },
    async (request, reply) => {
      await forward(request, reply, deps, '/subscriptions/checkout')
    },
  )

  app.get(
    '/v1/subscriptions/me',
    { preHandler: [deps.tenantAuthPreHandler, deps.requireAuth] },
    async (request, reply) => {
      await forward(request, reply, deps, '/subscriptions/me')
    },
  )

  app.get(
    '/v1/subscriptions/me/xp',
    { preHandler: [deps.tenantAuthPreHandler, deps.requireAuth] },
    async (request, reply) => {
      await forward(request, reply, deps, '/subscriptions/me')
    },
  )

  app.post('/v1/subscriptions/webhook', async (request, reply) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    const token = request.headers['asaas-access-token']
    if (typeof token === 'string') headers['asaas-access-token'] = token

    const response = await fetch(`${deps.subscriptionsServiceUrl}/webhook`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request.body),
    })
    const body = await response.json()
    reply.status(response.status).send(body)
  })
}
```

`GET /v1/subscriptions/me/xp` intentionally forwards to the same `/subscriptions/me` endpoint as `GET /v1/subscriptions/me` — `services/subscriptions` doesn't expose a separate XP-only endpoint (the `me` payload already includes `totalXp`/`levelId`), so there is nothing else to route it to.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/bff`
Expected: PASS.

- [ ] **Step 6: Register the routes in `app.ts`**

In `apps/bff/src/app.ts`, add the import and registration call next to `registerAuthRoutes`:

```typescript
import { registerSubscriptionsProxyRoutes } from './infrastructure/http/routes/subscriptions'
import { env } from './shared/env'
```

```typescript
  await registerSubscriptionsProxyRoutes(app, {
    subscriptionsServiceUrl: env.SUBSCRIPTIONS_SERVICE_URL,
    tenantAuthPreHandler,
    requireAuth,
  })
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run test --workspace=@clube/bff`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/bff/.env.example apps/bff/src/shared/env.ts apps/bff/src/infrastructure/http/routes/subscriptions.ts apps/bff/src/infrastructure/http/routes/subscriptions.test.ts apps/bff/src/app.ts
git commit -m "feat(bff): delegate /v1/subscriptions/* to the subscriptions service"
```

---

## Final Verification

- [ ] Run `npm run typecheck` (whole repo) — expect PASS.
- [ ] Run `npm run test` (whole repo) — expect PASS. Docker must be running for the testcontainers-based tests (`services/subscriptions` repositories + `ProcessWebhookUseCase`, `apps/bff` repositories).
- [ ] Run `npm run lint` — expect PASS (fix any Biome formatting issues before considering the plan done).
- [ ] Manually run `npm run seed:levels --workspace=@clube/subscriptions`, then insert a dev plan via `psql` or a short one-off script, then boot `npm run dev` and hit `GET http://localhost:3005/plans` with an `x-tenant-id` header to confirm the end-to-end wiring works before calling this done.
