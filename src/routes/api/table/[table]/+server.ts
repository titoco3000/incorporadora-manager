// src/routes/api/table/[table]/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/db/schema';

const schemaMap = {
	'transaction-types': schema.transactionType,
	buildings: schema.building,
	companies: schema.company,
	contracts: schema.contract,
	contacts: schema.contact,
	transactions: schema.transaction
} as const;
type TableKey = keyof typeof schemaMap;

export const PATCH = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { id, ...updates } = body;
		const config = schemaMap[params.table as TableKey];

		if (!config) return json({ error: 'Table not found' }, { status: 404 });

		await db.update(config).set(updates).where(eq(config.id, id));

		return json({ success: true });
	} catch (err) {
		return json({ success: false, error: (err as Error).message }, { status: 400 });
	}
};

export const DELETE = async ({ params, request }) => {
	try {
		const { id } = await request.json();
		const config = schemaMap[params.table as TableKey];

		if (!config) return json({ error: 'Table not found' }, { status: 404 });

		await db.delete(config).where(eq(config.id, id));

		return json({ success: true });
	} catch (err) {
		return json({ success: false, error: (err as Error).message }, { status: 500 });
	}
};

export const POST = async ({ params, request }) => {
	try {
		const values = await request.json();
		const config = schemaMap[params.table as TableKey];

		const result = await db.insert(config).values(values).returning();

		return json({ success: true, data: result[0] });
	} catch (err) {
		return json({ success: false, error: (err as Error).message }, { status: 400 });
	}
};
