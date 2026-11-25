// Applies drizzle/*.sql (from `drizzle-kit generate`) to the local database or Aurora DSQL.
//   bun scripts/migrate.ts local|aws
// DSQL allows one DDL statement per transaction, so each statement runs (and is recorded in
// _migrations) on its own; a failed run can simply be re-run. On DSQL, CREATE INDEX becomes
// CREATE INDEX ASYNC and foreign keys added by ALTER TABLE get NOT VALID (tables are empty
// then; new rows are still checked).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect, parseTarget } from './target.ts';

const DIR = join(import.meta.dir, '..', 'drizzle');
const target = parseTarget(process.argv[2]);
const { sql, dsql } = await connect(target);

function forDsql(statement: string): string {
	let s = statement.replace(/^CREATE (UNIQUE )?INDEX (?!ASYNC)/i, 'CREATE $1INDEX ASYNC ');
	if (/^ALTER TABLE .* ADD CONSTRAINT .* FOREIGN KEY/is.test(s) && !/NOT VALID\s*$/i.test(s)) {
		s = `${s} NOT VALID`;
	}
	return s;
}

try {
	await sql`CREATE TABLE IF NOT EXISTS _migrations (
		name text PRIMARY KEY,
		applied_at timestamp DEFAULT now() NOT NULL
	)`;
	const done = new Set((await sql`SELECT name FROM _migrations`).map((r) => r.name as string));

	const files = readdirSync(DIR)
		.filter((f) => f.endsWith('.sql'))
		.sort();
	let applied = 0;
	for (const file of files) {
		const statements = readFileSync(join(DIR, file), 'utf8')
			.split('--> statement-breakpoint')
			.map((s) => s.trim().replace(/;$/, ''))
			.filter(Boolean);
		for (const [i, raw] of statements.entries()) {
			const name = `${file}#${i + 1}`;
			if (done.has(name)) continue;
			const statement = dsql ? forDsql(raw) : raw;
			await sql.begin(async (tx) => {
				await tx.unsafe(statement);
			});
			await sql`INSERT INTO _migrations (name) VALUES (${name})`;
			applied++;
			console.log(`applied ${name}`);
		}
	}
	console.log(`${target}: ${applied} statement(s) applied, ${done.size} already there`);
} finally {
	await sql.end();
}
