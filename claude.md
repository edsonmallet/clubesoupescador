# CLAUDE.md — Clube de Vendas com Assinaturas

Leia este arquivo inteiro antes de escrever qualquer código.
Ele define arquitetura, convenções, stack e regras do projeto.

---

## Visão Geral do Produto

Plataforma SaaS B2B2C de clube de vendas com assinaturas.
Distribuidoras e marcas fornecem produtos. Lojistas criam seus clubes.
Membros pagam R$19,90/mês e compram com preço de custo.

**Atores:**
- `super_admin` — você, operador do SaaS
- `store_owner` — dono de cada loja/clube
- `store_manager` — funcionário da loja (sem acesso financeiro)
- `community_mod` — assinante com poderes de moderação no fórum
- `subscriber` — membro com assinatura ativa
- `user` — cadastrado sem assinatura

---

## Monorepo — Estrutura de Pastas

```
clube/
├── apps/
│   ├── landing/          # Next.js — clube.com.br (converte lojistas para o SaaS)
│   ├── pwa/              # Next.js — [slug].clube.com.br (área do membro — PWA)
│   ├── admin/            # Next.js — admin.[slug].clube.com.br (painel do lojista)
│   ├── super-admin/      # Next.js — superadmin.clube.com.br (você gerencia tudo)
│   └── bff/              # Fastify — api.clube.com.br (API única para todos os apps)
├── services/
│   ├── subscriptions/    # Planos, assinantes, XP, níveis, badges
│   ├── store/            # Produtos, estoque, pedidos, frete
│   ├── cashback/         # Ledger em R$, geração, resgate, expiração
│   ├── raffles/          # Rifas, bilhetes, sorteios Loteria Federal
│   ├── tournaments/      # Torneios, submissões, ranking, votação
│   └── community/        # Fórum, tópicos, comentários, reações, moderação
├── packages/
│   ├── shared-types/     # Tipos TypeScript públicos — usados por todos
│   ├── ui/               # Componentes shadcn/ui base compartilhados
│   ├── firebase-utils/   # Admin SDK, RBAC: setRole, getRole, revokeRole
│   ├── asaas-sdk/        # Wrapper tipado da API Asaas
│   ├── db-client/        # Drizzle client configurável por schema
│   └── fastify-plugins/  # auth, cors, health, error-handler, scalar
├── mobile/               # React Native / Expo (futuro)
├── turbo.json
├── docker-compose.yml    # desenvolvimento local
├── Dockerfile.landing
├── Dockerfile.pwa
├── Dockerfile.admin
├── Dockerfile.super-admin
├── Dockerfile.bff
└── .dockerignore
```

---

## Stack — BFF e Serviços (Fastify)

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Fastify |
| Validação + Schema | TypeBox |
| Documentação | Scalar (`/docs` em cada serviço) |
| ORM | Drizzle ORM + Drizzle Kit |
| Banco | PostgreSQL 16 (schema por serviço) |
| Cache / Filas | Redis + BullMQ |
| Auth | Firebase Auth (Custom Claims) |
| Env validation | @t3-oss/env-core + Zod |
| Logger | Pino (já incluso no Fastify) |
| Linguagem | TypeScript 5.x strict |
| Testes | Vitest + testcontainers + app.inject() |

### Arquitetura interna — Clean Architecture + SOLID

```
services/[nome]/src/
├── domain/
│   ├── entities/           # classes puras de negócio
│   ├── value-objects/      # Money, TenantSlug, XpPoints
│   ├── errors/             # DomainError e subclasses
│   └── interfaces/         # IOfferRepository, IMemberRepository
├── application/
│   └── [recurso]/
│       └── [acao].usecase.ts   # orquestra domain, sem framework
├── infrastructure/
│   ├── db/
│   │   ├── schema/         # Drizzle schema — tabelas do schema SQL
│   │   ├── repositories/   # implementa interfaces do domain
│   │   └── migrations/     # SQL gerado pelo drizzle-kit
│   ├── http/
│   │   ├── routes/         # registra rota + TypeBox schema + chama usecase
│   │   ├── schemas/        # TypeBox schemas por recurso
│   │   └── proxy.ts        # resolve tenant + valida JWT + injeta req.user
│   ├── queue/              # BullMQ workers e producers
│   └── external/           # Asaas, Melhor Envio, Firebase, Loteria Federal
├── shared/
│   ├── errors/
│   ├── logger/
│   └── types/
└── index.ts                # bootstrap Fastify — registra plugins e rotas
```

