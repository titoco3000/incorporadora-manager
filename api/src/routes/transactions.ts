import { Hono } from 'hono';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db, write } from '../db/index.ts';
import { company, transaction, transactionType } from '../db/schema.ts';
import { getDbErrorMessage } from '../db/errors.ts';
import { recordHistory } from '../history.ts';
import type { Env } from '../env.ts';

const app = new Hono<Env>();

app.get('/', async (c) => {
	try {
		const q = (k: string) => c.req.query(k);
		const conditions = [];
		if (q('companyId')) conditions.push(eq(transaction.companyId, parseInt(q('companyId')!)));
		if (q('buildingId')) conditions.push(eq(transaction.buildingId, parseInt(q('buildingId')!)));
		if (q('transactionTypeId')) {
			conditions.push(eq(transaction.transactionTypeId, parseInt(q('transactionTypeId')!)));
		}
		if (q('startDate')) conditions.push(gte(transaction.date, q('startDate')!));
		if (q('endDate')) conditions.push(lte(transaction.date, q('endDate')!));

		const rows =
			conditions.length > 0
				? await db
						.select()
						.from(transaction)
						.where(and(...conditions))
				: await db.select().from(transaction);
		return c.json(rows);
	} catch {
		return c.json({ error: 'Failed to fetch transactions' }, 500);
	}
});

app.post('/', async (c) => {
	const userId = c.get('user')!.userId;
	try {
		const body = await c.req.json();
		const created = await write(async (tx) => {
			const [row] = await tx.insert(transaction).values(body).returning();

			// Remember the last transaction type used with this company.
			await tx
				.update(company)
				.set({ transactionTypeId: body.transactionTypeId })
				.where(eq(company.id, body.companyId));

			const [type] = await tx
				.select()
				.from(transactionType)
				.where(eq(transactionType.id, row.transactionTypeId));
			const isExpense = type?.isExpense ?? true;
			const formattedValue = new Intl.NumberFormat('pt-BR', {
				style: 'currency',
				currency: 'BRL'
			}).format(parseFloat(row.value));

			await recordHistory(tx, {
				userId,
				action: 'CREATE',
				tableName: 'transaction',
				rowId: row.id,
				changes: { after: row },
				description: `${isExpense ? 'Despesa' : 'Receita'} de ${formattedValue} adicionada`
			});
			return row;
		});
		return c.json(created, 201);
	} catch (error) {
		const msg = getDbErrorMessage(error);
		if (msg) return c.json({ error: msg }, 409);
		console.error(error);
		return c.json({ error: 'Failed to create transaction' }, 500);
	}
});

app.patch('/', async (c) => {
	const userId = c.get('user')!.userId;
	try {
		const { id, ...data } = await c.req.json();
		if (!id) return c.json({ error: 'ID is required' }, 400);

		const updated = await write(async (tx) => {
			const [old] = await tx.select().from(transaction).where(eq(transaction.id, id));
			if (!old) return null;
			const [row] = await tx
				.update(transaction)
				.set(data)
				.where(eq(transaction.id, id))
				.returning();

			if (data.transactionTypeId) {
				const companyId = data.companyId ?? row.companyId;
				const [supplier] = await tx.select().from(company).where(eq(company.id, companyId));
				if (supplier?.isSupplier) {
					await tx
						.update(company)
						.set({ transactionTypeId: data.transactionTypeId })
						.where(eq(company.id, companyId));
				}
			}

			await recordHistory(tx, {
				userId,
				action: 'UPDATE',
				tableName: 'transaction',
				rowId: id,
				changes: { before: old, after: row },
				description: `Transação #${id} atualizada`
			});
			return row;
		});
		if (!updated) return c.json({ error: 'Transaction not found' }, 404);
		return c.json(updated);
	} catch (error) {
		const msg = getDbErrorMessage(error);
		if (msg) return c.json({ error: msg }, 409);
		console.error(error);
		return c.json({ error: 'Failed to update transaction' }, 500);
	}
});

app.delete('/', async (c) => {
	const userId = c.get('user')!.userId;
	try {
		const { id } = await c.req.json();
		if (!id) return c.json({ error: 'ID is required' }, 400);

		const deleted = await write(async (tx) => {
			const [old] = await tx.delete(transaction).where(eq(transaction.id, id)).returning();
			if (!old) return null;
			await recordHistory(tx, {
				userId,
				action: 'DELETE',
				tableName: 'transaction',
				rowId: id,
				changes: { before: old },
				description: `Transação #${id} removida`
			});
			return old;
		});
		if (!deleted) return c.json({ error: 'Transaction not found' }, 404);
		return c.json({ success: true });
	} catch (error) {
		console.error(error);
		return c.json({ error: 'Failed to delete transaction' }, 500);
	}
});

export default app;
