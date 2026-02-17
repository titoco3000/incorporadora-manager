// src/routes/table/[table]/+page.server.ts
import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
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

export const load = async ({ params }) => {
	const config = schemaMap[params.table as TableKey];
	if (!config) throw error(404, 'Table not found');

	const rows = await db.select().from(config);

	return {
		rows,
		tableSlug: params.table
	};
};
