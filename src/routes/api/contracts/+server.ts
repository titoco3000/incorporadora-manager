// src/routes/api/contracts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { contract } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const contracts = await db.select().from(contract);
		return json(contracts);
	} catch (error) {
		return json({ error: 'Failed to fetch contracts' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		function validateDates(past: string, future: string): string {
			const [dayPast, monthPast, yearPast] = past.split('/').map(Number);
			const pastDate = new Date(yearPast, monthPast - 1, dayPast);

			const [dayFuture, monthFuture, yearFuture] = future.split('/').map(Number);
			const futureDate = new Date(yearFuture, monthFuture - 1, dayFuture);
			const today = new Date();

			if (pastDate > today) {
				return 'Data de início é posterior a data atual!';
			} else if (pastDate > futureDate) {
				return 'Data de de início é posterior a data de vencimento';
			} else return '';
		}

		function ParseDateBR(value: string): string {
			const [day, month, year] = value.split('/').map(Number);
			const date = new Date(year, month - 1, day);

			if (date.toString() === 'Invalid Date') throw new Error('invalid date');

			return date.toISOString().slice(0, 10).toString();
		}

		const body = await request.json();
		//Validate expiration and start dates
		const dateErrorMessage = validateDates(body.startDate, body.expirationDate);
		if (dateErrorMessage) throw new Error(dateErrorMessage);

		// Make convertions
		const startDate = ParseDateBR(body.startDate);
		const expirationDate = ParseDateBR(body.expirationDate);
		const payload = {
			buildingId: Number(body.buildingId),
			companyId: Number(body.companyId),
			expirationDate,
			startDate,
			obs: body.obs ?? null,
			startValue: body.startValue.toString()
		};
		const [newContract] = await db.insert(contract).values(payload).returning();
		return json(newContract, { status: 201 });
	} catch (error) {
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 400 });
		}
		return json({ error: 'Failed to create contract' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		function validateStartDate(past: string, future: string | null): string {
			if (future === null) return '';
			const [dayPast, monthPast, yearPast] = past.split('/').map(Number);
			const pastDate = new Date(yearPast, monthPast - 1, dayPast);

			const [yearFuture, monthFuture, dayFuture] = future.split('-').map(Number);
			const futureDate = new Date(yearFuture, monthFuture - 1, dayFuture);
			const today = new Date();

			if (pastDate > today) {
				return 'Data de início é posterior a data atual!';
			} else if (pastDate > futureDate) {
				return 'Data de de início é posterior a data de vencimento';
			} else return '';
		}
		function validateExpirationDate(past: string | null, future: string): string {
			if (past === null) return '';
			const [yearPast, monthPast, dayPast] = past.split('-').map(Number);
			const pastDate = new Date(yearPast, monthPast - 1, dayPast);

			const [dayFuture, monthFuture, yearFuture] = future.split('/').map(Number);
			const futureDate = new Date(yearFuture, monthFuture - 1, dayFuture);
			const today = new Date();

			if (pastDate > today) {
				return 'Data de início é posterior a data atual!';
			} else if (pastDate > futureDate) {
				return 'Data de de início é posterior a data de vencimento';
			} else return '';
		}

		function ParseDateBR(value: string): string {
			const [day, month, year] = value.split('/').map(Number);
			const date = new Date(year, month - 1, day);

			if (date.toString() === 'Invalid Date') throw new Error('invalid date');

			return date.toISOString().slice(0, 10).toString();
		}

		const body = await request.json();
		const { id, ...data } = body;
		let payload = {};

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}
		// Get current data in the row
		const [current] = await db
			.select({
				startDate: contract.startDate,
				expirationDate: contract.expirationDate
			})
			.from(contract)
			.where(eq(contract.id, id));

		//Validate expiration and start dates
		if (Object.keys(body).includes('startDate')) {
			const dateErrorMessage = validateStartDate(body.startDate, current.expirationDate);
			if (dateErrorMessage) throw new Error(dateErrorMessage);
			const startDate = ParseDateBR(body.startDate);
			payload = {
				...data,
				startDate
			};
		} else if (Object.keys(body).includes('expirationDate')) {
			const dateErrorMessage = validateExpirationDate(current.startDate, body.expirationDate);
			if (dateErrorMessage) throw new Error(dateErrorMessage);
			const expirationDate = ParseDateBR(body.expirationDate);
			payload = {
				...data,
				expirationDate
			};
		} else payload = { ...data };

		const [updated] = await db.update(contract).set(payload).where(eq(contract.id, id)).returning();

		if (!updated) {
			return json({ error: 'Contract not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 400 });
		}
		return json({ error: 'Failed to update contract' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [deleted] = await db.delete(contract).where(eq(contract.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Contract not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		return json({ error: 'Failed to delete contract' }, { status: 500 });
	}
};
