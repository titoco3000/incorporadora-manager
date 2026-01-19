// src/routes/api/transactions/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { transaction, company } from '$lib/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import SupplierForm from '$lib/components/forms/forms/SupplierForm.svelte';

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
	} catch (error) {
		return json({ error: 'Failed to fetch transactions' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		function ParseDateBR(value: string): string {
			const [day, month, year] = value.split('/').map(Number);
			const date = new Date(year, month - 1, day);

			if (date.toString() === 'Invalid Date') throw new Error('invalid date');

			return date.toISOString().slice(0, 10).toString();
		}
		
		// Make convertions
		const date = ParseDateBR(body.date);
		const payload = {
			transactionTypeId: Number(body.transactionTypeId),
			value: body.value.toString(),
			companyId: Number(body.companyId),
			buildingId: Number(body.buildingId),
			document: body.document,
			obs: body.obs ?? null,
			date
		};

		// Create transaction
		const [newTransaction] = await db.insert(transaction).values(payload).returning();

		// Update company's transactionTypeId if it's a supplier
		const [supplierCompany] = await db
			.select()
			.from(company)
			.where(eq(company.id, payload.companyId));

		if (supplierCompany?.isSupplier) {
			await db
				.update(company)
				.set({ transactionTypeId: body.transactionTypeId })
				.where(eq(company.id, body.companyId));
		}

		return json(newTransaction, { status: 201 });
	} catch (error) {
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 400 });
		}
		return json({ error: 'Failed to create transaction', detais: String(error) }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		let body = await request.json();
		function ParseDateBR(value: string): string {
			const [day, month, year] = value.split('/').map(Number);
			const date = new Date(year, month - 1, day);

			if (date.toString() === 'Invalid Date') throw new Error('invalid date');

			return date.toISOString().slice(0, 10).toString();
		}

		if (body?.date) {
			body['date'] = ParseDateBR(body.date);
		}

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
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 400 });
		}
		return json({ error: 'Failed to update transaction', detais: String(error) }, { status: 500 });
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
	} catch (error) {
		return json({ error: 'Failed to delete transaction' }, { status: 500 });
	}
};
