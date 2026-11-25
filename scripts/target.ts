// Opens one of the databases the scripts work with:
//   railway  RAILWAY_DATABASE_URL (via `make railway-tunnel`), read only, never written
//   local    DATABASE_URL, must be localhost (Postgres in docker)
//   prod     Aurora DSQL, DSQL_ENDPOINT_PROD (Terraform workspace prod), IAM via AWS_PROFILE
//   dev      Aurora DSQL, DSQL_ENDPOINT_DEV  (Terraform workspace dev)
// The Makefile fills the DSQL_ENDPOINT_* variables from `terraform output`.
import postgres from 'postgres';

export const DATABASES = ['railway', 'local', 'prod', 'dev'] as const;
export type Database = (typeof DATABASES)[number];
export type Writable = Exclude<Database, 'railway'>;

export function parseDatabase(arg: string | undefined, usage: string): Database {
	if (DATABASES.includes(arg as Database)) return arg as Database;
	console.error(`usage: ${usage}`);
	process.exit(2);
}

export function isDsql(name: Database): boolean {
	return name === 'prod' || name === 'dev';
}

const OPTIONS = { max: 1, connect_timeout: 10, onnotice: () => {} };

async function describe(name: Database): Promise<{ sql: postgres.Sql; where: string }> {
	if (name === 'railway') {
		const url = process.env.RAILWAY_DATABASE_URL;
		if (!url) throw new Error('RAILWAY_DATABASE_URL is not set (see .env.example)');
		return { sql: postgres(url, OPTIONS), where: new URL(url).host };
	}
	if (name === 'local') {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');
		const host = new URL(url).hostname;
		if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
			throw new Error(`local: DATABASE_URL points to ${host}, not localhost. Fix .env.`);
		}
		return { sql: postgres(url, OPTIONS), where: new URL(url).host };
	}
	const variable = `DSQL_ENDPOINT_${name.toUpperCase()}`;
	const endpoint = process.env[variable];
	if (!endpoint) throw new Error(`${name}: ${variable} is not set (run through make)`);
	const { createDsqlSql } = await import('../api/src/db/index.ts');
	return { sql: createDsqlSql(endpoint, OPTIONS), where: endpoint };
}

// Connects and runs `select 1`, failing after 15 s instead of hanging: when Railway's address
// is wrong or the tunnel is down, it accepts and drops connections and postgres-js retries forever.
export async function open(name: Database): Promise<postgres.Sql> {
	const { sql, where } = await describe(name);
	console.log(`${name}: ${where}`);
	let timer: ReturnType<typeof setTimeout> | undefined;
	const hint =
		name === 'railway'
			? ' Is `make railway-tunnel` running? An exported RAILWAY_DATABASE_URL in your shell overrides .env (unset it).'
			: name === 'local'
				? ' Is the docker container up (make db-start)?'
				: ' Valid AWS credentials for the personal profile?';
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`cannot reach ${name} at ${where}.${hint}`)), 15_000);
	});
	try {
		await Promise.race([sql`SELECT 1`, timeout]);
	} catch (err) {
		await sql.end({ timeout: 1 });
		const message = (err as Error).message || (err as { code?: string }).code || String(err);
		throw new Error(message.startsWith('cannot reach') ? message : `${name}: ${message}.${hint}`);
	} finally {
		clearTimeout(timer);
	}
	return sql;
}
