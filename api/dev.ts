// Local API server for `make run`: serves the Hono app with Bun.serve against the local
// Postgres in docker. Vite proxies /api to this port. Bun loads .env itself.
const PORT = 8787;

// Env must be final before the app is imported: the DB client is created at import time
// (the ceumusic bug). Refuse anything but a local database, so a stale .env can never point
// the dev server at production.
process.env.DATABASE_URL ??= 'postgres://postgres:postgres@localhost:5433/incorporadora';
const host = new URL(process.env.DATABASE_URL).hostname;
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
	console.error(`[api] DATABASE_URL must point to localhost, not ${host}. Fix .env.`);
	process.exit(1);
}
process.env.JWT_SECRET ??= 'local-dev-secret';

const { app } = await import('./src/app.ts');

Bun.serve({ port: PORT, fetch: app.fetch });
console.log(`[api] http://localhost:${PORT}`);

export {};