### Regras obrigatórias — BFF e serviços

- Rotas só registram endpoint + schema TypeBox + chamam o usecase. Zero lógica.
- Usecases orquestram domain e repositories. Sem Fastify, sem Drizzle direto.
- Repositories implementam as interfaces do domain. Toda query Drizzle fica aqui.
- `proxy.ts` substitui middleware — resolve tenant pelo host e valida JWT Firebase.
- Nunca acesse schema de outro serviço via banco. Use HTTP entre serviços.
- Todo endpoint tem schema TypeBox com `response` tipado — vira OpenAPI automaticamente.
- Variáveis de ambiente sempre validadas com `@t3-oss/env-core` no bootstrap.
- Erros de domínio são classes que estendem `DomainError` — nunca throw de string.

### Estrutura interna de cada serviço

```
services/[nome]/src/
infrastructure/http/routes/[recurso].ts   # rota
application/[recurso]/[acao].usecase.ts   # lógica
infrastructure/db/repositories/[recurso].repository.ts  # queries
domain/interfaces/I[Recurso]Repository.ts # contrato
domain/entities/[Recurso].ts              # entidade
```

### proxy.ts — padrão obrigatório

```typescript
// infrastructure/http/proxy.ts
export async function proxy(req: FastifyRequest, reply: FastifyReply) {
  // 1. Resolve tenant pelo host da requisição
  const host = req.headers.host ?? ''
  const domain = host.replace('www.', '').split(':')[0]

  const tenant = domain.endsWith('.clube.com.br')
    ? await resolveTenantBySlug(domain.replace('.clube.com.br', ''))
    : await resolveTenantByDomain(domain)

  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' })
  req.tenant = tenant

  // 2. Valida JWT Firebase (rotas públicas podem não ter token)
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (token) {
    const decoded = await getAuth().verifyIdToken(token)
    req.user = {
      uid: decoded.uid,
      role: decoded.role ?? 'user',
      tenant_id: decoded.tenant_id ?? null,
    }
  }
}

// Guards — use como preHandler nas rotas
export const requireSuperAdmin = guard('super_admin')
export const requireOwner      = guard('store_owner', 'super_admin')
export const requireManager    = guard('store_manager', 'store_owner', 'super_admin')
export const requireSubscriber = guard('subscriber', 'community_mod', 'store_manager', 'store_owner', 'super_admin')
export const requireAuth       = guard('user', 'subscriber', 'community_mod', 'store_manager', 'store_owner', 'super_admin')
```

---

## Stack — Apps Next.js (PWA, Admin, Landing, Super-Admin)

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 App Router |
| Linguagem | TypeScript 5.x strict |
| UI | shadcn/ui |
| Formulários | react-hook-form + Zod + @hookform/resolvers |
| Estado servidor | React Query (@tanstack/react-query) |
| Estado cliente | Zustand |
| Auth | Firebase Auth (client SDK) |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |

### Estrutura interna — todos os apps Next.js

```
apps/[nome]/src/
├── app/                    # App Router — APENAS roteamento
│   ├── (public)/           # rotas sem autenticação
│   ├── (auth)/             # rotas protegidas — layout verifica sessão
│   │   └── [rota]/
│   │       └── page.tsx    # importa componente do módulo, sem lógica
│   └── layout.tsx
├── modules/                # lógica organizada por domínio
│   └── [modulo]/
│       ├── components/     # componentes React do módulo
│       ├── hooks/          # hooks do módulo (useQuery, useMutation, useForm)
│       ├── services/       # chamadas à API (funções puras, sem estado)
│       ├── schemas/        # Zod schemas + tipos inferidos
│       ├── store/          # Zustand store do módulo
│       └── types/          # tipos específicos do módulo
└── shared/                 # compartilhado entre módulos
    ├── components/         # Layout, Header, wrappers shadcn/ui
    ├── hooks/              # useTenant, useToast, useMediaQuery
    ├── services/           # api client base com fetch + token Firebase
    ├── store/              # Zustand global (tenant, auth)
    ├── schemas/            # Zod schemas base reutilizáveis
    └── utils/              # formatMoney, formatDate, cn...
```

