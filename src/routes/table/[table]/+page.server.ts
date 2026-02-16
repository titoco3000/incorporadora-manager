// src/routes/table/[table]/+page.server.ts
import { db } from '$lib/db';
import { tableRegistry, type TableKey } from '$lib/table-config';
import { error } from '@sveltejs/kit';

// Infer the exact union of table models from the registry
type RegistryModel = (typeof tableRegistry)[TableKey]['model'];

const tableModels: Record<string, RegistryModel> = {
	companies: tableRegistry.companies.model,
	buildings: tableRegistry.buildings.model,
	'transaction-types': tableRegistry['transaction-types'].model,
	contracts: tableRegistry.contracts.model,
	contacts: tableRegistry.contacts.model,
	transactions: tableRegistry.transactions.model
};

export const load = async ({ params }) => {
	const config = tableRegistry[params.table as TableKey];
	if (!config) throw error(404, 'Table not found');

	const rows = await db.select().from(config.model);

	// Load reference data for foreign key dropdowns
	const referenceData: Record<string, Record<string, unknown>[]> = {};

	for (const col of config.columns) {
		if (col.type === 'select' && col.reference) {
			// Determine which table this references
			const refTableName = col.reference.foreignTable;
			const refModel = tableModels[refTableName];

			if (refModel) {
				const refRows = await db.select().from(refModel);
				referenceData[col.key] = refRows;
			}
		}
	}

	return {
		rows,
		columns: config.columns,
		label: config.label,
		tableSlug: params.table,
		referenceData
	};
};
