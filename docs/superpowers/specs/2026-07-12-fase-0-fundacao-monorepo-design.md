# Fase 0 — Fundação do Monorepo

**Data:** 2026-07-12
**Status:** Aprovado para planejamento

## Contexto

Este é o primeiro de uma série de sub-projetos que constroem a plataforma
"Clube de Vendas com Assinaturas" descrita em `CLAUDE.md`. "Sou Pescador"
será o primeiro tenant de teste rodando sobre essa plataforma SaaS
multi-tenant genérica — não é uma marca própria do SaaS.

O repositório está vazio (só `claude.md`). Esta fase constrói o esqueleto
completo do monorepo: todos os 5 apps, 6 services e 6 packages descritos no
CLAUDE.md, cada um mínimo mas rodável (health check / placeholder), sem
lógica de negócio. Fases seguintes preenchem lógica dentro dessa estrutura
já existente.

### Ordem geral das fases (contexto, não escopo desta spec)

0. **Fundação do monorepo** (esta fase)
1. Auth + Multi-tenant + Tenants (Firebase, RBAC, resolução de tenant real, criação do tenant Sou Pescador)
2. Assinaturas — fatia vertical mínima (Asaas + webhook + BullMQ → subscriber)
3. Loja (produtos, pedidos, preço de custo)
4. Landing page do tenant (template renderizado)
5. PWA (área do membro)
6. Admin (painel do lojista)
7+. Gamificação, cashback, rifas, torneios, comunidade, super-admin

## Escopo desta fase

Criar a estrutura completa de pastas e arquivos mínimos de todo o monorepo,
de forma que tudo suba localmente e responda, sem nenhuma lógica de negócio
real ainda.

### Ferramental raiz

- **Gerenciador de pacotes:** npm workspaces (`apps/*`, `services/*`, `packages/*`).
- **Orquestração:** Turborepo — `turbo.json` com pipelines `dev`, `build`, `lint`, `typecheck`, `test`.
- **TypeScript:** `tsconfig.base.json` na raiz, `strict: true`, estendido por todo pacote/app/serviço.
- **Lint + format:** Biome (`biome.json` único na raiz) — substitui ESLint/Prettier em todos os projetos.
- **Git:** repositório inicializado nesta fase; `.gitignore` cobre `node_modules`, `.env`, `.next`, `dist`, `.turbo`.
- **docker-compose.yml:** apenas infraestrutura local — `postgres:16-alpine` e `redis:7-alpine`, com healthcheck, portas 5432 e 6379. Os apps rodam via `npm run dev` local, não em container; os `Dockerfile.*` (um por app/serviço) são para build de produção (Easypanel), preocupação separada do compose local.
- **.env.example:** um na raiz agregando todas as variáveis das duas tabelas do CLAUDE.md (BFF/services e Next.js) com valores fictícios, e um `.env.example` por app/serviço com apenas as variáveis que ele usa.

### Packages compartilhados (`packages/`)

| Pacote | Conteúdo desta fase |
|---|---|
| `shared-types` | `Role`, `CustomClaims` (exatos do CLAUDE.md) e tipo `Tenant` mínimo. Entidades de negócio entram nas fases que as criarem. |
| `ui` | shadcn/ui: `components.json`, `lib/utils.ts` (`cn`), preset Tailwind exportado, componente `Button` de exemplo. |
| `firebase-utils` | `setRole`, `getRole`, `revokeRole` — código exato do CLAUDE.md; Admin SDK inicializado via env. |
| `asaas-sdk` | Classe `AsaasClient` com resolução sandbox/production por `ASAAS_ENV` e helper `request()` genérico. Métodos de negócio (createSubscription etc.) entram na Fase 2. |
| `db-client` | `createDbClient(schema, connectionString)` — factory Drizzle configurável por schema (`drizzle-orm/node-postgres`). |
| `fastify-plugins` | Plugins `cors`, `health` (`GET /health`), `error-handler` (converte erros no formato `{code, statusCode, message}` para resposta padronizada `{error:{code,message}}`, por shape — não por import de classe), `scalar` (`/docs` via OpenAPI). Inclui `createTenantAuthPreHandler()` — helper reutilizável de resolução de tenant + verificação de JWT Firebase, para evitar duplicar a lógica 7 vezes (BFF + 6 services). |

