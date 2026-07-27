# Super Admin — Módulo Tenants (Fase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Super admin can list, create (onboard), suspend/activate, and impersonate tenants (lojistas) through a dedicated `apps/super-admin` Next.js app backed by new `/v1/super/tenants` routes on `apps/bff`.

**Architecture:** BFF gets a new tenant-less auth path (`createFirebaseAuthPreHandler` + `requireSuperAdmin`, no `tenantAuthPreHandler`) and a `super-tenants` route group calling five new usecases against an extended `ITenantRepository`. `apps/super-admin` is scaffolded to parity with `apps/admin` (Firebase client, api-client, Zustand auth store, React Query) but reads its role from the Firebase ID token's custom claims directly instead of calling `/v1/auth/me` (which requires a resolved tenant this app doesn't have). `apps/admin` gets one new public page to accept impersonation custom tokens.

**Tech Stack:** Fastify, TypeBox, Drizzle ORM, Vitest + testcontainers, Next.js 14 App Router, React Query, react-hook-form + Zod, Zustand, Firebase Auth (client + admin SDK).

## Global Constraints

- TypeScript `strict: true`, no `any` (per project CLAUDE.md).
- Named exports only in services/usecases — no `export default` (project convention), except Next.js `page.tsx`/`layout.tsx` files which Next.js requires as default exports.
- Routes contain zero business logic — only schema + preHandler + usecase call.
- Every DomainError extends `DomainError` from `apps/bff/src/domain/errors/domain-error.ts` — never throw string/generic Error.
- `x-tenant-slug` header must NOT be sent by the super-admin api-client — this app never resolves a tenant.
- Commit after each task's tests pass.

---

## Backend (apps/bff)

### Task 1: Domain errors — TenantNotFoundError, SlugAlreadyTakenError

**Files:**
- Create: `apps/bff/src/domain/errors/tenant-not-found.error.ts`
- Create: `apps/bff/src/domain/errors/tenant-not-found.error.test.ts`
- Create: `apps/bff/src/domain/errors/slug-already-taken.error.ts`
- Create: `apps/bff/src/domain/errors/slug-already-taken.error.test.ts`

**Interfaces:**
- Produces: `TenantNotFoundError(id: string)` → code `TENANT_NOT_FOUND`, status 404. `SlugAlreadyTakenError(slug: string)` → code `SLUG_ALREADY_TAKEN`, status 409.

- [ ] **Step 1: Write failing tests**

```typescript
// apps/bff/src/domain/errors/tenant-not-found.error.test.ts
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'
import { TenantNotFoundError } from './tenant-not-found.error'

describe('TenantNotFoundError', () => {
  it('carries the right code and status', () => {
    const error = new TenantNotFoundError('tenant-1')

    expect(error.message).toBe('Tenant tenant-1 not found')
    expect(error.code).toBe('TENANT_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(DomainError)
  })
})
```

```typescript
// apps/bff/src/domain/errors/slug-already-taken.error.test.ts
import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'
import { SlugAlreadyTakenError } from './slug-already-taken.error'

describe('SlugAlreadyTakenError', () => {
  it('carries the right code and status', () => {
    const error = new SlugAlreadyTakenError('acme')

    expect(error.message).toBe('Slug acme is already taken')
    expect(error.code).toBe('SLUG_ALREADY_TAKEN')
    expect(error.statusCode).toBe(409)
    expect(error).toBeInstanceOf(DomainError)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test --filter=@clube/bff -- tenant-not-found.error slug-already-taken.error`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// apps/bff/src/domain/errors/tenant-not-found.error.ts
import { DomainError } from './domain-error'

export class TenantNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Tenant ${id} not found`, 'TENANT_NOT_FOUND', 404)
  }
}
```

```typescript
// apps/bff/src/domain/errors/slug-already-taken.error.ts
import { DomainError } from './domain-error'

export class SlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super(`Slug ${slug} is already taken`, 'SLUG_ALREADY_TAKEN', 409)
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm run test --filter=@clube/bff -- tenant-not-found.error slug-already-taken.error`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/domain/errors/tenant-not-found.error.ts apps/bff/src/domain/errors/tenant-not-found.error.test.ts apps/bff/src/domain/errors/slug-already-taken.error.ts apps/bff/src/domain/errors/slug-already-taken.error.test.ts
git commit -m "feat(bff): add TenantNotFoundError and SlugAlreadyTakenError"
```

---

### Task 2: Extend ITenantRepository + TenantRepository (list, findById, updateStatus, countUsers)

**Files:**
- Modify: `apps/bff/src/domain/interfaces/ITenantRepository.ts`
- Modify: `apps/bff/src/infrastructure/db/repositories/tenant.repository.ts`
- Modify: `apps/bff/src/infrastructure/db/repositories/__tests__/tenant.repository.test.ts`

**Interfaces:**
- Consumes: `Tenant` entity (`apps/bff/src/domain/entities/tenant.ts`) — unchanged.
- Produces: `ITenantRepository.list(): Promise<Tenant[]>`, `.findById(id: string): Promise<Tenant | null>`, `.updateStatus(id: string, status: TenantStatus): Promise<Tenant>`, `.countUsers(id: string): Promise<number>`. Task 3-7 usecases depend on these exact names.

- [ ] **Step 1: Write failing repository tests**

Add to the end of `apps/bff/src/infrastructure/db/repositories/__tests__/tenant.repository.test.ts` (inside the existing `describe('TenantRepository', ...)` block, after the last `it`):

```typescript
  it('lists all tenants', async () => {
    const before = await repository.list()
    await repository.create({ slug: 'list-me', name: 'List Me', ownerUid: 'owner-list' })

    const after = await repository.list()

    expect(after.length).toBe(before.length + 1)
    expect(after.some((t) => t.slug === 'list-me')).toBe(true)
  })

  it('finds a tenant by id', async () => {
    const created = await repository.create({ slug: 'by-id', name: 'By Id', ownerUid: 'owner-id' })

    const found = await repository.findById(created.id)

    expect(found?.slug).toBe('by-id')
  })

  it('returns null when finding by an unknown id', async () => {
    const found = await repository.findById('00000000-0000-0000-0000-000000000000')
    expect(found).toBeNull()
  })

  it('updates tenant status', async () => {
    const created = await repository.create({ slug: 'to-suspend', name: 'To Suspend', ownerUid: 'owner-sus' })

    const updated = await repository.updateStatus(created.id, 'suspended')

    expect(updated.status).toBe('suspended')
    const found = await repository.findById(created.id)
    expect(found?.status).toBe('suspended')
  })

  it('counts users belonging to a tenant', async () => {
    const created = await repository.create({ slug: 'with-users', name: 'With Users', ownerUid: 'owner-cnt' })
    await db.insert(users).values([
      { tenantId: created.id, uid: 'user-a', role: 'user' },
      { tenantId: created.id, uid: 'user-b', role: 'subscriber' },
    ])

    const count = await repository.countUsers(created.id)

    expect(count).toBe(2)
  })
