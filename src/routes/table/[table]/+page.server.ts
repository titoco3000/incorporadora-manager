// src/routes/table/[table]/+page.server.ts
import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import * as schema from '$lib/db/schema';
import { eq, or, isNotNull } from 'drizzle-orm';

const schemaMap = {
	'transaction-types': schema.transactionType,
	buildings: schema.building,
	companies: schema.company,
	contracts: schema.contract,
	contacts: schema.contact,
	transactions: schema.transaction,
	suppliers: schema.company,
	clients: schema.company
} as const;

type TableKey = keyof typeof schemaMap;

export const load = async ({ params }) => {
	const tableParam = params.table as TableKey;
	const config = schemaMap[tableParam];

	if (!config) throw error(404, 'Table not found');

	let rows;

	if (tableParam === 'suppliers') {
		rows = await db.select().from(schema.company).where(eq(schema.company.isSupplier, true));
	} else if (tableParam === 'clients') {
		rows = await db
			.select()
			.from(schema.company)
			.where(or(eq(schema.company.isSupplier, false), isNotNull(schema.company.transactionTypeId)));
	} else {
		rows = await db.select().from(config);
	}

	return {
		rows,
		tableSlug: params.table
	};
};
