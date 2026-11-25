// Generic GET/POST/PATCH/DELETE for one table, same paths and JSON as the old +server.ts files.
// Every write runs in one transaction together with its history entry.
import { Hono } from 'hono';
import { and, eq, type SQL } from 'drizzle-orm';
import { db, write } from '../db/index.ts';
import { recordHistory } from '../history.ts';
import type { Env } from '../env.ts';

type Row = Record<string, any>;

export function crud(opts: {
	table: any;
	tableName: string;
	noun: string; // for error messages: 'building' → 'Failed to create building', 'Building not found'
	describe: { create: (r: Row) => string; update: (r: Row) => string; delete: (r: Row) => string };
	filters?: (query: (key: string) => string | undefined) => SQL[];
}) {
	const { table, tableName, noun, describe } = opts;
	const Noun = noun[0].toUpperCase() + noun.slice(1);
	const plural = noun.endsWith('y') ? `${noun.slice(0, -1)}ies` : `${noun}s`;
	const app = new Hono<Env>();

	app.get('/', async (c) => {
		try {
			const conditions = opts.filters?.((k) => c.req.query(k)) ?? [];
			const rows =
				conditions.length > 0
					? await db
							.select()
							.from(table)
							.where(and(...conditions))
					: await db.select().from(table);
			return c.json(rows);
		} catch (error) {
			console.error(error);
			return c.json({ error: `Failed to fetch ${plural}` }, 500);
		}
	});

	app.post('/', async (c) => {
		const userId = c.get('user')!.userId;
		try {
			const body = await c.req.json();
			const created = await write(async (tx) => {
				const [row] = await tx.insert(table).values(body).returning();
				await recordHistory(tx, {
					userId,
					action: 'CREATE',
					tableName,
					rowId: row.id,
					changes: { after: row },
					description: describe.create(row)
				});
				return row;
			});
			return c.json(created, 201);
		} catch (error) {
			console.error(error);
			return c.json({ error: `Failed to create ${noun}` }, 500);
		}
	});

	app.patch('/', async (c) => {
		const userId = c.get('user')!.userId;
		try {
			const { id, ...data } = await c.req.json();
			if (!id) return c.json({ error: 'ID is required' }, 400);

			const updated = await write(async (tx) => {
				const [old] = await tx.select().from(table).where(eq(table.id, id));
				if (!old) return null;
				const [row] = await tx.update(table).set(data).where(eq(table.id, id)).returning();
				await recordHistory(tx, {
					userId,
					action: 'UPDATE',
					tableName,
					rowId: id,
					changes: { before: old, after: row },
					description: describe.update(row)
				});
				return row;
			});
			if (!updated) return c.json({ error: `${Noun} not found` }, 404);
			return c.json(updated);
		} catch (error) {
			console.error(error);
			return c.json({ error: `Failed to update ${noun}` }, 500);
		}
	});

	app.delete('/', async (c) => {
		const userId = c.get('user')!.userId;
		try {
			const { id } = await c.req.json();
			if (!id) return c.json({ error: 'ID is required' }, 400);

			const deleted = await write(async (tx) => {
				const [old] = await tx.delete(table).where(eq(table.id, id)).returning();
				if (!old) return null;
				await recordHistory(tx, {
					userId,
					action: 'DELETE',
					tableName,
					rowId: id,
					changes: { before: old },
					description: describe.delete(old)
				});
				return old;
			});
			if (!deleted) return c.json({ error: `${Noun} not found` }, 404);
			return c.json({ success: true });
		} catch (error) {
			console.error(error);
			return c.json({ error: `Failed to delete ${noun}` }, 500);
		}
	});

	return app;
}