**Decisão de design — `DomainError`:** o CLAUDE.md mostra `domain/errors/`
dentro de cada serviço, não um pacote compartilhado. Cada serviço define sua
própria classe base `DomainError` localmente; o plugin `error-handler`
detecta erros de domínio pelo formato (`code`, `statusCode`, `message`), não
por `instanceof` de uma classe importada. Isso evita criar um sétimo pacote
que o CLAUDE.md não lista, mantendo os serviços desacoplados entre si.

### Apps Next.js (`apps/landing`, `apps/pwa`, `apps/admin`, `apps/super-admin`)

- `src/app/layout.tsx` + `page.tsx` placeholder ("Em construção").
- `src/modules/` vazio (preenchido nas fases seguintes).
- `src/shared/utils/cn.ts` reexportando de `@clube/ui`.
- `proxy.ts` de resolução de tenant por subdomínio **apenas em `pwa` e `admin`** — `landing` e `super-admin` vivem em domínio fixo, sem lógica multi-tenant.
- `next.config.js` com `output: 'standalone'` + `outputFileTracingRoot` apontando pra raiz do monorepo.
- Tailwind + Biome configurados; `package.json` e `tsconfig.json` (estende o base).
- `.env.example` próprio.

### BFF (`apps/bff`) e services (`services/{subscriptions,store,cashback,raffles,tournaments,community}`)

- Árvore de pastas exata do CLAUDE.md: `domain/{entities,value-objects,errors,interfaces}`, `application/`, `infrastructure/{db,http,queue,external}`, `shared/{errors,logger,types}`.
- `index.ts` faz o bootstrap: valida env com `@t3-oss/env-core` + Zod, registra os plugins de `@clube/fastify-plugins`, registra `proxy.ts` (via `createTenantAuthPreHandler`), sobe na porta correta conforme a tabela de portas do CLAUDE.md (BFF=3004, subscriptions=3005, store=3006, cashback=3007, raffles=3008, tournaments=3009, community=3010).
- `infrastructure/db/schema/index.ts` vazio — tabelas reais chegam na fase de negócio de cada serviço. `drizzle.config.ts` já aponta para o schema do serviço.
- Rota `GET /health` + teste de fumaça Vitest (`app.inject('/health')` → 200).
- Um `Dockerfile.<nome>` por serviço além dos 5 já listados no CLAUDE.md — pequena extrapolação: como cada serviço roda como processo independente em porta própria, precisa de imagem própria para deploy.
- No BFF, `resolveTenantBySlug`/`resolveTenantByDomain` ficam com stub (`TODO: Fase 1`), retornando `null` — a lógica real de consulta ao banco de tenants é da Fase 1.

### Critérios de verificação desta fase

1. `npm install` na raiz completa sem erro.
2. `docker-compose up -d` → Postgres e Redis saudáveis.
3. `npm run dev` sobe as 17 workspaces via Turborepo sem crash.
4. `curl` nos 7 healthchecks (portas 3004–3010) retorna `{status:"ok"}`.
5. As 4 páginas Next.js (portas 3000–3003) renderizam o placeholder.
6. `npm run build`, `npm run typecheck`, `npm run test` (7 smoke tests) e `npx biome check` passam limpos.

### Fora de escopo nesta fase

- Resolução real de tenant no banco (Fase 1).
- Firebase configurado de verdade (só env de exemplo).
- Migrations/tabelas de negócio reais.
- Fluxo de autenticação ponta-a-ponta.
- Testes Playwright/e2e (chegam quando houver fluxo real de UI para testar).
- CI/CD (não especificado no CLAUDE.md).