```

Add `users` to the existing import from `../../schema/tenants` at the top of the file:

```typescript
import { domains, users } from '../../schema/tenants'
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test --filter=@clube/bff -- tenant.repository.test`
Expected: FAIL — `repository.list is not a function` (and similarly for the other new methods).

- [ ] **Step 3: Extend the interface**

In `apps/bff/src/domain/interfaces/ITenantRepository.ts`, add after `create`:

```typescript
import type { TenantStatus } from '../entities/tenant'
```

(add to the existing `import type { Tenant } from '../entities/tenant'` line — change it to `import type { Tenant, TenantStatus } from '../entities/tenant'`)

```typescript
export interface ITenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>
  findByDomain(domain: string): Promise<Tenant | null>
  create(data: CreateTenantDto): Promise<Tenant>
  list(): Promise<Tenant[]>
  findById(id: string): Promise<Tenant | null>
  updateStatus(id: string, status: TenantStatus): Promise<Tenant>
  countUsers(id: string): Promise<number>
}
```

- [ ] **Step 4: Implement in TenantRepository**

Add to `apps/bff/src/infrastructure/db/repositories/tenant.repository.ts`. Change the import line to include `count` and `users`:

```typescript
import { count, eq } from 'drizzle-orm'
```

and

```typescript
import { domains, tenants, users } from '../schema/tenants'
```

Add these methods to the `TenantRepository` class, after `create`:

```typescript
  async list(): Promise<Tenant[]> {
    const rows = await this.db.select().from(tenants)
    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async updateStatus(id: string, status: TenantRow['status']): Promise<Tenant> {
    const [row] = await this.db
      .update(tenants)
      .set({ status })
      .where(eq(tenants.id, id))
      .returning()

    return toDomain(row as TenantRow)
  }

  async countUsers(id: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(users)
      .where(eq(users.tenantId, id))

    return row?.value ?? 0
  }
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm run test --filter=@clube/bff -- tenant.repository.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/bff/src/domain/interfaces/ITenantRepository.ts apps/bff/src/infrastructure/db/repositories/tenant.repository.ts apps/bff/src/infrastructure/db/repositories/__tests__/tenant.repository.test.ts
git commit -m "feat(bff): add list/findById/updateStatus/countUsers to ITenantRepository"
```

---

### Task 3: ListTenantsUseCase

**Files:**
- Create: `apps/bff/src/application/super-tenants/list-tenants.usecase.ts`
- Create: `apps/bff/src/application/super-tenants/list-tenants.usecase.test.ts`

**Interfaces:**
- Consumes: `ITenantRepository.list()`, `.countUsers(id)`.
- Produces: `ListTenantsUseCase.execute(): Promise<{ tenant: Tenant; memberCount: number }[]>`. Route in Task 9 depends on this exact shape.

- [ ] **Step 1: Write failing test**

```typescript
// apps/bff/src/application/super-tenants/list-tenants.usecase.test.ts
import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { ListTenantsUseCase } from './list-tenants.usecase'

function fakeTenant(id: string, slug: string): Tenant {
  return Tenant.create({
    id,
    slug,
    name: `Tenant ${slug}`,
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: `owner-${slug}`,
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('ListTenantsUseCase', () => {
  it('returns tenants with their member counts', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn().mockResolvedValue([fakeTenant('t1', 'acme'), fakeTenant('t2', 'beta')]),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      countUsers: vi.fn().mockImplementation((id: string) => Promise.resolve(id === 't1' ? 3 : 0)),
    }
    const useCase = new ListTenantsUseCase(repository)

    const result = await useCase.execute()

    expect(result).toEqual([
      { tenant: expect.objectContaining({ id: 't1' }), memberCount: 3 },
      { tenant: expect.objectContaining({ id: 't2' }), memberCount: 0 },
    ])
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test --filter=@clube/bff -- list-tenants.usecase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// apps/bff/src/application/super-tenants/list-tenants.usecase.ts
import type { Tenant } from '../../domain/entities/tenant'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export type TenantWithMemberCount = {
  tenant: Tenant
  memberCount: number
}

export class ListTenantsUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(): Promise<TenantWithMemberCount[]> {
    const tenants = await this.tenantRepository.list()

    return Promise.all(
      tenants.map(async (tenant) => ({
        tenant,
        memberCount: await this.tenantRepository.countUsers(tenant.id),
      })),
    )
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test --filter=@clube/bff -- list-tenants.usecase`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/application/super-tenants/list-tenants.usecase.ts apps/bff/src/application/super-tenants/list-tenants.usecase.test.ts
git commit -m "feat(bff): add ListTenantsUseCase"
```

---

### Task 4: GetTenantUseCase

**Files:**
- Create: `apps/bff/src/application/super-tenants/get-tenant.usecase.ts`
- Create: `apps/bff/src/application/super-tenants/get-tenant.usecase.test.ts`

**Interfaces:**
- Consumes: `ITenantRepository.findById(id)`, `.countUsers(id)`, `TenantNotFoundError` (Task 1).
- Produces: `GetTenantUseCase.execute(id: string): Promise<TenantWithMemberCount>` (same shape as Task 3).

- [ ] **Step 1: Write failing test**

```typescript
// apps/bff/src/application/super-tenants/get-tenant.usecase.test.ts
import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { GetTenantUseCase } from './get-tenant.usecase'

function fakeTenant(): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('GetTenantUseCase', () => {
  it('returns the tenant with its member count', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant()),
      updateStatus: vi.fn(),
      countUsers: vi.fn().mockResolvedValue(5),
    }
    const useCase = new GetTenantUseCase(repository)

    const result = await useCase.execute('tenant-1')

    expect(result.tenant.id).toBe('tenant-1')
    expect(result.memberCount).toBe(5)
  })

  it('throws TenantNotFoundError when the tenant does not exist', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new GetTenantUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(TenantNotFoundError)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test --filter=@clube/bff -- get-tenant.usecase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// apps/bff/src/application/super-tenants/get-tenant.usecase.ts
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import type { TenantWithMemberCount } from './list-tenants.usecase'

export class GetTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(id: string): Promise<TenantWithMemberCount> {
    const tenant = await this.tenantRepository.findById(id)
    if (!tenant) {
      throw new TenantNotFoundError(id)
    }

    const memberCount = await this.tenantRepository.countUsers(id)
    return { tenant, memberCount }
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test --filter=@clube/bff -- get-tenant.usecase`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/application/super-tenants/get-tenant.usecase.ts apps/bff/src/application/super-tenants/get-tenant.usecase.test.ts
git commit -m "feat(bff): add GetTenantUseCase"
```

---

### Task 5: CreateTenantUseCase

**Files:**
- Create: `apps/bff/src/application/super-tenants/create-tenant.usecase.ts`
- Create: `apps/bff/src/application/super-tenants/create-tenant.usecase.test.ts`

**Interfaces:**
- Consumes: `ITenantRepository.findBySlug`, `.create`; `IUserRepository.create` (`apps/bff/src/domain/interfaces/IUserRepository.ts`, already exists); `setRole` from `@clube/firebase-utils`; `SlugAlreadyTakenError` (Task 1).
- Produces: `CreateTenantUseCase.execute(input: CreateTenantInput): Promise<Tenant>` where `CreateTenantInput = { slug: string; name: string; ownerUid: string; logoUrl?: string | null }`. Route in Task 9 depends on this signature.

- [ ] **Step 1: Write failing test**

```typescript
// apps/bff/src/application/super-tenants/create-tenant.usecase.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setRole } = vi.hoisted(() => ({ setRole: vi.fn() }))
vi.mock('@clube/firebase-utils', () => ({ setRole }))

import { Tenant } from '../../domain/entities/tenant'
import { SlugAlreadyTakenError } from '../../domain/errors/slug-already-taken.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { CreateTenantUseCase } from './create-tenant.usecase'

function fakeTenant(): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('CreateTenantUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the tenant, registers the owner user and sets the Firebase role', async () => {
    const tenantRepository: ITenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
      findByDomain: vi.fn(),
      create: vi.fn().mockResolvedValue(fakeTenant()),
      list: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const userRepository: IUserRepository = {
      findByUid: vi.fn(),
      create: vi.fn().mockResolvedValue({}),
    }
    const useCase = new CreateTenantUseCase(tenantRepository, userRepository)

    const tenant = await useCase.execute({ slug: 'acme', name: 'Acme', ownerUid: 'owner-1' })

    expect(tenant.id).toBe('tenant-1')
    expect(tenantRepository.create).toHaveBeenCalledWith({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-1',
      logoUrl: null,
    })
    expect(userRepository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'owner-1',
      role: 'store_owner',
    })
    expect(setRole).toHaveBeenCalledWith('owner-1', 'store_owner', 'tenant-1')
  })

  it('throws SlugAlreadyTakenError when the slug is already in use', async () => {
    const tenantRepository: ITenantRepository = {
      findBySlug: vi.fn().mockResolvedValue(fakeTenant()),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const userRepository: IUserRepository = { findByUid: vi.fn(), create: vi.fn() }
    const useCase = new CreateTenantUseCase(tenantRepository, userRepository)

    await expect(
      useCase.execute({ slug: 'acme', name: 'Acme', ownerUid: 'owner-1' }),
    ).rejects.toBeInstanceOf(SlugAlreadyTakenError)
    expect(tenantRepository.create).not.toHaveBeenCalled()
    expect(setRole).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test --filter=@clube/bff -- create-tenant.usecase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// apps/bff/src/application/super-tenants/create-tenant.usecase.ts
import { setRole } from '@clube/firebase-utils'
import type { Tenant } from '../../domain/entities/tenant'
import { SlugAlreadyTakenError } from '../../domain/errors/slug-already-taken.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export type CreateTenantInput = {
  slug: string
  name: string
  ownerUid: string
  logoUrl?: string | null
}

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: CreateTenantInput): Promise<Tenant> {
    const existing = await this.tenantRepository.findBySlug(input.slug)
    if (existing) {
      throw new SlugAlreadyTakenError(input.slug)
    }

    const tenant = await this.tenantRepository.create({
      slug: input.slug,
      name: input.name,
      ownerUid: input.ownerUid,
      logoUrl: input.logoUrl ?? null,
    })

    await this.userRepository.create({
      tenantId: tenant.id,
      uid: input.ownerUid,
      role: 'store_owner',
    })

    await setRole(input.ownerUid, 'store_owner', tenant.id)

    return tenant
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test --filter=@clube/bff -- create-tenant.usecase`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/application/super-tenants/create-tenant.usecase.ts apps/bff/src/application/super-tenants/create-tenant.usecase.test.ts
git commit -m "feat(bff): add CreateTenantUseCase"
```

---

### Task 6: UpdateTenantStatusUseCase

**Files:**
- Create: `apps/bff/src/application/super-tenants/update-tenant-status.usecase.ts`
- Create: `apps/bff/src/application/super-tenants/update-tenant-status.usecase.test.ts`

**Interfaces:**
- Consumes: `ITenantRepository.findById`, `.updateStatus`; `TenantNotFoundError` (Task 1).
- Produces: `UpdateTenantStatusUseCase.execute(id: string, status: 'active' | 'suspended'): Promise<Tenant>`.

- [ ] **Step 1: Write failing test**

```typescript
// apps/bff/src/application/super-tenants/update-tenant-status.usecase.test.ts
import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { UpdateTenantStatusUseCase } from './update-tenant-status.usecase'

function fakeTenant(status: 'active' | 'suspended' = 'active'): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status,
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('UpdateTenantStatusUseCase', () => {
  it('updates the status of an existing tenant', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant('active')),
      updateStatus: vi.fn().mockResolvedValue(fakeTenant('suspended')),
      countUsers: vi.fn(),
    }
    const useCase = new UpdateTenantStatusUseCase(repository)

    const result = await useCase.execute('tenant-1', 'suspended')

    expect(result.status).toBe('suspended')
    expect(repository.updateStatus).toHaveBeenCalledWith('tenant-1', 'suspended')
  })

  it('throws TenantNotFoundError when the tenant does not exist', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new UpdateTenantStatusUseCase(repository)

    await expect(useCase.execute('missing', 'suspended')).rejects.toBeInstanceOf(
      TenantNotFoundError,
    )
    expect(repository.updateStatus).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test --filter=@clube/bff -- update-tenant-status.usecase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// apps/bff/src/application/super-tenants/update-tenant-status.usecase.ts
import type { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export class UpdateTenantStatusUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(id: string, status: 'active' | 'suspended'): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id)
    if (!tenant) {
      throw new TenantNotFoundError(id)
    }

    return this.tenantRepository.updateStatus(id, status)
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test --filter=@clube/bff -- update-tenant-status.usecase`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/application/super-tenants/update-tenant-status.usecase.ts apps/bff/src/application/super-tenants/update-tenant-status.usecase.test.ts
git commit -m "feat(bff): add UpdateTenantStatusUseCase"
```

---

### Task 7: ImpersonateTenantUseCase

**Files:**
- Create: `apps/bff/src/application/super-tenants/impersonate-tenant.usecase.ts`
- Create: `apps/bff/src/application/super-tenants/impersonate-tenant.usecase.test.ts`

**Interfaces:**
- Consumes: `ITenantRepository.findById`; `TenantNotFoundError` (Task 1); `getAuth().createCustomToken` (`firebase-admin/auth`), `getFirebaseApp` (`@clube/firebase-utils`).
- Produces: `ImpersonateTenantUseCase.execute(tenantId: string, superAdminUid: string): Promise<{ token: string; ownerUid: string; slug: string }>`.

- [ ] **Step 1: Write failing test**

```typescript
// apps/bff/src/application/super-tenants/impersonate-tenant.usecase.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createCustomToken, getAuth, getFirebaseApp } = vi.hoisted(() => ({
  createCustomToken: vi.fn().mockResolvedValue('custom-token-123'),
  getAuth: vi.fn(),
  getFirebaseApp: vi.fn().mockReturnValue({}),
}))
getAuth.mockReturnValue({ createCustomToken })
vi.mock('firebase-admin/auth', () => ({ getAuth }))
vi.mock('@clube/firebase-utils', () => ({ getFirebaseApp }))

import { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { ImpersonateTenantUseCase } from './impersonate-tenant.usecase'

function fakeTenant(): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('ImpersonateTenantUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createCustomToken.mockResolvedValue('custom-token-123')
    getAuth.mockReturnValue({ createCustomToken })
  })

  it('mints a custom token for the tenant owner', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(fakeTenant()),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new ImpersonateTenantUseCase(repository)

    const result = await useCase.execute('tenant-1', 'super-admin-uid')

    expect(result).toEqual({ token: 'custom-token-123', ownerUid: 'owner-1', slug: 'acme' })
    expect(createCustomToken).toHaveBeenCalledWith('owner-1', {
      impersonated_by: 'super-admin-uid',
    })
  })

  it('throws TenantNotFoundError when the tenant does not exist', async () => {
    const repository: ITenantRepository = {
      findBySlug: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      countUsers: vi.fn(),
    }
    const useCase = new ImpersonateTenantUseCase(repository)

    await expect(useCase.execute('missing', 'super-admin-uid')).rejects.toBeInstanceOf(
      TenantNotFoundError,
    )
    expect(createCustomToken).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test --filter=@clube/bff -- impersonate-tenant.usecase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// apps/bff/src/application/super-tenants/impersonate-tenant.usecase.ts
import { getFirebaseApp } from '@clube/firebase-utils'
import { getAuth } from 'firebase-admin/auth'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export type ImpersonateResult = {
  token: string
  ownerUid: string
  slug: string
}

export class ImpersonateTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(tenantId: string, superAdminUid: string): Promise<ImpersonateResult> {
    const tenant = await this.tenantRepository.findById(tenantId)
    if (!tenant) {
      throw new TenantNotFoundError(tenantId)
    }

    const token = await getAuth(getFirebaseApp()).createCustomToken(tenant.ownerUid, {
      impersonated_by: superAdminUid,
    })

    return { token, ownerUid: tenant.ownerUid, slug: tenant.slug }
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test --filter=@clube/bff -- impersonate-tenant.usecase`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/bff/src/application/super-tenants/impersonate-tenant.usecase.ts apps/bff/src/application/super-tenants/impersonate-tenant.usecase.test.ts
git commit -m "feat(bff): add ImpersonateTenantUseCase"
```

---

### Task 8: TypeBox schemas for super-tenants routes

**Files:**
- Create: `apps/bff/src/infrastructure/http/schemas/super-tenants.ts`

**Interfaces:**
- Produces: `TenantSchema`, `TenantWithMemberCountSchema`, `ListTenantsResponseSchema`, `CreateTenantBodySchema`, `UpdateTenantStatusBodySchema`, `ImpersonateResponseSchema`, `ErrorResponseSchema`. Task 9 routes import these.

- [ ] **Step 1: Write the schemas (no test — pure TypeBox declarations, exercised by Task 9's route tests)**

```typescript
// apps/bff/src/infrastructure/http/schemas/super-tenants.ts
import { Type } from '@sinclair/typebox'

export const TenantSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  logoUrl: Type.Union([Type.String(), Type.Null()]),
  planId: Type.Union([Type.String(), Type.Null()]),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('suspended'),
    Type.Literal('canceled'),
  ]),
  ownerUid: Type.String(),
  createdAt: Type.String(),
})

export const TenantWithMemberCountSchema = Type.Object({
  tenant: TenantSchema,
  memberCount: Type.Number(),
})

export const ListTenantsResponseSchema = Type.Array(TenantWithMemberCountSchema)

export const CreateTenantBodySchema = Type.Object({
  slug: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  ownerUid: Type.String({ minLength: 1 }),
  logoUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export const UpdateTenantStatusBodySchema = Type.Object({
  status: Type.Union([Type.Literal('active'), Type.Literal('suspended')]),
})

export const ImpersonateResponseSchema = Type.Object({
  token: Type.String(),
  ownerUid: Type.String(),
  slug: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/bff/src/infrastructure/http/schemas/super-tenants.ts
git commit -m "feat(bff): add TypeBox schemas for super-tenants routes"
```

---

### Task 9: Routes + container + app wiring

**Files:**
- Create: `apps/bff/src/infrastructure/http/routes/super-tenants.ts`
- Create: `apps/bff/src/infrastructure/http/routes/super-tenants.test.ts`
- Modify: `apps/bff/src/infrastructure/http/container.ts`
- Modify: `apps/bff/src/app.ts`

**Interfaces:**
- Consumes: all five usecases (Tasks 3-7), schemas (Task 8), `createFirebaseAuthPreHandler`/`requireSuperAdmin` from `@clube/fastify-plugins`.
- Produces: registered routes under `/v1/super/tenants*`.

- [ ] **Step 1: Write the route file**

```typescript
// apps/bff/src/infrastructure/http/routes/super-tenants.ts
import type { AuthenticatedUser } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { CreateTenantUseCase } from '../../../application/super-tenants/create-tenant.usecase'
import type { GetTenantUseCase } from '../../../application/super-tenants/get-tenant.usecase'
import type { ImpersonateTenantUseCase } from '../../../application/super-tenants/impersonate-tenant.usecase'
import type { ListTenantsUseCase } from '../../../application/super-tenants/list-tenants.usecase'
import type { UpdateTenantStatusUseCase } from '../../../application/super-tenants/update-tenant-status.usecase'
import {
  CreateTenantBodySchema,
  ErrorResponseSchema,
  ImpersonateResponseSchema,
  ListTenantsResponseSchema,
  TenantSchema,
  TenantWithMemberCountSchema,
  UpdateTenantStatusBodySchema,
} from '../schemas/super-tenants'

function serializeTenant(tenant: {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  planId: string | null
  status: string
  ownerUid: string
  createdAt: Date
}) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    logoUrl: tenant.logoUrl,
    planId: tenant.planId,
    status: tenant.status,
    ownerUid: tenant.ownerUid,
    createdAt: tenant.createdAt.toISOString(),
  }
}

export type SuperTenantsRouteDeps = {
  superAuthPreHandler: preHandlerHookHandler
  requireSuperAdmin: preHandlerHookHandler
  listTenantsUseCase: ListTenantsUseCase
  getTenantUseCase: GetTenantUseCase
  createTenantUseCase: CreateTenantUseCase
  updateTenantStatusUseCase: UpdateTenantStatusUseCase
  impersonateTenantUseCase: ImpersonateTenantUseCase
}

export async function registerSuperTenantsRoutes(
  app: FastifyInstance,
  deps: SuperTenantsRouteDeps,
): Promise<void> {
  const preHandler = [deps.superAuthPreHandler, deps.requireSuperAdmin]

  app.get(
    '/v1/super/tenants',
    { preHandler, schema: { response: { 200: ListTenantsResponseSchema } } },
    async (_request, reply) => {
      const results = await deps.listTenantsUseCase.execute()
      reply.status(200).send(
        results.map(({ tenant, memberCount }) => ({
          tenant: serializeTenant(tenant),
          memberCount,
        })),
      )
    },
  )

  app.post(
    '/v1/super/tenants',
    {
      preHandler,
      schema: { body: CreateTenantBodySchema, response: { 201: TenantSchema } },
    },
    async (request, reply) => {
      const body = request.body as {
        slug: string
        name: string
        ownerUid: string
        logoUrl?: string | null
      }
      const tenant = await deps.createTenantUseCase.execute(body)
      reply.status(201).send(serializeTenant(tenant))
    },
  )

  app.get(
    '/v1/super/tenants/:id',
    {
      preHandler,
      schema: { response: { 200: TenantWithMemberCountSchema, 404: ErrorResponseSchema } },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { tenant, memberCount } = await deps.getTenantUseCase.execute(id)
      reply.status(200).send({ tenant: serializeTenant(tenant), memberCount })
    },
  )

  app.patch(
    '/v1/super/tenants/:id/status',
    {
      preHandler,
      schema: {
        body: UpdateTenantStatusBodySchema,
        response: { 200: TenantSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: 'active' | 'suspended' }
      const tenant = await deps.updateTenantStatusUseCase.execute(id, status)
      reply.status(200).send(serializeTenant(tenant))
    },
  )

  app.post(
    '/v1/super/tenants/:id/impersonate',
    {
      preHandler,
      schema: { response: { 200: ImpersonateResponseSchema, 404: ErrorResponseSchema } },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user as AuthenticatedUser
      const result = await deps.impersonateTenantUseCase.execute(id, user.uid)
      reply.status(200).send(result)
    },
  )
}
```

- [ ] **Step 2: Write route tests**

```typescript
// apps/bff/src/infrastructure/http/routes/super-tenants.test.ts
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { Tenant } from '../../../domain/entities/tenant'
import { TenantNotFoundError } from '../../../domain/errors/tenant-not-found.error'
import type { CreateTenantUseCase } from '../../../application/super-tenants/create-tenant.usecase'
import type { GetTenantUseCase } from '../../../application/super-tenants/get-tenant.usecase'
import type { ImpersonateTenantUseCase } from '../../../application/super-tenants/impersonate-tenant.usecase'
import type { ListTenantsUseCase } from '../../../application/super-tenants/list-tenants.usecase'
import type { UpdateTenantStatusUseCase } from '../../../application/super-tenants/update-tenant-status.usecase'
import { registerErrorHandler } from '@clube/fastify-plugins'
import { type SuperTenantsRouteDeps, registerSuperTenantsRoutes } from './super-tenants'

function fakeTenant(): Tenant {
  return Tenant.create({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    logoUrl: null,
    planId: null,
    status: 'active',
    ownerUid: 'owner-1',
    settings: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

async function buildTestApp(overrides: Partial<SuperTenantsRouteDeps> = {}) {
  const app = Fastify()
  await registerErrorHandler(app)

  const deps: SuperTenantsRouteDeps = {
    superAuthPreHandler: async (request: FastifyRequest) => {
      request.user = { uid: 'super-admin-1', role: 'super_admin', tenant_id: null }
    },
    requireSuperAdmin: async () => {},
    listTenantsUseCase: {
      execute: vi.fn().mockResolvedValue([{ tenant: fakeTenant(), memberCount: 2 }]),
    } as unknown as ListTenantsUseCase,
    getTenantUseCase: {
      execute: vi.fn().mockResolvedValue({ tenant: fakeTenant(), memberCount: 2 }),
    } as unknown as GetTenantUseCase,
    createTenantUseCase: {
      execute: vi.fn().mockResolvedValue(fakeTenant()),
    } as unknown as CreateTenantUseCase,
    updateTenantStatusUseCase: {
      execute: vi.fn().mockResolvedValue(fakeTenant()),
    } as unknown as UpdateTenantStatusUseCase,
    impersonateTenantUseCase: {
      execute: vi.fn().mockResolvedValue({ token: 'tok', ownerUid: 'owner-1', slug: 'acme' }),
    } as unknown as ImpersonateTenantUseCase,
    ...overrides,
  }
  await registerSuperTenantsRoutes(app, deps)
  return { app, deps }
}

describe('super-tenants routes', () => {
  it('GET /v1/super/tenants returns the list with member counts', async () => {
    const { app } = await buildTestApp()

    const response = await app.inject({ method: 'GET', url: '/v1/super/tenants' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      { tenant: expect.objectContaining({ id: 'tenant-1' }), memberCount: 2 },
    ])
  })

  it('POST /v1/super/tenants creates a tenant', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/v1/super/tenants',
      payload: { slug: 'acme', name: 'Acme', ownerUid: 'owner-1' },
    })

    expect(response.statusCode).toBe(201)
    expect(deps.createTenantUseCase.execute).toHaveBeenCalledWith({
      slug: 'acme',
      name: 'Acme',
      ownerUid: 'owner-1',
    })
  })

  it('PATCH /v1/super/tenants/:id/status returns 404 when the tenant is missing', async () => {
    const { app } = await buildTestApp({
      updateTenantStatusUseCase: {
        execute: vi.fn().mockRejectedValue(new TenantNotFoundError('tenant-1')),
      } as unknown as UpdateTenantStatusUseCase,
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/super/tenants/tenant-1/status',
      payload: { status: 'suspended' },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe('TENANT_NOT_FOUND')
  })

  it('POST /v1/super/tenants/:id/impersonate returns a custom token', async () => {
    const { app, deps } = await buildTestApp()

    const response = await app.inject({
      method: 'POST',
      url: '/v1/super/tenants/tenant-1/impersonate',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ token: 'tok', ownerUid: 'owner-1', slug: 'acme' })
    expect(deps.impersonateTenantUseCase.execute).toHaveBeenCalledWith(
      'tenant-1',
      'super-admin-1',
    )
  })

  it('rejects non-super_admin callers', async () => {
    const { app } = await buildTestApp({
      requireSuperAdmin: async (_request: FastifyRequest, reply: FastifyReply) => {
        reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
      },
    })

    const response = await app.inject({ method: 'GET', url: '/v1/super/tenants' })

    expect(response.statusCode).toBe(403)
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm run test --filter=@clube/bff -- super-tenants`
Expected: FAIL — module not found.

- [ ] **Step 4: Wire container.ts**

Add to `apps/bff/src/infrastructure/http/container.ts`:

```typescript
import { createFirebaseAuthPreHandler } from '@clube/fastify-plugins'
import { CreateTenantUseCase } from '../../application/super-tenants/create-tenant.usecase'
import { GetTenantUseCase } from '../../application/super-tenants/get-tenant.usecase'
import { ImpersonateTenantUseCase } from '../../application/super-tenants/impersonate-tenant.usecase'
import { ListTenantsUseCase } from '../../application/super-tenants/list-tenants.usecase'
import { UpdateTenantStatusUseCase } from '../../application/super-tenants/update-tenant-status.usecase'
```

(add these imports alongside the existing ones, keeping the existing `createTenantAuthPreHandler` import)

```typescript
export const superAuthPreHandler = createFirebaseAuthPreHandler()

export const listTenantsUseCase = new ListTenantsUseCase(tenantRepository)
export const getTenantUseCase = new GetTenantUseCase(tenantRepository)
export const createTenantUseCase = new CreateTenantUseCase(tenantRepository, userRepository)
export const updateTenantStatusUseCase = new UpdateTenantStatusUseCase(tenantRepository)
export const impersonateTenantUseCase = new ImpersonateTenantUseCase(tenantRepository)
```

(append these lines at the end of the file — `tenantRepository` and `userRepository` are already instantiated earlier in the file)

- [ ] **Step 5: Wire app.ts**

Modify `apps/bff/src/app.ts` imports:

```typescript
import {
  requireAuth,
  requireOwner,
  requireSubscriber,
} from './infrastructure/http/proxy'
```
becomes
```typescript
import {
  requireAuth,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from './infrastructure/http/proxy'
```

Add to the `container` import block:
```typescript
  createTenantUseCase,
  getTenantUseCase,
  impersonateTenantUseCase,
  listTenantsUseCase,
  superAuthPreHandler,
  updateTenantStatusUseCase,
```

Add import:
```typescript
import { registerSuperTenantsRoutes } from './infrastructure/http/routes/super-tenants'
```

Add before the final `return app`:
```typescript
  await registerSuperTenantsRoutes(app, {
    superAuthPreHandler,
    requireSuperAdmin,
    listTenantsUseCase,
    getTenantUseCase,
    createTenantUseCase,
    updateTenantStatusUseCase,
    impersonateTenantUseCase,
  })
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm run test --filter=@clube/bff`
Expected: PASS (full BFF suite)

- [ ] **Step 7: Commit**

```bash
git add apps/bff/src/infrastructure/http/routes/super-tenants.ts apps/bff/src/infrastructure/http/routes/super-tenants.test.ts apps/bff/src/infrastructure/http/container.ts apps/bff/src/app.ts
git commit -m "feat(bff): register /v1/super/tenants routes for super_admin"
```

---

## Frontend (apps/super-admin)

### Task 10: Package deps + shared scaffold (firebase, api-client, zod-resolver, auth store)

**Files:**
- Modify: `apps/super-admin/package.json`
- Create: `apps/super-admin/src/shared/services/firebase.ts`
- Create: `apps/super-admin/src/shared/services/api-client.ts`
- Create: `apps/super-admin/src/shared/utils/zod-resolver.ts`
- Create: `apps/super-admin/src/shared/store/auth.store.ts`

**Interfaces:**
- Produces: `getFirebaseAuth()`, `apiClient.{get,post,patch}`, `ApiError`, `zodResolver`, `useAuthStore`. All later frontend tasks depend on these exact exports.

- [ ] **Step 1: Add dependencies**

Edit `apps/super-admin/package.json` — replace the `dependencies` block with:

```json
  "dependencies": {
    "@clube/shared-types": "*",
    "@clube/ui": "*",
    "@tanstack/react-query": "^5.59.0",
    "firebase": "^10.14.0",
    "next": "14.2.15",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "zustand": "^4.5.5"
  },
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: lockfile updates, no errors.

- [ ] **Step 3: Add firebase.ts (exact copy of apps/admin's)**

```typescript
// apps/super-admin/src/shared/services/firebase.ts
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

function getFirebaseApp(): FirebaseApp {
  const apps = getApps()
  return apps.length > 0 ? apps[0] : initializeApp(firebaseConfig)
}

let authInstance: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp())
  }
  return authInstance
}
```

- [ ] **Step 4: Add api-client.ts (no tenant slug header)**

```typescript
// apps/super-admin/src/shared/services/api-client.ts
import { getFirebaseAuth } from './firebase'

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  const user = getFirebaseAuth().currentUser
  if (user) {
    const token = await user.getIdToken()
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BFF_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string }
    } | null
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? response.statusText,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
}
```

- [ ] **Step 5: Add zod-resolver.ts (exact copy)**

```typescript
// apps/super-admin/src/shared/utils/zod-resolver.ts
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

export function zodResolver<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return { values: result.data, errors: {} }
    }

    const errors = {} as FieldErrors<TFieldValues>
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') as keyof FieldErrors<TFieldValues>
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        } as FieldErrors<TFieldValues>[typeof path]
      }
    }

    return { values: {}, errors }
  }
}
```

- [ ] **Step 6: Add auth.store.ts**

```typescript
// apps/super-admin/src/shared/store/auth.store.ts
import type { Role } from '@clube/shared-types'
import { create } from 'zustand'

