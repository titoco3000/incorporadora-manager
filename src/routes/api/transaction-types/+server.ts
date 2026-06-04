import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { transactionType } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { recordHistory } from '$lib/history';

export const GET: RequestHandler = async () => {
	try {
		const types = await db.select().from(transactionType);
		return json(types);
	} catch (error) {
		return json({ error: 'Failed to fetch transaction types' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();
		const [newType] = await db.insert(transactionType).values(body).returning();

		await recordHistory({
			userId,
			action: 'CREATE',
			tableName: 'transaction_type',
			rowId: newType.id,
			changes: { after: newType },
			description: `Tipo de transação '${newType.name}' criado`
		});

		return json(newType, { status: 201 });
	} catch (error) {
		return json({ error: 'Failed to create transaction type' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();
		const { id, ...data } = body;

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [oldType] = await db.select().from(transactionType).where(eq(transactionType.id, id));
		if (!oldType) {
			return json({ error: 'Transaction type not found' }, { status: 404 });
		}

		const [updated] = await db
			.update(transactionType)
			.set(data)
			.where(eq(transactionType.id, id))
			.returning();

		if (!updated) {
			return json({ error: 'Transaction type not found' }, { status: 404 });
		}

		await recordHistory({
			userId,
			action: 'UPDATE',
			tableName: 'transaction_type',
			rowId: id,
			changes: { before: oldType, after: updated },
			description: `Tipo de transação '${updated.name}' atualizado`
		});

		return json(updated);
	} catch (error) {
		return json({ error: 'Failed to update transaction type' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [oldType] = await db.select().from(transactionType).where(eq(transactionType.id, id));
		if (!oldType) {
			return json({ error: 'Transaction type not found' }, { status: 404 });
		}

		const [deleted] = await db
			.delete(transactionType)
			.where(eq(transactionType.id, id))
			.returning();

		if (!deleted) {
			return json({ error: 'Transaction type not found' }, { status: 404 });
		}

		await recordHistory({
			userId,
			action: 'DELETE',
			tableName: 'transaction_type',
			rowId: id,
			changes: { before: oldType },
			description: `Tipo de transação '${oldType.name}' removido`
		});

		return json({ success: true });
	} catch (error) {
		return json({ error: 'Failed to delete transaction type' }, { status: 500 });
	}
};
