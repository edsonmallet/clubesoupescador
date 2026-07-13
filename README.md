# Clube — Clube de Vendas com Assinaturas

Plataforma SaaS B2B2C multi-tenant de clube de vendas com assinaturas. Distribuidoras e marcas fornecem produtos, lojistas criam seus clubes, membros pagam mensalidade e compram com preço de custo. "Sou Pescador" é o primeiro tenant de teste rodando sobre essa plataforma.

Arquitetura completa (roles, banco, filas, gamificação etc.) está documentada em [claude.md](claude.md). Este README cobre só o "como rodar".

> **Status atual:** Fase 0 (fundação do monorepo) concluída — 17 workspaces com health check, sem lógica de negócio ainda. Nenhum serviço abre conexão real com banco/Redis nesta fase.

## Estrutura do monorepo

```
apps/
  landing/       Next.js — clube.com.br (marketing, domínio fixo)
  pwa/           Next.js — [slug].clube.com.br (área do membro)
  admin/         Next.js — admin.[slug].clube.com.br (painel do lojista)
  super-admin/   Next.js — superadmin.clube.com.br (painel do operador do SaaS)
  bff/           Fastify — api.clube.com.br (gateway único pros apps)
services/
  subscriptions/ cashback/ store/ raffles/ tournaments/ community/
packages/
  shared-types/ ui/ firebase-utils/ asaas-sdk/ db-client/ fastify-plugins/
```

## Pré-requisitos

- Node.js 20+
- npm 10+ (o repo usa npm workspaces, não pnpm/yarn)
- Acesso a uma instância Postgres 16 e Redis (não roda em docker-compose local — ver [Banco de dados e Redis](#banco-de-dados-e-redis))

## Instalação

```bash
git clone <repo>
cd soupescador
npm install
```

Isso instala as 17 workspaces de uma vez (`apps/*`, `services/*`, `packages/*`).

## Variáveis de ambiente

Copie o template da raiz e preencha com valores reais:

```bash
cp .env.example .env
```

`.env` nunca é commitado (está no `.gitignore`). Cada app/service também tem seu próprio `.env.example` com só as variáveis que ele usa (ex: `apps/bff/.env.example`, `services/store/.env.example`) — copie os que forem relevantes para o workspace que você for rodar isoladamente.

Variáveis principais:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Postgres 16 |
| `REDIS_URL` | Connection string do Redis |
| `FIREBASE_PROJECT_ID` / `FIREBASE_SERVICE_ACCOUNT` | Auth (Admin SDK, service account em base64) |
| `ASAAS_API_KEY` / `ASAAS_WEBHOOK_TOKEN` / `ASAAS_ENV` | Gateway de pagamento (sandbox \| production) |
| `MELHOR_ENVIO_TOKEN` / `MELHOR_ENVIO_ENV` | Frete |
| `NEXT_PUBLIC_BFF_URL` | URL do BFF, consumida pelos apps Next.js |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK (apps Next.js) |

## Banco de dados e Redis

O projeto usa uma instância Postgres/Redis **já provisionada remotamente** — não há `docker-compose` local para infra. Depois de configurar `DATABASE_URL`/`REDIS_URL` no `.env`, confirme a conectividade:

```bash
npm run verify:infra
```

Espera-se `Postgres: OK` e `Redis: OK`. Nenhum código da Fase 0 abre conexão de banco em runtime, então isso não bloqueia rodar `npm run dev` — só é necessário a partir da Fase 1 (auth + multi-tenant), quando a tabela de tenants passa a ser usada de verdade.

## Rodando em desenvolvimento

Tudo junto (as 17 workspaces via Turborepo):

```bash
npm run dev
```

Um workspace específico:

```bash
npm run dev --workspace=apps/pwa
npm run dev --workspace=apps/bff
npm run dev --workspace=services/store
```

### Portas

| Serviço | Porta | Health check |
|---|---|---|
| landing | 3000 | `GET /` → 200 |
| pwa | 3001 | `GET /` → 200 |
| admin | 3002 | `GET /` → 200 |
| super-admin | 3003 | `GET /` → 200 |
| bff | 3004 | `GET /health` → `{"status":"ok"}` |
| subscriptions | 3005 | `GET /health` → `{"status":"ok"}` |
| store | 3006 | `GET /health` → `{"status":"ok"}` |
| cashback | 3007 | `GET /health` → `{"status":"ok"}` |
| raffles | 3008 | `GET /health` → `{"status":"ok"}` |
| tournaments | 3009 | `GET /health` → `{"status":"ok"}` |
| community | 3010 | `GET /health` → `{"status":"ok"}` |

Conferir tudo de uma vez depois de `npm run dev`:

```bash
for p in 3004 3005 3006 3007 3008 3009 3010; do curl -s "http://localhost:$p/health"; echo; done
for p in 3000 3001 3002 3003; do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$p"; done
```

## Build, testes e lint

```bash
npm run build        # todas as 17 workspaces (packages primeiro, depois apps/services)
npm run typecheck     # tsc --noEmit em todas as workspaces
npm run test          # suíte de testes (Vitest) em todas as workspaces
npm run lint           # Biome — verifica formatação e lint
npm run lint:fix      # Biome — corrige automaticamente
```

Rodar um único workspace:

```bash
npm run build --workspace=@clube/bff
npm run typecheck --workspace=@clube/store
```

## Docker (produção)

Cada app/service tem seu próprio `Dockerfile.<nome>` na raiz, usando `turbo prune` para builds multistage enxutos. Exemplo:

```bash
docker build -f Dockerfile.bff -t clube-bff .
docker build -f Dockerfile.pwa -t clube-pwa .
```

Os apps Next.js sobem via `node apps/<nome>/server.js` (output standalone); o BFF e os services via `node <apps|services>/<nome>/dist/index.js`.

## Migrations (Drizzle)

Dentro de cada service com schema de banco:

```bash
cd services/store
npx drizzle-kit generate
npx drizzle-kit migrate
```

Na Fase 0 os schemas ainda estão vazios (`export const schema = {}`) — tabelas reais chegam junto com a lógica de negócio de cada fase.

## Convenções de código

Ver [claude.md](claude.md) para as regras completas (Clean Architecture nos services, `app/` só roteamento nos apps Next.js, TypeScript strict sem `any`, Biome como linter/formatter etc).
