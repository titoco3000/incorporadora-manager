import type { AuthUser } from './auth.ts';

// Hono context variables set by the auth middleware (replaces SvelteKit `locals`).
export type Env = { Variables: { user: AuthUser | null } };