### Regras obrigatórias — Next.js

- `app/` contém apenas roteamento. Nenhuma lógica, nenhum fetch, nenhum estado.
- Toda lógica fica em `modules/` ou `shared/`.
- Todo fetch de API usa React Query — nunca `useEffect` + `fetch` manual.
- Todo formulário usa `react-hook-form` + `zodResolver` — nunca `useState` para campos.
- Estado local do módulo fica no Zustand do módulo. Estado global em `shared/store`.
- Componentes de UI base ficam em `packages/ui` se usados em mais de um app.
- O que for compartilhado entre módulos do mesmo app vai em `shared/`.

### Padrão de serviço + hook

```typescript
// modules/offers/services/offers.service.ts
export const offersService = {
  list: () => apiClient.get<ListOffersResponse>('/v1/offers'),
  getById: (id: string) => apiClient.get<Offer>(`/v1/offers/${id}`),
  buy: (id: string, data: BuyOfferDto) =>
    apiClient.post<Order>(`/v1/offers/${id}/buy`, data),
}

// modules/offers/hooks/useOffers.ts
export const useOffers = () =>
  useQuery({
    queryKey: ['offers'],
    queryFn: () => offersService.list(),
    staleTime: 1000 * 60 * 5,
  })

// modules/offers/hooks/useBuyOffer.ts
export const useBuyOffer = (offerId: string) => {
  const queryClient = useQueryClient()
  const form = useForm({ resolver: zodResolver(buyOfferSchema) })
  const mutation = useMutation({
    mutationFn: (data: BuyOfferDto) => offersService.buy(offerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cashback'] })
    },
  })
  return { form, mutation }
}
```

---

## Autenticação — Firebase Auth (todas as camadas)

Todo auth passa pelo Firebase. Nenhuma sessão é gerenciada manualmente.

### Custom Claims — estrutura obrigatória

```typescript
// Embutido no JWT de todo usuário
type CustomClaims = {
  role: 'super_admin' | 'store_owner' | 'store_manager' |
        'community_mod' | 'subscriber' | 'user'
  tenant_id: string | null  // null apenas para super_admin e user sem tenant
}
```

### Hierarquia de roles

```
super_admin
  └── store_owner       (acesso total ao tenant)
        └── store_manager   (sem financeiro)
  └── subscriber        (membro com assinatura ativa)
        └── community_mod   (subscriber + moderação do fórum)
  └── user              (cadastrado sem assinatura)
```

### Regras de atribuição

- `user` → atribuído no cadastro pelo BFF
- `subscriber` → atribuído pelo serviço subscriptions após PAYMENT_CONFIRMED do Asaas
- `community_mod` → atribuído pelo store_owner ou super_admin
- `store_manager` → atribuído pelo store_owner
- `store_owner` → atribuído pelo super_admin no onboarding do lojista
- `super_admin` → atribuído manualmente via script de seed

### Refresh obrigatório após mudança de role

```typescript
// No app (PWA ou Admin) após receber push de confirmação
await firebase.auth().currentUser?.getIdToken(true)
```

### packages/firebase-utils

```typescript
export type Role =
  | 'super_admin' | 'store_owner' | 'store_manager'
  | 'community_mod' | 'subscriber' | 'user'

export const setRole = (uid: string, role: Role, tenantId?: string) =>
  getAuth().setCustomUserClaims(uid, {
    role,
    tenant_id: tenantId ?? null,
  })

export const getRole  = async (uid: string): Promise<Role> => {
  const user = await getAuth().getUser(uid)
  return (user.customClaims?.role as Role) ?? 'user'
}

export const revokeRole = (uid: string) => setRole(uid, 'user')
```

