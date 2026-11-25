// Picks the database for a script: `local` (DATABASE_URL, must be localhost) or `aws`
// (Aurora DSQL via DSQL_ENDPOINT + IAM, AWS_PROFILE). Guards against a stale .env sending
// writes to the wrong place: Railway is only ever read, through RAILWAY_DATABASE_URL.
import postgres from 'postgres';

export type Target = 'local' | 'aws';

export function parseTarget(arg: string | undefined): Target {
	if (arg === 'local' || arg === 'aws') return arg;
	console.error('usage: bun scripts/<script>.ts local|aws');
	process.exit(2);
}

export async function connect(target: Target) {
	if (target === 'local') {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');
		const host = new URL(url).hostname;
		if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
			throw new Error(`target local: DATABASE_URL points to ${host}, not localhost. Fix .env.`);
		}
	} else {
		if (!process.env.DSQL_ENDPOINT) throw new Error('target aws: DSQL_ENDPOINT is not set');
		delete process.env.DATABASE_URL; // createSql() then uses DSQL + IAM
	}
	const { createSql, isDsql } = await import('../api/src/db/index.ts');
	return { sql: createSql({ max: 1, onnotice: () => {} }), dsql: isDsql() };
}

// Connects and runs `select 1`, failing after 15 s: when the address is wrong or public
// access is off, Railway accepts and then drops connections and postgres-js retries forever.
export async function railway() {
	const url = process.env.RAILWAY_DATABASE_URL;
	if (!url) throw new Error('RAILWAY_DATABASE_URL is not set (see .env.example)');
	const host = new URL(url).host;
	console.log(`railway: ${host}`);
	const sql = postgres(url, { max: 1, connect_timeout: 10, onnotice: () => {} });
	const timeout = new Promise((_, reject) =>
		setTimeout(
			() =>
				reject(
					new Error(
						`cannot reach Railway at ${host}. Is \`make railway-tunnel\` running? ` +
							'An exported RAILWAY_DATABASE_URL in your shell overrides .env (unset it).'
					)
				),
			15_000
		)
	);
	await Promise.race([sql`SELECT 1`, timeout]);
	return sql;
}
