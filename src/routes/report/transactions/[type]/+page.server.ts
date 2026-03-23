// src/routes/report/transactions/[type]/+page.server.ts
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const routeType = params.type;

	const filtersPerPage: Record<string, string[]> = {
		a: ['building', 'company'],
		'expenses-per-building': ['building'],
		'expenses-per-supplier': ['supplier'],
		'expenses-per-type': ['transactionType']
	};

	const allowedFilters: string[] = filtersPerPage[routeType] || [];

	// Extract current filter values from URL and build Drizzle WHERE conditions
	const activeFilters: Record<string, string> = {};
	const conditions = [];

	if (allowedFilters.includes('building') && url.searchParams.has('building')) {
		const val = url.searchParams.get('building')!;
		activeFilters.building = val;
		conditions.push(eq(schema.transaction.buildingId, parseInt(val)));
	}

	if (allowedFilters.includes('transactionType') && url.searchParams.has('transactionType')) {
		const val = url.searchParams.get('transactionType')!;
		activeFilters.transactionType = val;
		conditions.push(eq(schema.transaction.transactionTypeId, parseInt(val)));
	}

	const companyAliases = ['company', 'supplier', 'client'];
	for (const alias of companyAliases) {
		if (allowedFilters.includes(alias) && url.searchParams.has(alias)) {
			const val = url.searchParams.get(alias)!;
			activeFilters[alias] = val; // Pass the active alias back to the frontend
			conditions.push(eq(schema.transaction.companyId, parseInt(val)));
		}
	}

	// Fetch the filtered rows
	const rows = await db
		.select()
		.from(schema.transaction)
		// If there are conditions, apply them using AND, otherwise pass undefined
		.where(conditions.length > 0 ? and(...conditions) : undefined);

	return {
		rows,
		allowedFilters,
		activeFilters
	};
};
