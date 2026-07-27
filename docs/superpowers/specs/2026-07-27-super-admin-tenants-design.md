# Super Admin — Módulo Tenants (Fase A)

## Contexto

Plataforma tem `apps/super-admin` já scaffolded no monorepo (Next.js base gerada, sem lógica).
`apps/bff` já possui `Tenant` entity, `ITenantRepository` (apenas `findBySlug`/`findByDomain`/`create`),
schema `tenants.tenants` / `tenants.users` / `tenants.domains`. Não existe endpoint de gestão de tenants
para super_admin, nem app funcional para ele.

Este documento cobre **Fase A**: onboarding e gestão de lojistas (tenants). Cobrança SaaS real
(planos Basic/Pro/Enterprise, assinatura via Asaas, receita/inadimplência) fica para **Fase B**,
spec separada — fora de escopo aqui.

## Objetivo

Super admin consegue, via painel próprio:
- Listar todos os tenants (status, plano bruto, contagem de membros)
- Ver detalhe completo de um tenant
- Criar novo tenant (onboarding) atribuindo `store_owner` a um uid existente — fluxo de menos de 2 minutos
- Suspender / ativar um tenant
- Impersonar o owner de um tenant (abrir o admin dele autenticado)

## Backend (apps/bff)

### Domain

`ITenantRepository` ganha:
```ts
list(): Promise<Tenant[]>
findById(id: string): Promise<Tenant | null>
updateStatus(id: string, status: TenantStatus): Promise<Tenant>
countUsers(id: string): Promise<number>
```
`TenantRepository` implementa contra tabelas existentes (`tenants`, `users`) — sem migration nova.

Novos erros (`domain/errors`): `TenantNotFoundError` (404), `SlugAlreadyTakenError` (409).

### Application (usecases em `application/super-tenants/`)

- `ListTenantsUseCase` — retorna tenants + `memberCount` (via `countUsers`).
- `GetTenantUseCase` — busca por id, lança `TenantNotFoundError` se ausente.
- `CreateTenantUseCase` — valida slug único (`findBySlug`), cria tenant (`status: active`), insere
  `tenants.users` (`role: store_owner`), chama `setRole(ownerUid, 'store_owner', tenantId)`
  de `@clube/firebase-utils`. Tudo em uma única operação — se `setRole` falhar, propaga o erro
  (sem rollback automático da row; aceitável pois super_admin pode reexecutar/corrigir manualmente,
  fora de escopo tratar consistência distribuída aqui).
- `UpdateTenantStatusUseCase` — `findById` → valida transição (`active`↔`suspended`; `canceled` não
  é alcançável por esta rota) → `updateStatus`.
- `ImpersonateTenantUseCase` — `findById` → `getAuth().createCustomToken(tenant.ownerUid, { impersonated_by: superAdminUid })`
  → retorna `{ token, ownerUid, slug }`. Loga via `request.log.info({ superAdminUid, tenantId, ownerUid }, 'tenant impersonation issued')`
  para auditoria (sem tabela de audit dedicada — YAGNI, log estruturado é suficiente por ora).

### HTTP (`infrastructure/http/routes/super-tenants.ts`)

Preâmbulo de auth: `createFirebaseAuthPreHandler()` (tenant-less, já existe em `@clube/fastify-plugins`)
seguido de `requireSuperAdmin`. **Não** usa `tenantAuthPreHandler` — super_admin não tem tenant/domínio
a resolver, e `tenantAuthPreHandler` responderia 404 sem host de tenant válido.

| Rota | Método | Descrição |
|---|---|---|
| `/v1/super/tenants` | GET | lista todos com `memberCount` |
| `/v1/super/tenants` | POST | cria tenant (onboarding) |
| `/v1/super/tenants/:id` | GET | detalhe |
| `/v1/super/tenants/:id/status` | PATCH | `{ status: 'active' \| 'suspended' }` |
| `/v1/super/tenants/:id/impersonate` | POST | retorna custom token |

Schemas TypeBox em `infrastructure/http/schemas/super-tenants.ts`: `TenantSchema`,
`ListTenantsResponseSchema`, `CreateTenantBodySchema`, `UpdateTenantStatusBodySchema`,
`ImpersonateResponseSchema`, `ErrorResponseSchema` (reusa padrão existente).

`CreateTenantBodySchema`: `{ slug, name, ownerUid, logoUrl? }` — `planId` não é setável aqui
(pertence à Fase B).

Wiring em `container.ts` (novo `superAuthPreHandler = createFirebaseAuthPreHandler()`) e `app.ts`
(`registerSuperTenantsRoutes`).

## Frontend (apps/super-admin)

### Scaffold (paridade com apps/admin)