type AuthState = {
  uid: string | null
  role: Role | null
  isLoading: boolean
  setUser: (user: { uid: string; role: Role }) => void
  clear: () => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  role: null,
  isLoading: true,
  setUser: ({ uid, role }) => set({ uid, role, isLoading: false }),
  clear: () => set({ uid: null, role: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
```

- [ ] **Step 7: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/super-admin/package.json package-lock.json apps/super-admin/src/shared
git commit -m "feat(super-admin): add firebase, api-client, auth store scaffold"
```

---

### Task 11: Providers.tsx (claims-based session bootstrap) + root layout wiring

**Files:**
- Create: `apps/super-admin/src/shared/components/Providers.tsx`
- Modify: `apps/super-admin/src/app/layout.tsx`

**Interfaces:**
- Consumes: `getFirebaseAuth` (Task 10), `useAuthStore` (Task 10).
- Produces: `<Providers>` wrapping the app in `QueryClientProvider` and bootstrapping `useAuthStore` from Firebase custom claims.

- [ ] **Step 1: Implement Providers.tsx**

```typescript
// apps/super-admin/src/shared/components/Providers.tsx
'use client'

import type { Role } from '@clube/shared-types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import { type ReactNode, useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/shared/services/firebase'
import { useAuthStore } from '@/shared/store/auth.store'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const setUser = useAuthStore((state) => state.setUser)
  const clear = useAuthStore((state) => state.clear)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (!firebaseUser) {
        clear()
        return
      }

      setLoading(true)
      const idTokenResult = await firebaseUser.getIdTokenResult()
      const role = (idTokenResult.claims.role as Role | undefined) ?? 'user'
      setUser({ uid: firebaseUser.uid, role })
    })

    return unsubscribe
  }, [setUser, clear, setLoading])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

- [ ] **Step 2: Wire into root layout**

Replace `apps/super-admin/src/app/layout.tsx` with:

```typescript
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/shared/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Super Admin — Clube de Vendas com Assinaturas',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/super-admin/src/shared/components/Providers.tsx apps/super-admin/src/app/layout.tsx
git commit -m "feat(super-admin): bootstrap session from Firebase ID token claims"
```

---

### Task 12: Auth module (sign-in) + /entrar page

**Files:**
- Create: `apps/super-admin/src/modules/auth/schemas/auth.schema.ts`
- Create: `apps/super-admin/src/modules/auth/hooks/useSignIn.ts`
- Create: `apps/super-admin/src/modules/auth/components/SignInForm.tsx`
- Create: `apps/super-admin/src/app/(public)/entrar/page.tsx`

**Interfaces:**
- Consumes: `zodResolver`, `getFirebaseAuth` (Task 10).
- Produces: `<SignInForm>` used by the `/entrar` page.

- [ ] **Step 1: Add the schema**

```typescript
// apps/super-admin/src/modules/auth/schemas/auth.schema.ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type SignInInput = z.infer<typeof signInSchema>
```

- [ ] **Step 2: Add the hook**

```typescript
// apps/super-admin/src/modules/auth/hooks/useSignIn.ts
'use client'

import { useMutation } from '@tanstack/react-query'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { getFirebaseAuth } from '@/shared/services/firebase'
import { zodResolver } from '@/shared/utils/zod-resolver'
import { type SignInInput, signInSchema } from '../schemas/auth.schema'

export function useSignIn() {
  const router = useRouter()
  const form = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  const mutation = useMutation({
    mutationFn: (data: SignInInput) =>
      signInWithEmailAndPassword(getFirebaseAuth(), data.email, data.password),
    onSuccess: () => {
      router.push('/')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
```

- [ ] **Step 3: Add the form component**

```typescript
// apps/super-admin/src/modules/auth/components/SignInForm.tsx
'use client'

import { Button, Input } from '@clube/ui'
import { useSignIn } from '../hooks/useSignIn'

export function SignInForm() {
  const { form, mutation, onSubmit } = useSignIn()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        )}
      </div>

      {mutation.isError && <p className="text-sm text-red-600">Email ou senha inválidos.</p>}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Add the page**

```typescript
// apps/super-admin/src/app/(public)/entrar/page.tsx
import { SignInForm } from '@/modules/auth/components/SignInForm'

export default function SignInPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold">Super Admin</h1>
      <SignInForm />
    </main>
  )
}
```

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/super-admin/src/modules/auth apps/super-admin/src/app/\(public\)/entrar
git commit -m "feat(super-admin): add sign-in page"
```

---

### Task 13: SuperAdminLayout + (auth) guard + replace placeholder home

**Files:**
- Create: `apps/super-admin/src/shared/components/SuperAdminLayout.tsx`
- Create: `apps/super-admin/src/app/(auth)/layout.tsx`
- Create: `apps/super-admin/src/app/(auth)/page.tsx`
- Delete: `apps/super-admin/src/app/page.tsx`
- Delete: `apps/super-admin/src/app/page.test.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 10).
- Produces: `<SuperAdminLayout>` used by every authenticated page in later tasks.

- [ ] **Step 1: Implement SuperAdminLayout.tsx**

```typescript
// apps/super-admin/src/shared/components/SuperAdminLayout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/lojistas', label: 'Lojistas' },
  { href: '/planos', label: 'Planos SaaS' },
  { href: '/financeiro', label: 'Financeiro Global' },
  { href: '/configuracoes', label: 'Configurações' },
]

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-shrink-0 flex-col gap-1 border-r border-slate-200 p-4">
        <span className="mb-4 text-lg font-bold">Super Admin</span>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm ${
                active
                  ? 'bg-slate-900 font-medium text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </aside>
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Implement (auth)/layout.tsx**

```typescript
// apps/super-admin/src/app/(auth)/layout.tsx
'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { SuperAdminLayout } from '@/shared/components/SuperAdminLayout'
import { useAuthStore } from '@/shared/store/auth.store'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const uid = useAuthStore((state) => state.uid)
  const role = useAuthStore((state) => state.role)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    if (isLoading) return

    if (!uid || role !== 'super_admin') {
      router.replace('/entrar')
    }
  }, [uid, role, isLoading, router])

  if (isLoading || !uid || role !== 'super_admin') {
    return null
  }

  return <SuperAdminLayout>{children}</SuperAdminLayout>
}
```

- [ ] **Step 3: Add (auth)/page.tsx — redirects to /lojistas**

```typescript
// apps/super-admin/src/app/(auth)/page.tsx
import { redirect } from 'next/navigation'

export default function DashboardHomePage() {
  redirect('/lojistas')
}
```

- [ ] **Step 4: Delete the placeholder home page and its test**

Run: `rm apps/super-admin/src/app/page.tsx apps/super-admin/src/app/page.test.tsx`

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add -A apps/super-admin/src/shared/components/SuperAdminLayout.tsx apps/super-admin/src/app
git commit -m "feat(super-admin): add authenticated layout with sidebar and role guard"
```

---

### Task 14: Tenants module — schema, service, hooks

**Files:**
- Create: `apps/super-admin/src/modules/tenants/schemas/tenant.schema.ts`
- Create: `apps/super-admin/src/modules/tenants/types/tenant.ts`
- Create: `apps/super-admin/src/modules/tenants/services/tenants.service.ts`
- Create: `apps/super-admin/src/modules/tenants/hooks/useTenants.ts`
- Create: `apps/super-admin/src/modules/tenants/hooks/useTenant.ts`
- Create: `apps/super-admin/src/modules/tenants/hooks/useCreateTenant.ts`
- Create: `apps/super-admin/src/modules/tenants/hooks/useUpdateTenantStatus.ts`
- Create: `apps/super-admin/src/modules/tenants/hooks/useImpersonateTenant.ts`

**Interfaces:**
- Consumes: `apiClient` (Task 10), `zodResolver`.
- Produces: `SuperTenant`, `TenantWithMemberCount` types; `tenantsService.{list,getById,create,updateStatus,impersonate}`; hooks `useTenants`, `useTenant(id)`, `useCreateTenant`, `useUpdateTenantStatus`, `useImpersonateTenant`. Tasks 15-17 components depend on these exact names.

- [ ] **Step 1: Add the shared type**

```typescript
// apps/super-admin/src/modules/tenants/types/tenant.ts
export type SuperTenant = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  planId: string | null
  status: 'active' | 'suspended' | 'canceled'
  ownerUid: string
  createdAt: string
}

export type TenantWithMemberCount = {
  tenant: SuperTenant
  memberCount: number
}
```

- [ ] **Step 2: Add the Zod schema**

```typescript
// apps/super-admin/src/modules/tenants/schemas/tenant.schema.ts
import { z } from 'zod'

export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug deve ter no mínimo 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  name: z.string().min(2, 'Informe o nome da loja'),
  ownerUid: z.string().min(1, 'Informe o uid do dono'),
  logoUrl: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>
```

- [ ] **Step 3: Add the service**

```typescript
// apps/super-admin/src/modules/tenants/services/tenants.service.ts
import { apiClient } from '@/shared/services/api-client'
import type { CreateTenantInput } from '../schemas/tenant.schema'
import type { SuperTenant, TenantWithMemberCount } from '../types/tenant'

export const tenantsService = {
  list: () => apiClient.get<TenantWithMemberCount[]>('/v1/super/tenants'),
  getById: (id: string) => apiClient.get<TenantWithMemberCount>(`/v1/super/tenants/${id}`),
  create: (data: CreateTenantInput) =>
    apiClient.post<SuperTenant>('/v1/super/tenants', {
      ...data,
      logoUrl: data.logoUrl || undefined,
    }),
  updateStatus: (id: string, status: 'active' | 'suspended') =>
    apiClient.patch<SuperTenant>(`/v1/super/tenants/${id}/status`, { status }),
  impersonate: (id: string) =>
    apiClient.post<{ token: string; ownerUid: string; slug: string }>(
      `/v1/super/tenants/${id}/impersonate`,
    ),
}
```

- [ ] **Step 4: Add the query hooks**

```typescript
// apps/super-admin/src/modules/tenants/hooks/useTenants.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useTenants() {
  return useQuery({ queryKey: ['tenants'], queryFn: () => tenantsService.list() })
}
```

```typescript
// apps/super-admin/src/modules/tenants/hooks/useTenant.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useTenant(id: string) {
  return useQuery({ queryKey: ['tenant', id], queryFn: () => tenantsService.getById(id) })
}
```

- [ ] **Step 5: Add the mutation hooks**

```typescript
// apps/super-admin/src/modules/tenants/hooks/useCreateTenant.ts
'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { type CreateTenantInput, createTenantSchema } from '../schemas/tenant.schema'
import { tenantsService } from '../services/tenants.service'

export function useCreateTenant() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useForm<CreateTenantInput>({ resolver: zodResolver(createTenantSchema) })

  const mutation = useMutation({
    mutationFn: (data: CreateTenantInput) => tenantsService.create(data),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      router.push(`/lojistas/${tenant.id}`)
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
```

```typescript
// apps/super-admin/src/modules/tenants/hooks/useUpdateTenantStatus.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useUpdateTenantStatus(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: 'active' | 'suspended') =>
      tenantsService.updateStatus(tenantId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
```

```typescript
// apps/super-admin/src/modules/tenants/hooks/useImpersonateTenant.ts
'use client'

import { useMutation } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useImpersonateTenant(tenantId: string) {
  return useMutation({
    mutationFn: () => tenantsService.impersonate(tenantId),
    onSuccess: ({ token, slug }) => {
      window.open(`https://admin.${slug}.clube.com.br/impersonate?token=${token}`, '_blank')
    },
  })
}
```

- [ ] **Step 6: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/super-admin/src/modules/tenants/schemas apps/super-admin/src/modules/tenants/types apps/super-admin/src/modules/tenants/services apps/super-admin/src/modules/tenants/hooks
git commit -m "feat(super-admin): add tenants module data layer"
```

