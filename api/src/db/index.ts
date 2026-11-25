// Database connection. Locally: plain DATABASE_URL (Postgres in docker). In AWS: Aurora DSQL
// with a short-lived IAM token as the password (DSQL_ENDPOINT set, no DATABASE_URL).
import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

export type Sql = postgres.Sql;

export function isDsql(): boolean {
	return !process.env.DATABASE_URL && !!process.env.DSQL_ENDPOINT;
}

export function createSql(
	options: postgres.Options<Record<string, postgres.PostgresType>> = {}
): Sql {
	const url = process.env.DATABASE_URL;
	if (url) return postgres(url, { max: 5, ...options });

	const hostname = process.env.DSQL_ENDPOINT;
	if (!hostname) throw new Error('Set DATABASE_URL (local) or DSQL_ENDPOINT (AWS)');
	return createDsqlSql(hostname, options);
}

// Aurora DSQL cluster by endpoint (<id>.dsql.<region>.on.aws). Scripts use this directly to
// talk to two clusters at once (e.g. copy prod → dev).
export function createDsqlSql(
	hostname: string,
	options: postgres.Options<Record<string, postgres.PostgresType>> = {}
): Sql {
	const region = hostname.split('.')[2] ?? process.env.AWS_REGION;
	const signer = new DsqlSigner({ hostname, region });
	return postgres({
		host: hostname,
		port: 5432,
		database: 'postgres',
		username: 'admin',
		// Called for every new connection; tokens last 15 minutes, connections up to 1 hour.
		password: () => signer.getDbConnectAdminAuthToken(),
		ssl: 'require',
		max: 2,
		idle_timeout: 60,
		...options
	});
}

export const sql = createSql();
export const db = drizzle(sql, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const RETRY_CODES = new Set(['40001', 'OC000', 'OC001']);

function errorCode(err: unknown): string | undefined {
	const e = err as { code?: string; cause?: { code?: string } } | undefined;
	return e?.code ?? e?.cause?.code;
}

// DSQL uses optimistic concurrency: a conflicting commit fails with 40001 / OC000 and the
// whole transaction must run again. `fn` may run several times, so keep side effects inside it
// to database calls.
export async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await fn();
		} catch (err) {
			if (attempt >= attempts || !RETRY_CODES.has(errorCode(err) ?? '')) throw err;
			await new Promise((r) => setTimeout(r, 2 ** attempt * 25 + Math.random() * 50));
		}
	}
}

// A write transaction with retry. Use for every request that modifies data.
export function write<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
	return withRetry(() => db.transaction(fn));
}
