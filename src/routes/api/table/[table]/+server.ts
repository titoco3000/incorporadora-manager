import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/db/schema';
import { getDbErrorMessage } from '$lib/db/errors';
import { recordHistory } from '$lib/history';

const schemaMap = {
	'transaction-types': schema.transactionType,
	buildings: schema.building,
	companies: schema.company,
	contracts: schema.contract,
	contacts: schema.contact,
	transactions: schema.transaction
} as const;
type TableKey = keyof typeof schemaMap;

const tableNameMap: Record<string, string> = {
	'transaction-types': 'transaction_type',
	buildings: 'building',
	companies: 'company',
	contracts: 'contract',
	contacts: 'contact',
	transactions: 'transaction'
};

export const PATCH = async ({ params, request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();
		const { id, ...updates } = body;
		const config = schemaMap[params.table as TableKey];
		const tableName = tableNameMap[params.table];

		if (!config) return json({ error: 'Table not found' }, { status: 404 });

		const [oldRecord] = await db.select().from(config).where(eq(config.id, id));
		if (!oldRecord) return json({ error: 'Record not found' }, { status: 404 });

		const [updated] = await db.update(config).set(updates).where(eq(config.id, id)).returning();

		await recordHistory({
			userId,
			action: 'UPDATE',
			tableName,
			rowId: id,
			changes: { before: oldRecord, after: updated },
			description: `Registro #${id} em ${params.table} atualizado`
		});

		return json({ success: true });
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return json({ success: false, error: msg }, { status: 409 });
	}
};

export const DELETE = async ({ params, request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const { id } = await request.json();
		const config = schemaMap[params.table as TableKey];
		const tableName = tableNameMap[params.table];

		if (!config) return json({ error: 'Table not found' }, { status: 404 });

		const [oldRecord] = await db.select().from(config).where(eq(config.id, id));
		if (!oldRecord) return json({ error: 'Record not found' }, { status: 404 });

		await db.delete(config).where(eq(config.id, id));

		await recordHistory({
			userId,
			action: 'DELETE',
			tableName,
			rowId: id,
			changes: { before: oldRecord },
			description: `Registro #${id} em ${params.table} removido`
		});

		return json({ success: true });
	} catch (err) {
		return json({ success: false, error: (err as Error).message }, { status: 500 });
	}
};

export const POST = async ({ params, request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const values = await request.json();
		const config = schemaMap[params.table as TableKey];
		const tableName = tableNameMap[params.table];

		if (!config) return json({ error: 'Table not found' }, { status: 404 });

		const result = await db.insert(config).values(values).returning();

		await recordHistory({
			userId,
			action: 'CREATE',
			tableName,
			rowId: result[0].id,
			changes: { after: result[0] },
			description: `Registro #${result[0].id} em ${params.table} criado`
		});

		return json({ success: true, data: result[0] });
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return json({ success: false, error: msg }, { status: 409 });
	}
};
