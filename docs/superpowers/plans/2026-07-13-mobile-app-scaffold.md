# Mobile App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a working Expo + Expo Router app at `mobile/app`, integrated into the existing npm/Turborepo monorepo, with no business logic — the mobile equivalent of what Fase 0 did for the web apps.

**Architecture:** A single new npm workspace (`@clube/mobile`) created via Expo's official CLI, then customized to match the monorepo's conventions: `src/app/` (not root `app/`) for Expo Router routes, a path alias to `@clube/shared-types`, NativeWind for styling, and a Jest smoke test proving the placeholder route renders. Metro's config is extended so it can resolve workspace packages hoisted to the monorepo root's `node_modules`.

**Tech Stack:** Expo (current stable SDK, resolved by the CLI at scaffold time — do not hardcode an SDK number in package.json; let `create-expo-app` pick the real current version), Expo Router, TypeScript strict, NativeWind v4 + Tailwind CSS v3, Jest (`jest-expo` preset) + `@testing-library/react-native`.

## Global Constraints

- TypeScript 5.x, `strict: true`, no `any` anywhere.
- Biome formatting: single quotes, no semicolons (`asFormatted` by the repo's root `biome.json` — run `npx biome check .` from the repo root, not a mobile-local linter).
- Named exports only — never `export default` in services/hooks (this constraint doesn't bind this scaffold-only plan since no services/hooks exist yet, but keep it in mind: `app/**/*.tsx` route files ARE required by Expo Router to use `export default`, which is the one legitimate exception).
- `tsconfig.json` path alias covers **only** `@clube/shared-types` — do NOT add `@clube/ui` (it's a web-only shadcn/ui package, incompatible with React Native; see the design spec's "Decisões técnicas resolvidas" section).
- No auth, offers, orders, or any other business-logic module in this plan. No Firebase dependency. No screens beyond a single placeholder route.
- No `(public)/`/`(auth)/` route groups yet — one placeholder route only, matching how `apps/landing`/`pwa`/`admin`/`super-admin` did it in Fase 0.
- Workspace name: `@clube/mobile`. Directory: `mobile/app` (note: nested one level deeper than `apps/*`/`services/*`/`packages/*`).
- Every workspace-wide command (`npm run build`, `npm run typecheck`, `npm run test`, `npx biome check .`) must stay green across the **whole monorepo**, not just `mobile/app`, after each task.

---

### Task 1: Scaffold the Expo project and wire it into the monorepo workspace

**Files:**
- Create: `mobile/app/` (via Expo's official scaffolding CLI — creates `package.json`, `app.json`, `tsconfig.json`, `src/app/` or `app/`, and other Expo-managed files)
- Modify: `mobile/app/package.json` (rename, add scripts)
- Modify: `mobile/app/tsconfig.json` (extend the monorepo base config, add the `@clube/shared-types` path alias)
- Modify: `/Users/edsonmallet/Documents/Projects/estudos/soupescador/package.json` (add `"mobile/*"` to `workspaces`)
- Create: `mobile/app/.env.example`

**Interfaces:**
- Consumes: `@clube/shared-types`'s compiled output at `packages/shared-types/dist/index.d.ts` (already built in Fase 0 — verify it exists before aliasing to it; if missing, run `npm run build --workspace=@clube/shared-types` first).
- Produces: the `mobile/app` workspace itself — later tasks in this plan add files inside it. No other workspace consumes anything from `mobile/app`.

- [ ] **Step 1: Scaffold the Expo project**

Run from the repo root:

```bash
npx create-expo-app@latest mobile/app --template default
```

This uses Expo's current default template, which has shipped with Expo Router pre-configured and a TypeScript `tsconfig.json` since SDK 50. Do not answer any interactive prompts by guessing — if the CLI prompts for a template choice, pick the plain TypeScript / Expo Router default (not the tabs example, not JavaScript).

- [ ] **Step 2: Verify Expo Router is present, then relocate `app/` under `src/`**

Check the scaffolded output:

```bash
ls mobile/app/app
```

Expected: a directory containing at least `_layout.tsx` and `index.tsx` (Expo Router's file-based routing root).

Move it to match this monorepo's `src/app/` convention (used by every Next.js app in `apps/`):

```bash
mkdir -p mobile/app/src
git -C mobile/app mv app src/app 2>/dev/null || mv mobile/app/app mobile/app/src/app
```

Expo Router auto-detects `src/app` when a `src/` directory exists at the project root (this has been true since Expo Router 3 / SDK 50) — no extra config needed. Verify this worked in Step 7 below (the dev server must find routes under `src/app`, not the old `app/` path).

- [ ] **Step 3: Rename the package and add monorepo-standard scripts**

Read `mobile/app/package.json` first (the CLI-generated version), then edit it — keep whatever `dependencies` the CLI already added (expo, expo-router, react, react-native, etc.), just change `name` and `scripts`:

```json
{
  "name": "@clube/mobile",
  "scripts": {
    "dev": "expo start",
    "build": "expo export",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

(Keep the existing `main`, `version`, `dependencies`, `devDependencies` fields exactly as the CLI generated them — only `name` and `scripts` change in this step. `expo export` writes to `dist/`, matching the `outputs: ["dist/**", ...]` already declared in the root `turbo.json`'s `build` task, so no `turbo.json` change should be needed — confirmed in Task 4.)

- [ ] **Step 4: Add `mobile/*` to the root workspaces array**

Read `/Users/edsonmallet/Documents/Projects/estudos/soupescador/package.json` first. Change:

```json
"workspaces": ["apps/*", "services/*", "packages/*"]
```

to:

```json
"workspaces": ["apps/*", "services/*", "packages/*", "mobile/*"]
```

- [ ] **Step 5: Add the `tsconfig.json` path alias**

Read the CLI-generated `mobile/app/tsconfig.json` first — Expo's template extends `expo/tsconfig.base` with its own `compilerOptions`. Merge in the monorepo's base config and the shared-types alias without dropping Expo's required settings (`jsx`, path aliases for `@/*` if the template added one):

```json
{
  "extends": ["expo/tsconfig.base", "../../tsconfig.base.json"],
  "compilerOptions": {
    "paths": {
      "@clube/shared-types": ["../../packages/shared-types/dist/index.d.ts"]
    },
    "strict": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

If the CLI-generated file already has a `"paths"` entry (e.g. a default `@/*` alias pointing at `./src/*` or `./*`), keep it alongside the new `@clube/shared-types` entry — merge the two `paths` objects, don't replace one with the other.

- [ ] **Step 6: Create `.env.example`**

Create `mobile/app/.env.example`:

```
EXPO_PUBLIC_BFF_URL=http://localhost:3004
```

- [ ] **Step 7: Configure `app.json`**

Read the CLI-generated `mobile/app/app.json` first — keep its existing `expo.name`/`expo.slug`/`expo.icon`/`expo.splash` fields as generated. Edit only these fields:

```json
{
  "expo": {
    "scheme": "clube",
    "plugins": ["expo-router"],
    "ios": {
      "bundleIdentifier": "br.com.clube.app"
    },
    "android": {
      "package": "br.com.clube.app"
    }
  }
}
```

If the CLI already generated a `plugins` array (e.g. with `"expo-splash-screen"` or similar auto-added entries), merge `"expo-router"` into it rather than replacing the array — do not remove CLI-added plugins you don't recognize, since removing one that the scaffold actually depends on (e.g. a splash-screen or font-loading plugin) could break the app at runtime. Only add entries for Firebase or notifications if they're already present from the CLI (they shouldn't be) — do not add them yourself, per the Global Constraints.

- [ ] **Step 8: Install and verify the workspace is recognized**

```bash
npm install
npm ls @clube/mobile
```

Expected: `npm ls @clube/mobile` prints the workspace with its resolved path, no `ERR!` about a missing/unresolved workspace.

```bash
npm run typecheck --workspace=@clube/mobile
```

Expected: passes clean (the Expo template's own default `app/_layout.tsx`/`index.tsx` — now at `src/app/`— should already typecheck with no errors).

- [ ] **Step 9: Commit**

```bash
git add mobile/app package.json
git commit -m "feat: scaffold Expo app and add mobile/* to npm workspaces"
```

---

### Task 2: NativeWind + Metro monorepo configuration

**Files:**
- Create/Modify: `mobile/app/metro.config.js`
- Create/Modify: `mobile/app/babel.config.js`
- Create: `mobile/app/tailwind.config.js`
- Create: `mobile/app/global.css`
- Create: `mobile/app/nativewind-env.d.ts`
- Modify: `mobile/app/src/app/_layout.tsx` (import the global stylesheet)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: NativeWind's `className` prop becomes usable on RN components anywhere under `mobile/app/src/`. Task 3's placeholder route relies on this.

- [ ] **Step 1: Install NativeWind and its peer dependencies**

```bash
npm install nativewind@^4 tailwindcss@^3 --workspace=@clube/mobile
npx expo install react-native-reanimated react-native-safe-area-context --workspace=@clube/mobile
```

(`react-native-reanimated` and `react-native-safe-area-context` are NativeWind v4's required peer dependencies; `npx expo install` picks the exact patch versions compatible with whatever Expo SDK Task 1 scaffolded, which is why we don't hardcode their versions here.)

- [ ] **Step 2: Generate the default Metro config, then customize it for the monorepo + NativeWind**

```bash
cd mobile/app
npx expo customize metro.config.js
cd ../..
```

This writes a starter `mobile/app/metro.config.js`. Replace its contents with:

```js
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
```

The `watchFolders`/`nodeModulesPaths` block is what lets Metro resolve `@clube/shared-types`, which npm hoists to the monorepo root's `node_modules` as a symlink into `packages/shared-types` — without it, Metro (unlike Node) won't look outside `mobile/app/node_modules` and the import will fail to bundle even though `tsc` resolves it fine.

- [ ] **Step 3: Configure Babel**

Read the CLI-generated `mobile/app/babel.config.js` first (Expo's template already creates one with `presets: ['babel-preset-expo']`). Add the NativeWind preset alongside it:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

- [ ] **Step 4: Create the Tailwind config**

Create `mobile/app/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: Create the global stylesheet**

Create `mobile/app/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Import the stylesheet in the root layout**

Read `mobile/app/src/app/_layout.tsx` first (created by the Task 1 scaffold). Add this as the first line, before any other import:

```typescript
import '../../global.css'
```

- [ ] **Step 7: Add the NativeWind TypeScript ambient types**

Create `mobile/app/nativewind-env.d.ts`:

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 8: Verify typecheck still passes**

```bash
npm run typecheck --workspace=@clube/mobile
```

Expected: passes clean. `className` should now be a recognized prop on `<View>`/`<Text>`/etc. inside `mobile/app/src/` — you can sanity-check this by temporarily adding `className="flex-1"` to a component in `_layout.tsx` and confirming no red squiggle/type error, then removing it again (Task 3 adds real usage).

- [ ] **Step 9: Commit**

```bash
git add mobile/app
git commit -m "feat: configure NativeWind and Metro monorepo resolution"
```

---

### Task 3: Folder structure, placeholder route, and smoke test

**Files:**
- Create: `mobile/app/src/shared/utils/cn.ts`
- Modify: `mobile/app/src/app/index.tsx` (replace CLI-generated content with the placeholder)
- Create: `mobile/app/src/app/index.test.tsx`
- Create: `mobile/app/jest.config.js`
- Modify: `mobile/app/package.json` (add Jest devDependencies via npm install, not hand-edited)

**Interfaces:**
- Consumes: `cn` utility pattern mirrors `apps/*/src/shared/utils/cn.ts` (Fase 0 web convention) but is self-contained here — does NOT import from `@clube/ui` (per the design spec's decision).
- Produces: nothing consumed by other tasks in this plan; this is the final content-bearing task before verification.

**Note on `modules/` and `shared/{services,store,hooks}`:** the design spec calls these out as "vazio — populado nas próximas fases." Git cannot track empty directories, so — matching exactly how `apps/landing`/`pwa`/`admin`/`super-admin` handled this in Fase 0 — do NOT create empty placeholder folders or `.gitkeep` files for them here. Only `shared/utils/` gets created, because it has real content (`cn.ts`) in this task.

- [ ] **Step 1: Install Jest tooling**

```bash
npx expo install jest-expo jest --workspace=@clube/mobile
npm install --save-dev @testing-library/react-native @types/jest --workspace=@clube/mobile
```

- [ ] **Step 2: Configure Jest**

Create `mobile/app/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
}
```

- [ ] **Step 3: Create the `cn` utility**

Create `mobile/app/src/shared/utils/cn.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

Install its dependencies:

```bash
npm install clsx tailwind-merge --workspace=@clube/mobile
```

- [ ] **Step 4: Write the failing test**

Create `mobile/app/src/app/index.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react-native'
import Index from './index'

describe('Index route', () => {
  it('renders the placeholder text', () => {
    render(<Index />)
    expect(screen.getByText('Em construção.')).toBeTruthy()
  })
})
```

- [ ] **Step 5: Run the test and confirm it fails**

```bash
npx jest --config mobile/app/jest.config.js --rootDir mobile/app src/app/index.test.tsx
```

Expected: FAIL — either the current `index.tsx` (still the CLI-generated starter content) doesn't render the text "Em construção.", or the file doesn't export a component matching this shape yet.

- [ ] **Step 6: Implement the placeholder route**

Replace the full contents of `mobile/app/src/app/index.tsx`:

```typescript
import { Text, View } from 'react-native'

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold">Clube de Vendas com Assinaturas</Text>
      <Text className="mt-2 text-base">Em construção.</Text>
    </View>
  )
}
```

- [ ] **Step 7: Run the test and confirm it passes**

```bash
npx jest --config mobile/app/jest.config.js --rootDir mobile/app src/app/index.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add mobile/app
git commit -m "feat: add placeholder route, cn utility, and smoke test"
```

---

### Task 4: Monorepo-wide verification

**Files:** none — this task only runs and reads command output, per the design spec's verification criteria.

**Interfaces:** none.

- [ ] **Step 1: Full install from a clean state**

```bash
rm -rf node_modules mobile/app/node_modules
npm install
```

Expected: installs all 18 workspaces (the prior 17 from Fase 0 plus `@clube/mobile`) with no error.

- [ ] **Step 2: Full typecheck**

```bash
npm run typecheck
```

Expected: all 18 workspace typecheck tasks pass, including `@clube/mobile`.

- [ ] **Step 3: Full build**

```bash
npm run build
```

Expected: all 18 workspace build tasks pass, including `@clube/mobile`'s `expo export`, which writes to `mobile/app/dist/`. If Turborepo reports `@clube/mobile#build` as a task with no matching `outputs` glob (unlikely, since the root `turbo.json`'s `build` task already declares `"outputs": ["dist/**", ".next/**", "!.next/cache/**"]` for every workspace), read the error and add a `mobile/app`-specific override to `turbo.json`'s `tasks.build` — otherwise, no `turbo.json` change is needed.

- [ ] **Step 4: Full test suite**

```bash
npm run test
```

Expected: all 18 workspace test tasks pass — `@clube/mobile` contributes the 1 smoke test from Task 3.

- [ ] **Step 5: Biome check**

```bash
npx biome check .
```

Expected: clean. If `mobile/app`'s CLI-generated files (e.g. `app.json`, `expo-env.d.ts`) trip formatting rules, run `npx biome check --write .` and review the diff before committing — it should only touch quote style/semicolons, never logic.

- [ ] **Step 6: Manual dev-server smoke check**

```bash
npm run dev --workspace=@clube/mobile &
sleep 15
```

Expected: Metro bundler starts with no error in the log (check via the terminal output or a log file redirect — e.g. `npm run dev --workspace=@clube/mobile > /tmp/expo-dev.log 2>&1 &` then `grep -i error /tmp/expo-dev.log`). There's no HTTP `/health` endpoint to curl here (unlike the Fastify services) — a clean Metro startup log with the QR code / "Waiting on exp://..." message is the success signal. Kill the process afterward:

```bash
pkill -f "expo start"
```

Confirm via `ps aux | grep expo` that nothing was left running.

- [ ] **Step 7: Commit (only if Step 5's `--write` changed anything)**

```bash
git add -A
git commit -m "chore: final mobile scaffold verification pass"
```

If Step 5 found nothing to fix, skip this commit — there's nothing new to commit.