---

### Task 15: TenantTable component + /lojistas page

**Files:**
- Create: `apps/super-admin/src/modules/tenants/components/TenantTable.tsx`
- Create: `apps/super-admin/src/modules/tenants/components/__tests__/TenantTable.test.tsx`
- Create: `apps/super-admin/src/app/(auth)/lojistas/page.tsx`

**Interfaces:**
- Consumes: `useTenants` (Task 14).
- Produces: `<TenantTable>`.

- [ ] **Step 1: Write failing component test**

```typescript
// apps/super-admin/src/modules/tenants/components/__tests__/TenantTable.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { tenantsService } from '../../services/tenants.service'
import { TenantTable } from '../TenantTable'

vi.mock('../../services/tenants.service', () => ({
  tenantsService: { list: vi.fn() },
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('TenantTable', () => {
  it('renders tenant rows with status, plan, members and a receita placeholder', async () => {
    vi.mocked(tenantsService.list).mockResolvedValue([
      {
        tenant: {
          id: 'tenant-1',
          slug: 'acme',
          name: 'Acme',
          logoUrl: null,
          planId: null,
          status: 'active',
          ownerUid: 'owner-1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        memberCount: 4,
      },
    ])

    renderWithClient(<TenantTable />)

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test --filter=@clube/super-admin -- TenantTable`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TenantTable.tsx**

