// src/routes/report/transactions/[type]/+page.server.ts
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const routeType = params.type;

	const filtersPerPage = {
		a: ['buildingId', 'companyId'],
		'expenses-per-building': ['buildingId'],
		'expenses-per-supplier': ['companyId'],
		'expenses-per-type': ['transactionTypeId']
	};

	const allowedFilters: string[] = filtersPerPage[routeType] || [];

	// 2. Extract current filter values from URL and build Drizzle WHERE conditions
	const activeFilters: Record<string, string> = {};
	const conditions = [];

	if (allowedFilters.includes('buildingId') && url.searchParams.has('buildingId')) {
		const val = url.searchParams.get('buildingId')!;
		activeFilters.buildingId = val;
		conditions.push(eq(schema.transaction.buildingId, parseInt(val)));
	}

	if (allowedFilters.includes('companyId') && url.searchParams.has('companyId')) {
		const val = url.searchParams.get('companyId')!;
		activeFilters.companyId = val;
		conditions.push(eq(schema.transaction.companyId, parseInt(val)));
	}

	if (allowedFilters.includes('transactionTypeId') && url.searchParams.has('transactionTypeId')) {
		const val = url.searchParams.get('transactionTypeId')!;
		activeFilters.transactionTypeId = val;
		conditions.push(eq(schema.transaction.transactionTypeId, parseInt(val)));
	}

	// 3. Fetch the filtered rows
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
