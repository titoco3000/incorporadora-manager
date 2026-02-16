// src/routes/table/[table]/+page.server.ts
import { db } from '$lib/db';
import { tableRegistry, type TableKey } from '$lib/table-config';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const config = tableRegistry[params.table as TableKey];
	if (!config) throw error(404, 'Table not found');

	const rows = await db.select().from(config.model);

	return {
		rows,
		label: config.label,
		tableSlug: params.table
	};
};