```typescript
// apps/super-admin/src/modules/tenants/components/TenantTable.tsx
'use client'

import Link from 'next/link'
import { useTenants } from '../hooks/useTenants'

export function TenantTable() {
  const { data, isLoading } = useTenants()

  if (isLoading) return <p>Carregando lojistas...</p>

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Loja</th>
          <th className="py-2">Status</th>
          <th className="py-2">Plano</th>
          <th className="py-2">Membros</th>
          <th className="py-2">Receita</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map(({ tenant, memberCount }) => (
          <tr key={tenant.id} className="border-b border-slate-100">
            <td className="py-2">
              <Link href={`/lojistas/${tenant.id}`} className="hover:underline">
                {tenant.name}
              </Link>
              <span className="ml-2 text-xs text-slate-500">{tenant.slug}</span>
            </td>
            <td className="py-2">{tenant.status}</td>
            <td className="py-2">{tenant.planId ?? '—'}</td>
            <td className="py-2">{memberCount}</td>
            <td className="py-2" title="Disponível na Fase B">
              —
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test --filter=@clube/super-admin -- TenantTable`
Expected: PASS

- [ ] **Step 5: Add the page**

```typescript
// apps/super-admin/src/app/(auth)/lojistas/page.tsx
import Link from 'next/link'
import { Button } from '@clube/ui'
import { TenantTable } from '@/modules/tenants/components/TenantTable'

export default function LojistasPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lojistas</h1>
        <Link href="/lojistas/novo">
          <Button>Novo lojista</Button>
        </Link>
      </div>
      <TenantTable />
    </main>
  )
}
```

