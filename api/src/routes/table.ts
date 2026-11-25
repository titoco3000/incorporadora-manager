// /api/table/:table — rows for the table pages (GET, was table/[table]/+page.server.ts) and
// inline edits from DataTable (POST/PATCH/DELETE, was api/table/[table]/+server.ts).
// Note the two use different slugs, as before.
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, write } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { getDbErrorMessage } from '../db/errors.ts';
import { recordHistory } from '../history.ts';
import type { Env } from '../env.ts';

const app = new Hono<Env>();

const pageTables: Record<string, any> = {
	'transaction-type': schema.transactionType,
	building: schema.building,
	company: schema.company,
	contract: schema.contract,
	contact: schema.contact,
	transaction: schema.transaction,
	supplier: schema.company,
	client: schema.company
};

const editTables: Record<string, [any, string]> = {
	'transaction-types': [schema.transactionType, 'transaction_type'],
	buildings: [schema.building, 'building'],
	companies: [schema.company, 'company'],
	contracts: [schema.contract, 'contract'],
	contacts: [schema.contact, 'contact'],
	transactions: [schema.transaction, 'transaction']
};

app.get('/:table', async (c) => {
	const slug = c.req.param('table');
	const table = pageTables[slug];
	if (!table) return c.json({ error: 'Table not found' }, 404);

	let rows;
	if (slug === 'supplier') {
		rows = await db.select().from(schema.company).where(eq(schema.company.isSupplier, true));
	} else if (slug === 'client') {
		rows = await db.select().from(schema.company).where(eq(schema.company.isClient, true));
	} else {
		rows = await db.select().from(table);
	}
	return c.json({ rows, tableSlug: slug });
});

app.patch('/:table', async (c) => {
	const userId = c.get('user')!.userId;
	const slug = c.req.param('table');
	try {
		const { id, ...updates } = await c.req.json();
		const entry = editTables[slug];
		if (!entry) return c.json({ error: 'Table not found' }, 404);
		const [table, tableName] = entry;

		const found = await write(async (tx) => {
			const [old] = await tx.select().from(table).where(eq(table.id, id));
			if (!old) return false;
			const [updated] = await tx.update(table).set(updates).where(eq(table.id, id)).returning();
			await recordHistory(tx, {
				userId,
				action: 'UPDATE',
				tableName,
				rowId: id,
				changes: { before: old, after: updated },
				description: `Registro #${id} em ${slug} atualizado`
			});
			return true;
		});
		if (!found) return c.json({ error: 'Record not found' }, 404);
		return c.json({ success: true });
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return c.json({ success: false, error: msg }, 409);
	}
});

app.delete('/:table', async (c) => {
	const userId = c.get('user')!.userId;
	const slug = c.req.param('table');
	try {
		const { id } = await c.req.json();
		const entry = editTables[slug];
		if (!entry) return c.json({ error: 'Table not found' }, 404);
		const [table, tableName] = entry;

		const found = await write(async (tx) => {
			const [old] = await tx.delete(table).where(eq(table.id, id)).returning();
			if (!old) return false;
			await recordHistory(tx, {
				userId,
				action: 'DELETE',
				tableName,
				rowId: id,
				changes: { before: old },
				description: `Registro #${id} em ${slug} removido`
			});
			return true;
		});
		if (!found) return c.json({ error: 'Record not found' }, 404);
		return c.json({ success: true });
	} catch (err) {
		return c.json({ success: false, error: (err as Error).message }, 500);
	}
});

app.post('/:table', async (c) => {
	const userId = c.get('user')!.userId;
	const slug = c.req.param('table');
	try {
		const values = await c.req.json();
		const entry = editTables[slug];
		if (!entry) return c.json({ error: 'Table not found' }, 404);
		const [table, tableName] = entry;

		const created = await write(async (tx) => {
			const [row] = await tx.insert(table).values(values).returning();
			await recordHistory(tx, {
				userId,
				action: 'CREATE',
				tableName,
				rowId: row.id,
				changes: { after: row },
				description: `Registro #${row.id} em ${slug} criado`
			});
			return row;
		});
		return c.json({ success: true, data: created });
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return c.json({ success: false, error: msg }, 409);
	}
});

export default app;