---

## Banco de Dados — PostgreSQL 16

### Estratégia: Row-Level Security + tenant_id em tudo

Um único PostgreSQL com schemas separados por serviço.
Todo registro tem `tenant_id`. RLS bloqueia acesso cruzado entre tenants.

```sql
-- Regra obrigatória em todas as tabelas com dados de tenant
ALTER TABLE [schema].[tabela] ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON [schema].[tabela]
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Schemas por serviço

| Schema | Serviço dono |
|---|---|
| `tenants` | services/tenants (ou BFF) |
| `subscriptions` | services/subscriptions |
| `store` | services/store |
| `cashback` | services/cashback |
| `raffles` | services/raffles |
| `tournaments` | services/tournaments |
| `community` | services/community |

### Campos obrigatórios em toda tabela com dados de tenant

```sql
tenant_id  uuid NOT NULL REFERENCES tenants.tenants(id),
id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
created_at timestamptz DEFAULT now()
```

### Migrations

- Geradas com `drizzle-kit generate`
- Aplicadas com `drizzle-kit migrate`
- Nunca edite uma migration já aplicada — crie uma nova

---

## Multi-Tenant — Resolução de Domínio

### Subdomínio padrão (automático)

```
[slug].clube.com.br       → PWA do lojista
admin.[slug].clube.com.br → Admin do lojista
```

### Custom domain (opcional)

O lojista aponta CNAME para `proxy.clube.com.br`.
O Easypanel/Caddy emite SSL automaticamente.
O BFF resolve o tenant pelo `host` da requisição.

### Middleware de resolução — Next.js

```typescript
// apps/pwa/src/app/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const domain = host.replace('www.', '').split(':')[0]

  const slug = domain.endsWith('.clube.com.br')
    ? domain.replace('.clube.com.br', '')
    : null

  // Passa tenant info via header para Server Components
  const res = NextResponse.next()
  if (slug) res.headers.set('x-tenant-slug', slug)
  else res.headers.set('x-tenant-domain', domain)

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Landing Page — Sistema de Templates

### Dois templates disponíveis

- `clube-simples` — layout direto, ideal para lojistas iniciantes
- `clube-premium` — layout elaborado, mais seções e recursos visuais

### Configuração salva como JSON no banco

```typescript
// tenants.landing_configs
type LandingConfig = {
  template_id: 'clube-simples' | 'clube-premium'
  theme: {
    primary: string    // hex
    secondary: string  // hex
    font: string       // 'Inter' | 'Poppins' | 'Roboto'
  }
  seo: {
    title: string
    description: string
    og_image: string
  }
  sections: {
    hero: {
      title: string
      subtitle: string
      bg_image: string
      cta_text: string
    }
    benefits: {
      items: Array<{ icon: string; title: string; text: string }>
    }
    social_proof: {
      member_count: number
      savings_avg: number
      testimonials: Array<{ name: string; text: string; avatar: string }>
    }
    plan: {
      price: number
      benefits: string[]
    }
  }
}
```

### Renderização no Next.js

```
app/[tenant]/page.tsx
  → getLandingConfig(tenant)    # Server Component — busca no BFF
  → <LandingRenderer config />  # decide qual template renderizar
      → <ClubeSimples config /> # ou <ClubePremium config />
```

---

## Filas — BullMQ + Redis

### Queues por domínio

| Queue | Jobs | Trigger |
|---|---|---|
| `subscriptions-queue` | process-webhook, grant-xp, update-level | Webhook Asaas |
| `store-queue` | create-shipping-label, send-order-email | Pagamento confirmado |
| `cashback-queue` | grant-cashback, expire-cashback (cron 02:00) | Pagamento / cron |
| `raffles-queue` | draw-raffle, notify-winner | Admin / data limite |
| `tournaments-queue` | close-submissions, distribute-xp | Data limite |
| `notifications-queue` | send-push, send-email | Qualquer serviço |
| `domains-queue` | verify-dns, activate-domain | Lojista cadastra domínio |

### Regra obrigatória — webhooks