- `shared/services/firebase.ts` — cópia exata.
- `shared/services/api-client.ts` — **sem** header `x-tenant-slug` (super-admin roda em
  `superadmin.clube.com.br`, não resolve tenant). Só `Authorization: Bearer <token>`.
- `shared/store/auth.store.ts` — cópia (mesmo shape, `role` esperado é sempre `'super_admin'`).
- `shared/components/Providers.tsx` — em vez de chamar `/v1/auth/me` (exige tenant resolvido),
  lê role/uid direto de `getIdTokenResult(true).claims` do Firebase — evita depender de rota
  tenant-bound para bootstrap de sessão.
- Sem `middleware.ts` — não há subdomínio de tenant a resolver.
- `(auth)/layout.tsx` — guarda client-side: se `role !== 'super_admin'` (e não `isLoading`), redirect
  para `/entrar`.
- `(public)/entrar/page.tsx` — reusa padrão de `SignInForm` do admin.

### Layout

`shared/components/SuperAdminLayout.tsx` — sidebar: Lojistas (`/lojistas`), Planos SaaS (`/planos`),
Financeiro Global (`/financeiro`), Configurações (`/configuracoes`). Apenas Lojistas é funcional nesta
fase; as outras três renderizam um placeholder simples ("Chegando na Fase B" / "Em breve") — nav item
existe para não precisar retrabalhar o layout na Fase B.

### Módulo tenants (`modules/tenants/`)

- `services/tenants.service.ts` — `list`, `getById`, `create`, `updateStatus`, `impersonate`.
- `hooks/`: `useTenants`, `useTenant(id)`, `useCreateTenant`, `useUpdateTenantStatus`, `useImpersonateTenant`.
- `schemas/tenant.schema.ts` — Zod: `slug` (kebab-case, regex `^[a-z0-9-]+$`), `name` (min 2), `ownerUid`
  (min 1), `logoUrl` opcional (url).
- `components/TenantTable.tsx` — colunas: nome/slug, status (badge), plano (`planId ?? '—'`),
  membros (`memberCount`), receita (`—`, tooltip "disponível na Fase B"). Link para `/lojistas/[id]`.
- `components/TenantDetail.tsx` — dados completos + botões Suspender/Ativar (chama
  `useUpdateTenantStatus`, desabilitado durante a mutation) e Impersonar (chama
  `useImpersonateTenant`, em sucesso `window.open` para
  `https://admin.${slug}.clube.com.br/impersonate?token=${token}`).
- `components/TenantForm.tsx` — react-hook-form + zodResolver, campos slug/name/ownerUid/logoUrl,
  submit chama `useCreateTenant`, sucesso redireciona para `/lojistas/[id]`.

### Páginas

`app/(auth)/lojistas/page.tsx`, `/lojistas/novo/page.tsx`, `/lojistas/[id]/page.tsx`,
`/financeiro/page.tsx`, `/planos/page.tsx`, `/configuracoes/page.tsx` (últimas três = placeholder),
`app/(auth)/layout.tsx`, `app/(public)/entrar/page.tsx`.

### Complemento em apps/admin (necessário p/ impersonar funcionar)

`apps/admin/src/app/(public)/impersonate/page.tsx` — lê `?token=` da query, chama
`signInWithCustomToken(getFirebaseAuth(), token)`, depois `router.replace('/')`. Sem isso o botão
"Impersonar" do super-admin abre uma aba sem efeito.

## Erros e Casos de Borda

- Slug duplicado → `SlugAlreadyTakenError` (409) → form mostra erro no campo slug.
- Tenant não encontrado → `TenantNotFoundError` (404) → página de detalhe mostra estado vazio.
- Transição de status inválida (ex.: tentar suspender já suspenso) — aceita idempotentemente, sem erro
  (mesma chamada `updateStatus`, sem necessidade de máquina de estado explícita nesta fase).
- Token expirado / inválido → já tratado pelo `firebaseAuthPreHandler` existente (401).

## Testes

- **Usecases** (100%): `create-tenant`, `list-tenants`, `get-tenant`, `update-tenant-status`,
  `impersonate-tenant` — mock do repositório.
- **Rotas** (`app.inject`): token mockado com claim `role: super_admin`, cobre 200/404/409/403
  (role errado).
- **Repository**: estende padrão de `tenant.repository.test.ts` (testcontainers) com `list`,
  `findById`, `updateStatus`, `countUsers`.
- **Frontend**: `TenantForm` (validação Zod, submit), hooks via Vitest com `apiClient` mockado.

## Fora de escopo (Fase B)

- Tabela `saas_plans` (Basic/Pro/Enterprise) e FK real em `tenants.planId`.
- Assinatura do lojista via Asaas + webhook de cobrança da plataforma.
- Receita total da plataforma / inadimplência de lojistas — dado real de billing.
- Máquina de estado completa para `status` (`canceled`, motivos de suspensão, etc.).
