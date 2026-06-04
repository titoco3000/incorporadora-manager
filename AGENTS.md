# AGENTS.md — incorporadora-manager

This file documents the repository conventions for agentic coding tools.

## Tech Stack

- **Framework:** SvelteKit 2 (Svelte 5 runes API)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Styling:** Scoped `<style>` + CSS custom properties (dark theme)
- **Package manager:** Bun (bun.lock), also compatible with npm

## Build / Lint / Test Commands

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start dev server (vite dev)                      |
| `npm run build`        | Production build (vite build)                    |
| `npm run preview`      | Preview production build                         |
| `npm run start`        | Start production server                          |
| `npm run check`        | Type-check (`svelte-check`)                      |
| `npm run check:watch`  | Type-check in watch mode                         |
| `npm run format`       | Format all files with Prettier                   |
| `npm run lint`         | Prettier check + ESLint                          |
| `npx drizzle-kit push` | Push DB schema changes (after editing schema.ts) |
| `npx svelte-kit sync`  | Generate SvelteKit types                         |

**No test framework is installed** — there are zero tests in the repo. Do not write tests unless explicitly asked.

## Project Structure

```
src/
  lib/
    db/            - Drizzle schema, client, error mapping
    types/         - Shared TypeScript types
    components/    - Reusable Svelte components
    api.ts         - Client-side fetch wrapper with caching
    auth.ts        - Password hashing, JWT sign/verify
    history.ts     - DB history recording and undo
  routes/
    +page.svelte       - Dashboard
    +layout.svelte     - Auth-aware layout
    api/               - REST endpoints (+server.ts)
    form/[form]/       - Dynamic form pages
    table/[table]/     - Dynamic table pages
    history/           - History view
    report/            - Reports
    register/          - User registration
    whitelist/         - Whitelist management
```

## Code Style Guidelines

### Imports

- Use `$lib/` alias for imports from `src/lib/` (e.g., `import { db } from '$lib/db'`)
- Use `$app/` alias for SvelteKit app modules (e.g., `$app/navigation`, `$app/state`)
- Use `$env/dynamic/private` for private env vars
- Use relative imports (`'./foo'`, `'../bar'`) only for sibling/parent files
- Prefer named exports for functions and types; default exports only for Svelte components
- Barrel exports are not used (src/lib/index.ts exists but is empty)

### Formatting (Prettier)

- Tabs for indentation
- Single quotes
- No trailing commas
- Print width: 100
- Svelte files use the Svelte parser

### Naming Conventions

| Element                   | Convention                                     | Examples                                       |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| TS/JS files               | `camelCase.ts`                                 | `auth.ts`, `api.ts`, `sortComparators.ts`      |
| Svelte files              | `PascalCase.svelte`                            | `CustomInput.svelte`, `LoginScreen.svelte`     |
| SvelteKit routes          | `+page.svelte`, `+server.ts`, `+layout.svelte` | Standard                                       |
| Variables / functions     | `camelCase`                                    | `hashPassword`, `filterText`                   |
| Types / interfaces        | `PascalCase`                                   | `MenuItem`, `FormFieldDefinition`, `ColumnDef` |
| DB tables (code)          | `camelCase`                                    | `transactionType`, `whitelistEntry`            |
| DB tables / columns (SQL) | `snake_case`                                   | `transaction_type`, `password_hash`            |
| CSS custom properties     | `--kebab-case`                                 | `--bg-color-2`, `--border-color-1`             |
| Constants                 | `SCREAMING_SNAKE_CASE`                         | `SALT_ROUNDS`                                  |

### TypeScript

- `strict: true` in tsconfig
- Use `type` keyword for type imports: `import type { Foo } from './bar'`
- Derive DB types from Drizzle schema using `InferSelectModel<typeof table>`
- Export DB types in `src/lib/types/api.ts`
- Prefer interfaces for object shapes, types for unions/utility types
- Use `any` sparingly; `@typescript-eslint/no-explicit-any` is **off** so it's allowed

### Svelte 5 (Runes API)

- **Reactive state:** `let x = $state(value)` — replaces Svelte 4 `let`
- **Computed values:** `let x = $derived(expr)` or `$derived.by(() => { ... })` — replaces `$:`
- **Side effects:** `$effect(() => { ... })` — replaces `$:` reactive blocks
- **Props:** `let { prop1, prop2 } = $props<{ prop1: string; prop2?: number }>()`
- **Two-way binding:** `let value = $bindable()` for parent `bind:value`
- **Slots:** `{@render children()}` with `{#snippet name()}...{/snippet}`
- **Event handlers:** `onclick={handler}` (not `on:click`)
- **Component script tag:** always `<script lang="ts">`
- **Generic components:** `<script lang="ts" generics="T extends ...">`

### REST API Endpoints (+server.ts)

Each file exports named functions: `GET`, `POST`, `PATCH`, `DELETE`.

Pattern for mutation handlers:

1. Read `locals.user?.userId`, return `401` if missing
2. Parse `request.json()`
3. Validate inputs (return `400` with `{ error: message }`)
4. Optionally fetch existing record (for history)
5. Perform DB operation via Drizzle
6. Call `recordHistory()` with `{ userId, action, tableName, rowId, changes, description }`
7. Return `json(result, { status: 201 })` for creates, `json(result)` for updates

### Error Handling

- **API endpoints:** Wrap logic in `try/catch`, return `json({ error: message }, { status })`
  - Status codes: `400` (bad request), `401` (unauthorized), `404` (not found), `409` (conflict/duplicate), `500` (server error)
- **DB errors:** Use `getDbErrorMessage(error)` from `$lib/db/errors` which maps PostgreSQL codes:
  - `23505` — unique constraint violation (Portuguese messages per constraint name)
  - `23503` — foreign key violation
  - Returns `null` for unmapped errors, fall back to a generic message
- **Auth:** `verifyToken()` returns `null` on failure instead of throwing
- **Client-side:** API calls use try/catch, errors surfaced as `feedback` state with `{ message, type: 'success' | 'error' }`
- **History recording:** Failures caught and logged via `console.error` (non-blocking `.catch()`)

### Database (Drizzle ORM)

- Schema defined in `src/lib/db/schema.ts` using `pgTable()`
- Column names in code use `camelCase`, SQL names use `snake_case` (first arg to each column)
- Always call `.notNull()` on required columns
- Primary keys: `serial('id').primaryKey()`
- Foreign keys: `.references(() => otherTable.id)`
- Unique constraints: `unique('constraint_name').on(t.col1, t.col2)` for multi-column
- Query builder patterns: `db.select().from(table).where(eq(table.col, value))`
- Client initialized in `src/lib/db/index.ts`: `drizzle(postgres(env.DATABASE_URL!), { schema })`

### Client-side API (`src/lib/api.ts`)

- In-memory cache (`Map<string, Promise<any>>`) for GET requests
- Auto-invalidates cache on non-GET mutations
- Handles 401 by clearing token and reloading
- Auth token from `localStorage` for client-side, cookies for SSR
- Usage: `api.buildings.get()`, `api.transactions.post(data)`, `api.clients.patch(id, data)`, etc.

### Styles

- Scoped `<style>` blocks in each Svelte component
- CSS custom properties for consistent theming (`--bg-color-*`, `--border-color-*`, `--text-color-*`)
- Dark theme via `src/app.css`
- Use existing variables rather than hardcoding colors

### Git / Commit

- No conventional commits standard — use descriptive Portuguese or English messages
- `.env` is gitignored — copy `.env.example` to `.env`
