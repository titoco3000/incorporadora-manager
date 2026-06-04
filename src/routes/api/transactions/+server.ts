import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { transaction, company, transactionType } from '$lib/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import { getDbErrorMessage } from '$lib/db/errors';
import { recordHistory } from '$lib/history';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const companyId = url.searchParams.get('companyId');
		const buildingId = url.searchParams.get('buildingId');
		const transactionTypeId = url.searchParams.get('transactionTypeId');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		const conditions = [];

		if (companyId) {
			conditions.push(eq(transaction.companyId, parseInt(companyId)));
		}

		if (buildingId) {
			conditions.push(eq(transaction.buildingId, parseInt(buildingId)));
		}

		if (transactionTypeId) {
			conditions.push(eq(transaction.transactionTypeId, parseInt(transactionTypeId)));
		}

		if (startDate) {
			conditions.push(gte(transaction.date, startDate));
		}

		if (endDate) {
			conditions.push(lte(transaction.date, endDate));
		}

		const transactions =
			conditions.length > 0
				? await db
						.select()
						.from(transaction)
						.where(and(...conditions))
				: await db.select().from(transaction);

		return json(transactions);
	} catch {
		return json({ error: 'Failed to fetch transactions' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();

		const [newTransaction] = await db.insert(transaction).values(body).returning();

		const [supplierCompany] = await db.select().from(company).where(eq(company.id, body.companyId));

		if (supplierCompany) {
			await db
				.update(company)
				.set({ transactionTypeId: body.transactionTypeId })
				.where(eq(company.id, body.companyId));
		}

		const [type] = await db
			.select()
			.from(transactionType)
			.where(eq(transactionType.id, newTransaction.transactionTypeId));

		const isExpense = type?.isExpense ?? true;
		const formattedValue = new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(parseFloat(newTransaction.value));

		recordHistory({
			userId,
			action: 'CREATE',
			tableName: 'transaction',
			rowId: newTransaction.id,
			changes: { after: newTransaction },
			description: `${isExpense ? 'Despesa' : 'Receita'} de ${formattedValue} adicionada`
		}).catch((e) => console.error('Failed to record history:', e));

		return json(newTransaction, { status: 201 });
	} catch (error) {
		const msg = getDbErrorMessage(error);

		if (msg) return json({ error: msg }, { status: 409 });
		return json({ error: 'Failed to create transaction' }, { status: 500 });
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

		const [oldTransaction] = await db.select().from(transaction).where(eq(transaction.id, id));

		if (!oldTransaction) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		const [updated] = await db
			.update(transaction)
			.set(data)
			.where(eq(transaction.id, id))
			.returning();

		if (!updated) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		if (data.transactionTypeId && data.companyId) {
			const [supplierCompany] = await db
				.select()
				.from(company)
				.where(eq(company.id, data.companyId));

			if (supplierCompany?.isSupplier) {
				await db
					.update(company)
					.set({ transactionTypeId: data.transactionTypeId })
					.where(eq(company.id, data.companyId));
			}
		} else if (data.transactionTypeId) {
			const [supplierCompany] = await db
				.select()
				.from(company)
				.where(eq(company.id, updated.companyId));

			if (supplierCompany?.isSupplier) {
				await db
					.update(company)
					.set({ transactionTypeId: data.transactionTypeId })
					.where(eq(company.id, updated.companyId));
			}
		}

		recordHistory({
			userId,
			action: 'UPDATE',
			tableName: 'transaction',
			rowId: id,
			changes: { before: oldTransaction, after: updated },
			description: `Transação #${id} atualizada`
		}).catch((e) => console.error('Failed to record history:', e));

		return json(updated);
	} catch (error) {
		const msg = getDbErrorMessage(error);
		if (msg) return json({ error: msg }, { status: 409 });
		return json({ error: 'Failed to update transaction' }, { status: 500 });
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

		const [oldTransaction] = await db.select().from(transaction).where(eq(transaction.id, id));

		if (!oldTransaction) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		const [deleted] = await db.delete(transaction).where(eq(transaction.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		recordHistory({
			userId,
			action: 'DELETE',
			tableName: 'transaction',
			rowId: id,
			changes: { before: oldTransaction },
			description: `Transação #${id} removida`
		}).catch((e) => console.error('Failed to record history:', e));

		return json({ success: true });
	} catch {
		return json({ error: 'Failed to delete transaction' }, { status: 500 });
	}
};
