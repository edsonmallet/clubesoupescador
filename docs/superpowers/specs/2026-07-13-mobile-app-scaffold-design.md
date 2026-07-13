# Mobile App — Esqueleto Expo (Fase 0 do mobile)

**Data:** 2026-07-13
**Status:** Aprovado para planejamento

## Contexto

O usuário pediu a implementação completa de um app React Native/Expo em
`mobile/app` — incluindo módulos de auth e offers "idênticos ao PWA". Ao
explorar o repositório, constatamos que **nenhum desses arquivos de
referência existe ainda**: `apps/pwa/src/` só tem o placeholder da Fase 0
web (`layout.tsx`, `page.tsx`, `middleware.ts`, `cn.ts`). Não há
`shared/services/api-client.ts`, `shared/store/{auth,tenant}.store.ts`, nem
nenhum `modules/` (offers, auth etc.) em lugar nenhum do monorepo — essas
peças só entram no roadmap a partir da Fase 1 (Auth + Multi-tenant) e Fase 2
(Assinaturas), que ainda não começaram.

Decisão do usuário: construir agora só o **esqueleto do mobile** —
equivalente à Fase 0 dos outros apps (estrutura pronta, roda, sem lógica de
negócio) — e deixar os módulos de auth/offers/notificações/telas para
quando as fases web correspondentes existirem de verdade. Isso evita
inventar um padrão de referência no mobile que o PWA teria que copiar
depois, invertendo a ordem natural do roadmap.

## Decisões técnicas resolvidas nesta sessão

- **`@clube/ui` não é referenciado no mobile.** O pacote atual (Task 7 da
  Fase 0 web) é shadcn/ui puro — `Button` renderiza `<button>` HTML e usa
  `@radix-ui/react-slot`/`class-variance-authority`, nada disso roda em
  React Native (sem DOM). O `tsconfig.json` do mobile só ganha o path alias
  para `@clube/shared-types` (tipos puros, funcionam em qualquer runtime).
  Um `@clube/ui-native` (ou equivalente) fica para quando houver
  necessidade real de componentes compartilhados.
- **Firebase Auth não é instalado nesta fase.** A escolha entre Firebase JS
  SDK (compatível com Expo Go) e `@react-native-firebase/*` (exige dev
  client/prebuild) é adiada para quando a Fase 1 de auth mobile for
  desenhada — instalar qualquer uma agora seria decisão prematura sem
  código que a use.
- **Nenhuma tela de negócio é criada agora.** Todas as 7 telas do pedido
  original (login, cadastro, catálogo, detalhe de oferta, pedidos, perfil,
  layout autenticado) dependem de auth ou de offers — nenhuma faz sentido
  sem essas camadas. Segue o mesmo padrão da Fase 0 web: uma única rota
  placeholder ("Em construção"), sem os grupos de rota `(public)/`/`(auth)/`
  ainda (esses só aparecem quando há conteúdo real para separar — nenhum
  app Next.js da Fase 0 os criou antecipadamente).

## Escopo desta fase

### `mobile/app/` — projeto Expo

- Expo SDK 57 + Expo Router (file-based routing), TypeScript 5.x `strict: true`.
- `package.json`: nome `@clube/mobile`, scripts `dev` (`expo start`),
  `build` (`expo export`, output em `dist/` — compatível com o padrão de
  `outputs` já definido em `turbo.json`), `typecheck` (`tsc --noEmit`),
  `test` (Jest via `jest-expo`).
- `tsconfig.json`: estende `../../tsconfig.base.json`, `paths` com alias só
  para `@clube/shared-types` (aponta pro `dist/index.d.ts` já compilado na
  Fase 0 web).
- **Estrutura de pastas** (mesma convenção dos apps Next.js do CLAUDE.md,
  adaptada):
  ```
  mobile/app/src/
  ├── app/
  │   └── index.tsx        # rota placeholder única, "Em construção"
  ├── modules/              # vazio — populado nas próximas fases
  └── shared/
      ├── services/         # vazio
      ├── store/            # vazio
      ├── hooks/            # vazio
      └── utils/
          └── cn.ts         # helper de classe (clsx/tailwind-merge, sem depender de @clube/ui)
  ```
- **NativeWind**: configurado (`babel.config.js`, `metro.config.js`,
  `tailwind.config.js`, `global.css` ou equivalente) — infraestrutura de
  estilo pronta, sem componentes reais que a usem ainda além do placeholder.
- **`app.json`**: `scheme: "clube"`, `plugins: ["expo-router"]` (sem
  plugins de Firebase/notifications nesta fase), `ios.bundleIdentifier` e
  `android.package` fixados em `br.com.clube.app` (mesmo domínio reverso
  para as duas plataformas; pode ser trocado depois sem impacto nesta fase).
- **`.env.example`**: só `EXPO_PUBLIC_BFF_URL=http://localhost:3004` — as
  variáveis `EXPO_PUBLIC_FIREBASE_*` entram quando a Fase 1 de auth mobile
  for desenhada.
- **Teste de fumaça**: Jest + `jest-expo`, um teste renderizando a rota
  placeholder e confirmando o texto "Em construção" — mesmo padrão de
  verificação que todo workspace da Fase 0 web recebeu.

### Integração ao monorepo

- Root `package.json`: adicionar `"mobile/*"` ao array `workspaces`
  (hoje é `["apps/*", "services/*", "packages/*"]`).
- `turbo.json`: os pipelines `dev`/`build`/`typecheck`/`test` já são
  genéricos por nome de script (não por workspace), então não deveriam
  precisar de mudança — a implementação confirma isso rodando
  `npm run build`/`typecheck`/`test` no monorepo inteiro após criar o
  workspace e, se algo não pegar automaticamente, ajusta o `turbo.json`
  então.
- `biome.json` já cobre o monorepo inteiro (`npx biome check .`) — o
  código novo do mobile precisa passar limpo nele, sem config adicional.

### Critérios de verificação desta fase

1. `npm install` na raiz reconhece `@clube/mobile` como workspace.
2. `npm run typecheck` inclui `mobile/app` e passa limpo.
3. `npm run build` inclui `mobile/app` (via `expo export`) e passa limpo.
4. `npm run test` inclui `mobile/app` e o teste de fumaça passa.
5. `npx biome check .` continua limpo incluindo os arquivos novos.
6. `npm run dev --workspace=mobile/app` (ou `@clube/mobile`) sobe o Metro
   bundler sem erro (verificação manual — não há um "health check" HTTP
   como nos apps Fastify/Next.js).

### Fora de escopo nesta fase

- Módulos `auth`, `offers`, `orders`, `cashback`, `raffles`, `community`,
  `tournaments`.
- Firebase Auth (SDK a decidir), API client (`shared/services/api-client.ts`),
  stores Zustand de auth/tenant.
- Push notifications (Expo Notifications + FCM), registro de token no BFF.
- As 7 telas do MVP mobile (login, cadastro, catálogo, detalhe de oferta,
  pedidos, perfil, layout autenticado) e os grupos de rota `(public)/`/`(auth)/`.
- `@clube/ui` (ou um futuro `@clube/ui-native`) como dependência do mobile.
