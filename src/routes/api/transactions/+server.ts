// src/routes/api/transactions/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { transaction, company } from '$lib/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import { getDbErrorMessage } from '$lib/db/errors';

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

export const POST: RequestHandler = async ({ request }) => {
	console.log('Creating a new transaction: ', request);

	try {
		const body = await request.json();

		// Create transaction
		const [newTransaction] = await db.insert(transaction).values(body).returning();

		// Update company's transactionTypeId if it's a supplier
		const [supplierCompany] = await db.select().from(company).where(eq(company.id, body.companyId));

		if (supplierCompany) {
			await db
				.update(company)
				.set({ transactionTypeId: body.transactionTypeId })
				.where(eq(company.id, body.companyId));
		}

		return json(newTransaction, { status: 201 });
	} catch (error) {
		console.log(error);
		const msg = getDbErrorMessage(error);

		if (msg) return json({ error: msg }, { status: 409 });
		return json({ error: 'Failed to create transaction' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, ...data } = body;

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		// Update transaction
		const [updated] = await db
			.update(transaction)
			.set(data)
			.where(eq(transaction.id, id))
			.returning();

		if (!updated) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		// Update company's transactionTypeId if transactionTypeId is being changed and company is a supplier
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
			// Use existing companyId from the updated transaction
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

		return json(updated);
	} catch (error) {
		const msg = getDbErrorMessage(error);
		if (msg) return json({ error: msg }, { status: 409 });
		return json({ error: 'Failed to update transaction' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [deleted] = await db.delete(transaction).where(eq(transaction.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch {
		return json({ error: 'Failed to delete transaction' }, { status: 500 });
	}
};