- [ ] **Step 6: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/super-admin/src/modules/tenants/components/TenantTable.tsx apps/super-admin/src/modules/tenants/components/__tests__/TenantTable.test.tsx apps/super-admin/src/app/\(auth\)/lojistas/page.tsx
git commit -m "feat(super-admin): add tenants list page"
```

---

### Task 16: TenantForm component + /lojistas/novo page

**Files:**
- Create: `apps/super-admin/src/modules/tenants/components/TenantForm.tsx`
- Create: `apps/super-admin/src/app/(auth)/lojistas/novo/page.tsx`

**Interfaces:**
- Consumes: `useCreateTenant` (Task 14).
- Produces: `<TenantForm>`.

- [ ] **Step 1: Implement TenantForm.tsx**

```typescript
// apps/super-admin/src/modules/tenants/components/TenantForm.tsx
'use client'

import { Button, Input } from '@clube/ui'
import { useCreateTenant } from '../hooks/useCreateTenant'

export function TenantForm() {
  const { form, mutation, onSubmit } = useCreateTenant()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nome da loja
        </label>
        <Input id="name" {...register('name')} />
        {errors.name && <span className="text-sm text-red-600">{errors.name.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug (subdomínio)
        </label>
        <Input id="slug" placeholder="acme" {...register('slug')} />
        {errors.slug && <span className="text-sm text-red-600">{errors.slug.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ownerUid" className="text-sm font-medium">
          UID Firebase do dono
        </label>
        <Input id="ownerUid" {...register('ownerUid')} />
        {errors.ownerUid && (
          <span className="text-sm text-red-600">{errors.ownerUid.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="logoUrl" className="text-sm font-medium">
          URL do logo (opcional)
        </label>
        <Input id="logoUrl" {...register('logoUrl')} />
        {errors.logoUrl && (
          <span className="text-sm text-red-600">{errors.logoUrl.message}</span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">Não foi possível criar o lojista.</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Criando...' : 'Criar lojista'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Add the page**

```typescript
// apps/super-admin/src/app/(auth)/lojistas/novo/page.tsx
import { TenantForm } from '@/modules/tenants/components/TenantForm'

export default function NovoLojistaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Novo lojista</h1>
      <TenantForm />
    </main>
  )
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/super-admin/src/modules/tenants/components/TenantForm.tsx apps/super-admin/src/app/\(auth\)/lojistas/novo
git commit -m "feat(super-admin): add tenant onboarding form"
```

---

### Task 17: TenantDetail component + /lojistas/[id] page

**Files:**
- Create: `apps/super-admin/src/modules/tenants/components/TenantDetail.tsx`
- Create: `apps/super-admin/src/app/(auth)/lojistas/[id]/page.tsx`

**Interfaces:**
- Consumes: `useTenant`, `useUpdateTenantStatus`, `useImpersonateTenant` (Task 14).
- Produces: `<TenantDetail tenantId={string} />`.

- [ ] **Step 1: Implement TenantDetail.tsx**

```typescript
// apps/super-admin/src/modules/tenants/components/TenantDetail.tsx
'use client'

import { Button } from '@clube/ui'
import { useImpersonateTenant } from '../hooks/useImpersonateTenant'
import { useTenant } from '../hooks/useTenant'
import { useUpdateTenantStatus } from '../hooks/useUpdateTenantStatus'

export function TenantDetail({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useTenant(tenantId)
  const updateStatus = useUpdateTenantStatus(tenantId)
  const impersonate = useImpersonateTenant(tenantId)

  if (isLoading) return <p>Carregando...</p>
  if (!data) return <p>Lojista não encontrado.</p>

  const { tenant, memberCount } = data
  const isActive = tenant.status === 'active'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-slate-500">{tenant.slug}.clube.com.br</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Status</dt>
          <dd>{tenant.status}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Plano</dt>
          <dd>{tenant.planId ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Membros</dt>
          <dd>{memberCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Dono (uid)</dt>
          <dd>{tenant.ownerUid}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Criado em</dt>
          <dd>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <div className="flex gap-3">
        <Button
          variant={isActive ? 'outline' : 'default'}
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate(isActive ? 'suspended' : 'active')}
        >
          {isActive ? 'Suspender' : 'Ativar'}
        </Button>
        <Button
          variant="outline"
          disabled={impersonate.isPending}
          onClick={() => impersonate.mutate()}
        >
          {impersonate.isPending ? 'Gerando acesso...' : 'Impersonar'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the page**

```typescript
// apps/super-admin/src/app/(auth)/lojistas/[id]/page.tsx
import { TenantDetail } from '@/modules/tenants/components/TenantDetail'

export default function LojistaDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <TenantDetail tenantId={params.id} />
    </main>
  )
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/super-admin/src/modules/tenants/components/TenantDetail.tsx "apps/super-admin/src/app/(auth)/lojistas/[id]"
git commit -m "feat(super-admin): add tenant detail page with suspend/activate/impersonate"
```

---

### Task 18: Placeholder pages — Planos SaaS, Financeiro Global, Configurações

**Files:**
- Create: `apps/super-admin/src/app/(auth)/planos/page.tsx`
- Create: `apps/super-admin/src/app/(auth)/financeiro/page.tsx`
- Create: `apps/super-admin/src/app/(auth)/configuracoes/page.tsx`

**Interfaces:** none — static placeholders, no logic.

- [ ] **Step 1: Add the three pages**

```typescript
// apps/super-admin/src/app/(auth)/planos/page.tsx
export default function PlanosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Planos SaaS</h1>
      <p className="text-sm text-slate-600">
        Planos Basic, Pro e Enterprise chegam na Fase B (cobrança real via Asaas).
      </p>
    </main>
  )
}
```

```typescript
// apps/super-admin/src/app/(auth)/financeiro/page.tsx
export default function FinanceiroPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Financeiro Global</h1>
      <p className="text-sm text-slate-600">
        Receita da plataforma e inadimplência de lojistas chegam na Fase B.
      </p>
    </main>
  )
}
```

```typescript
// apps/super-admin/src/app/(auth)/configuracoes/page.tsx
export default function ConfiguracoesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Configurações</h1>
      <p className="text-sm text-slate-600">Em breve.</p>
    </main>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --filter=@clube/super-admin`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/super-admin/src/app/(auth)/planos" "apps/super-admin/src/app/(auth)/financeiro" "apps/super-admin/src/app/(auth)/configuracoes"
git commit -m "feat(super-admin): add placeholder pages for planos, financeiro and configuracoes"
```

---

### Task 19: apps/admin — /impersonate page

**Files:**
- Create: `apps/admin/src/app/(public)/impersonate/page.tsx`

**Interfaces:**
- Consumes: `getFirebaseAuth` (already exists in `apps/admin`), `signInWithCustomToken` from `firebase/auth`.

- [ ] **Step 1: Implement the page**

```typescript
// apps/admin/src/app/(public)/impersonate/page.tsx
'use client'

import { signInWithCustomToken } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/shared/services/firebase'

export default function ImpersonatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError(true)
      return
    }

    signInWithCustomToken(getFirebaseAuth(), token)
      .then(() => router.replace('/'))
      .catch(() => setError(true))
  }, [searchParams, router])

  if (error) {
    return <p className="p-8 text-sm text-red-600">Não foi possível autenticar. Peça um novo link ao super admin.</p>
  }

  return <p className="p-8 text-sm text-slate-600">Entrando...</p>
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --filter=@clube/admin`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/admin/src/app/(public)/impersonate"
git commit -m "feat(admin): accept super-admin impersonation custom tokens"
```

---

## Final Verification

- [ ] Run full suite: `npm run test`
- [ ] Run full typecheck: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Manually start `bff` (port 3004) and `super-admin` (port 3003), sign in as a seeded `super_admin` user, create a tenant, suspend it, reactivate it, click impersonate and confirm `apps/admin` at `admin.<slug>.clube.com.br/impersonate?token=...` signs in as the owner.