Webhook recebido → responde 200 imediatamente → enfileira no BullMQ → worker processa.
Nunca processe webhook de forma síncrona na rota.

---

## Gamificação — XP e Cashback

### XP (permanente — nunca expira)

Determina o nível do assinante e o desconto na loja.
Configurável pelo admin via tabela `subscriptions.xp_config`.

| Fonte | XP padrão |
|---|---|
| Pagamento de assinatura mensal | +50 XP |
| Compra na loja | +1 XP por R$1 pago |
| Criar tópico no fórum | +10 XP (máx 3x/dia) |
| Comentário no fórum | +5 XP (máx 10x/dia) |
| Submissão em torneio | +20 XP |
| Top 1 em torneio | +200 XP |
| Top 3 em torneio | +100 XP |
| Entrar em rifa | +5 XP |

### Níveis e descontos

| Nível | XP mínimo | Desconto loja | Cashback % |
|---|---|---|---|
| Bronze | 0 | 5% | 3% |
| Prata | 500 | 10% | 4% |
| Ouro | 1.500 | 15% | 5% |
| Diamante | 5.000 | 20% | 6% |
| Lenda | 15.000 | 25% | 8% |

### Cashback (expira após X meses — configurável)

- Modelo de ledger imutável — nunca atualiza linha, só insere
- Saldo calculado via view `cashback.balance`
- Cashback expirado → convertido em XP bônus (1 XP por R$0,10)
- Limite de uso por pedido configurável (ex: máx 30% do total)
- Pode ser usado em: loja, tickets de rifa, troca por produto

---

## Infraestrutura — Easypanel + Docker

### Um Dockerfile por app na raiz do monorepo

```
Dockerfile.landing
Dockerfile.pwa
Dockerfile.admin
Dockerfile.super-admin
Dockerfile.bff
```

### Padrão Dockerfile — Next.js (multistage)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune [app-name] --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=[app-name]

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# ... copia standalone e roda
CMD ["node", "apps/[app-name]/server.js"]
```

### next.config.js — obrigatório em todos os apps Next.js

```javascript
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
}
```

### Serviços no Easypanel

| Serviço | Dockerfile | Domínio |
|---|---|---|
| clube-landing | Dockerfile.landing | clube.com.br |
| clube-pwa | Dockerfile.pwa | *.clube.com.br |
| clube-admin | Dockerfile.admin | admin.*.clube.com.br |
| clube-super-admin | Dockerfile.super-admin | superadmin.clube.com.br |
| clube-bff | Dockerfile.bff | api.clube.com.br |
| clube-postgres | template Easypanel | interno |
| clube-redis | template Easypanel | interno |

---

## Testes

### BFF e Serviços — Vitest + testcontainers

```typescript
// Teste de integração — rota completa com banco real
describe('POST /v1/raffles/:id/join', () => {
  it('converte assinatura em tickets corretamente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/raffles/${raffleId}/join`,
      headers: { authorization: `Bearer ${subscriberToken}` },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().count).toBe(60) // 29.90 / 0.50 = 59.8 → ceil = 60
  })
})
```

### Next.js — Vitest + Testing Library + Playwright

```
Unitários   → Vitest + Testing Library (componentes e hooks)
E2E         → Playwright (fluxos completos: assinar → comprar → cashback)
```

### Onde ficam os testes

```
services/[nome]/src/
├── domain/entities/__tests__/
├── application/[recurso]/__tests__/
└── infrastructure/http/routes/__tests__/

