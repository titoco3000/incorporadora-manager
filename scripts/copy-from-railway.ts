// Copies the Railway production database into the local database or Aurora DSQL, then checks
// the copy and exits non-zero on any difference.
//   bun scripts/copy-from-railway.ts local|aws            wipe target, copy, check
//   bun scripts/copy-from-railway.ts local|aws --check    only compare (nothing is written)
// Railway is only read, inside one REPEATABLE READ READ ONLY transaction, so the copy and the
// Railway side of the checks come from the same snapshot. The target must already be migrated.
import { connect, parseTarget, railway } from './target.ts';

// FK order: every table comes after the tables it references.
const TABLES = [
	'transaction_type',
	'building',
	'company',
	'user',
	'whitelist_entry',
	'contract',
	'contact',
	'transaction',
	'history_entry'
];
const BATCH = 500; // rows per insert transaction (DSQL limit: 3,000 modified rows)
const IGNORED_SOURCE_TABLES = new Set(['_migrations', '__drizzle_migrations']);

const target = parseTarget(process.argv[2]);
const checkOnly = process.argv.includes('--check');

const src = await railway();
const { sql: dst } = await connect(target);
const { withRetry } = await import('../api/src/db/index.ts');

type Column = { name: string; type: string };
type Checks = Record<string, string>;

const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function columnsOf(sql: any, table: string): Promise<Column[]> {
	const rows = await sql`
		SELECT column_name AS name, udt_name AS type
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = ${table}
		ORDER BY ordinal_position`;
	return rows.map((r: any) => ({ name: r.name, type: r.type }));
}

// Same queries on both sides; the results must be identical strings.
async function checks(sql: any, columns: Record<string, Column[]>): Promise<Checks> {
	const out: Checks = {};
	for (const table of TABLES) {
		const [{ n }] = await sql.unsafe(`SELECT count(*)::text AS n FROM ${q(table)}`);
		out[`${table}: rows`] = n;
		const cols = columns[table].map((c) => `${q(c.name)}::text`).join(', ');
		const [{ h }] = await sql.unsafe(
			`SELECT md5(coalesce(string_agg(row(${cols})::text, E'\\n' ORDER BY id), '')) AS h FROM ${q(table)}`
		);
		out[`${table}: md5`] = h;
	}
	const perType = await sql`
		SELECT transaction_type_id::text AS t, sum(value)::text AS s
		FROM "transaction" GROUP BY transaction_type_id ORDER BY transaction_type_id`;
	for (const r of perType) out[`transaction: sum(value) type ${r.t}`] = r.s;
	const [{ s }] = await sql`SELECT coalesce(sum(start_value), 0)::text AS s FROM contract`;
	out['contract: sum(start_value)'] = s;
	return out;
}

try {
	console.log('connecting to railway and comparing schemas...');
	// 1. Schemas must match column for column, or the copy would silently drop data.
	const columns: Record<string, Column[]> = {};
	const problems: string[] = [];
	const sourceTables = (
		await src`SELECT table_name FROM information_schema.tables
			WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
	).map((r: any) => r.table_name as string);
	for (const t of sourceTables) {
		if (!TABLES.includes(t) && !IGNORED_SOURCE_TABLES.has(t)) {
			problems.push(`Railway has table "${t}", which this script does not copy`);
		}
	}
	for (const table of TABLES) {
		const [s, d] = [await columnsOf(src, table), await columnsOf(dst, table)];
		// Same names and types; order may differ (Railway got columns added later). All
		// queries use the target's column list by name, so order does not matter.
		const describe = (cols: Column[]) =>
			cols
				.map((c) => `${c.name}:${c.type}`)
				.sort()
				.join(', ');
		if (describe(s) !== describe(d)) {
			problems.push(`${table} differs\n    railway: ${describe(s)}\n    ${target}: ${describe(d)}`);
		}
		columns[table] = d;
	}
	if (problems.length) {
		console.error(`Schema mismatch, nothing copied:\n  ${problems.join('\n  ')}`);
		process.exit(1);
	}

	// 2. Read Railway (one consistent snapshot): rows as text, plus its side of the checks.
	console.log('reading railway...');
	const data: Record<string, Record<string, string | null>[]> = {};
	const sourceChecks: Checks = await src.begin(
		'ISOLATION LEVEL REPEATABLE READ READ ONLY',
		async (tx: any) => {
			for (const table of TABLES) {
				const cols = columns[table].map((c) => `${q(c.name)}::text AS ${q(c.name)}`).join(', ');
				data[table] = await tx.unsafe(`SELECT ${cols} FROM ${q(table)} ORDER BY id`);
			}
			return checks(tx, columns);
		}
	);

	if (!checkOnly) {
		// 3. Wipe the target, children first, in batches.
		for (const table of [...TABLES].reverse()) {
			let deleted = 0;
			for (;;) {
				const res = await withRetry(() =>
					dst.unsafe(
						`DELETE FROM ${q(table)} WHERE id IN (SELECT id FROM ${q(table)} ORDER BY id LIMIT 1000)`
					)
				);
				if (res.count === 0) break;
				deleted += res.count;
			}
			if (deleted) console.log(`wiped ${table}: ${deleted}`);
		}

		// 4. Copy, keeping ids, ≤ BATCH rows per transaction.
		for (const table of TABLES) {
			const cols = columns[table];
			const rows = data[table];
			const names = cols.map((c) => q(c.name)).join(', ');
			for (let i = 0; i < rows.length; i += BATCH) {
				const chunk = rows.slice(i, i + BATCH);
				const params: (string | null)[] = [];
				const tuples = chunk.map((row) => {
					const values = cols.map((c) => {
						params.push(row[c.name]);
						// ::text first, or postgres-js converts the string in JS by the column type
						// (bool "true" → false, timestamps shifted to local time, jsonb double-encoded).
						return `$${params.length}::text::${c.type}`;
					});
					return `(${values.join(', ')})`;
				});
				await withRetry(() =>
					dst.begin((tx: any) =>
						tx.unsafe(
							`INSERT INTO ${q(table)} (${names}) OVERRIDING SYSTEM VALUE VALUES ${tuples.join(', ')}`,
							params
						)
					)
				);
			}
			// 5. Move the identity counter past max(id).
			const [{ next }] = await dst.unsafe(
				`SELECT (coalesce(max(id), 0) + 1)::int AS next FROM ${q(table)}`
			);
			await dst.unsafe(`ALTER TABLE ${q(table)} ALTER COLUMN id RESTART WITH ${next}`);
			console.log(`copied ${table}: ${rows.length} (next id ${next})`);
		}
	}

	// 6. Compare.
	const targetChecks = await checks(dst, columns);
	const keys = [...new Set([...Object.keys(sourceChecks), ...Object.keys(targetChecks)])];
	const diffs = keys.filter((k) => sourceChecks[k] !== targetChecks[k]);
	for (const k of keys) {
		if (k.endsWith(': md5')) continue;
		console.log(
			`  ${sourceChecks[k] === targetChecks[k] ? 'ok  ' : 'DIFF'} ${k} = ${sourceChecks[k]}`
		);
	}
	if (diffs.length) {
		console.error(`\nCHECKS FAILED (${diffs.length}):`);
		for (const k of diffs) {
			console.error(`  ${k}: railway=${sourceChecks[k]} ${target}=${targetChecks[k]}`);
		}
		process.exitCode = 1;
	} else {
		console.log(`\nAll checks passed (${keys.length}, incl. md5 of every table).`);
	}
} finally {
	await src.end();
	await dst.end();
}