apps/[nome]/src/
├── modules/[modulo]/components/__tests__/
├── modules/[modulo]/hooks/__tests__/
└── e2e/                                    # Playwright
```

### Cobertura mínima obrigatória

- Usecases: 100%
- Repositories: 80%
- Rotas HTTP: 90%
- Componentes críticos (checkout, formulários): 80%

---

## Convenções de Código

### TypeScript

- `strict: true` em todos os tsconfig
- Nunca use `any` — use `unknown` e faça narrowing
- Prefira `type` a `interface` para objetos de dados
- Prefira `interface` para contratos implementáveis (repositories)
- Exports nomeados — nunca `export default` em serviços e usecases

### Nomenclatura

```
arquivos:         kebab-case          (create-offer.usecase.ts)
classes:          PascalCase          (OfferRepository)
funções/vars:     camelCase           (createOffer)
constantes:       UPPER_SNAKE_CASE    (MAX_TICKETS_PER_USER)
schemas TypeBox:  PascalCase + Schema (CreateOfferSchema)
schemas Zod:      camelCase + Schema  (createOfferSchema)
tabelas SQL:      snake_case          (order_items)
colunas SQL:      snake_case          (tenant_id, created_at)
env vars:         UPPER_SNAKE_CASE    (ASAAS_API_KEY)
```

### Imports — ordem obrigatória

```typescript
// 1. Node built-ins
import { createHmac } from 'crypto'

// 2. Dependências externas
import { Type } from '@sinclair/typebox'
import { eq } from 'drizzle-orm'

// 3. Packages do monorepo
import type { Offer } from '@clube/shared-types'
import { setRole } from '@clube/firebase-utils'

// 4. Imports internos do serviço/app (com @/)
import { OfferRepository } from '@/infrastructure/db/repositories'
import { DomainError } from '@/domain/errors'
```

### Erros

```typescript
// Sempre use DomainError — nunca throw string ou Error genérico
export class OfferNotFoundError extends DomainError {
  constructor(offerId: string) {
    super(`Offer ${offerId} not found`, 'OFFER_NOT_FOUND', 404)
  }
}

// Na rota, o error-plugin converte automaticamente para resposta padronizada
// { "error": { "code": "OFFER_NOT_FOUND", "message": "..." } }
```

---

## Variáveis de Ambiente

### BFF / Serviços

```bash
# Banco
DATABASE_URL=postgresql://user:pass@localhost:5432/clube?schema=[nome]

# Redis
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=   # JSON em base64

# Asaas
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_ENV=sandbox           # sandbox | production

# Melhor Envio
MELHOR_ENVIO_TOKEN=
MELHOR_ENVIO_ENV=sandbox

# Storage
STORAGE_BUCKET=
STORAGE_URL=

# App
PORT=3001
NODE_ENV=development
```

### Next.js (PWA / Admin)

```bash
# API
NEXT_PUBLIC_BFF_URL=https://api.clube.com.br

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# App
NEXTAUTH_SECRET=
NODE_ENV=development
```

---

## Portas — Desenvolvimento Local

| Serviço | Porta |
|---|---|
| landing | 3000 |
| pwa | 3001 |
| admin | 3002 |
| super-admin | 3003 |
| bff | 3004 |
| subscriptions | 3005 |
| store | 3006 |
| cashback | 3007 |
| raffles | 3008 |
| tournaments | 3009 |
| community | 3010 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Comandos Principais

```bash
# Instalar dependências
npm install

# Desenvolvimento — tudo junto
npm run dev

# Desenvolvimento — app específico
npm run dev --filter=pwa
npm run dev --filter=admin
npm run dev --filter=bff

# Build
npm run build
npm run build --filter=pwa

# Testes
npm run test
npm run test --filter=bff
npm run test:e2e --filter=pwa

# Migrations (dentro do serviço)
cd services/[nome]
npx drizzle-kit generate
npx drizzle-kit migrate

# Lint + typecheck
npm run lint
npm run typecheck
```

---

## O que NÃO fazer

- Nunca coloque lógica de negócio em rotas Fastify
- Nunca faça query Drizzle fora de um repository
- Nunca use `useEffect` + `fetch` em vez de React Query
- Nunca use `useState` para campos de formulário — use react-hook-form
- Nunca acesse schema de outro serviço diretamente via banco
- Nunca processe webhook de forma síncrona — sempre enfileire no BullMQ
- Nunca use `any` em TypeScript
- Nunca commite `.env` — use `.env.example` com valores fictícios
- Nunca edite migration já aplicada — crie uma nova
- Nunca coloque segredo em variável `NEXT_PUBLIC_` — ela é exposta no browser
- Nunca chame `getIdToken()` sem `true` após mudança de role Firebase