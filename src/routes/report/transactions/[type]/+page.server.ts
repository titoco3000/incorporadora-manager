import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

type RouteConfig = {
	filters: string[];
	isExpenseOnly?: boolean;
	summaryVariant?: 'single' | 'totals';
};

const routeConfigs: Record<string, RouteConfig> = {
	'expenses-per-building': { filters: ['building'], isExpenseOnly: true },
	'expenses-per-supplier': { filters: ['supplier'], isExpenseOnly: true },
	'expenses-per-type': { filters: ['transactionType'] },
	'totals-per-building': { filters: [], summaryVariant: 'totals' }
};

export const load: PageServerLoad = async ({ params, url }) => {
	const config = routeConfigs[params.type] ?? { filters: [] };
	const { filters: allowedFilters, isExpenseOnly, summaryVariant } = config;

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
			activeFilters[alias] = val;
			conditions.push(eq(schema.transaction.companyId, parseInt(val)));
		}
	}

	if (summaryVariant === 'totals') {
		const incomeExpenseSql = {
			income: sql<string>`COALESCE(SUM(CASE WHEN ${schema.transactionType.isExpense} = false THEN ${schema.transaction.value}::numeric ELSE 0 END), 0)`,
			expense: sql<string>`COALESCE(SUM(CASE WHEN ${schema.transactionType.isExpense} = true THEN ${schema.transaction.value}::numeric ELSE 0 END), 0)`
		};

		const buildingRows = await db
			.select({ id: schema.building.id, name: schema.building.name, ...incomeExpenseSql })
			.from(schema.building)
			.leftJoin(schema.transaction, eq(schema.building.id, schema.transaction.buildingId))
			.leftJoin(
				schema.transactionType,
				eq(schema.transaction.transactionTypeId, schema.transactionType.id)
			)
			.groupBy(schema.building.id, schema.building.name)
			.orderBy(schema.building.name);

		const [unassigned] = await db
			.select(incomeExpenseSql)
			.from(schema.transaction)
			.leftJoin(
				schema.transactionType,
				eq(schema.transaction.transactionTypeId, schema.transactionType.id)
			)
			.where(isNull(schema.transaction.buildingId));

		const rows = [...buildingRows, { id: -1, name: '-', ...unassigned }];

		return { rows, allowedFilters, activeFilters, summaryVariant: 'totals' as const };
	}

	if (isExpenseOnly) {
		conditions.push(eq(schema.transactionType.isExpense, true));

		const rows = await db
			.select(getTableColumns(schema.transaction))
			.from(schema.transaction)
			.innerJoin(
				schema.transactionType,
				eq(schema.transaction.transactionTypeId, schema.transactionType.id)
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		return { rows, allowedFilters, activeFilters, summaryVariant: null };
	}

	const rows = await db
		.select()
		.from(schema.transaction)
		.where(conditions.length > 0 ? and(...conditions) : undefined);

	return { rows, allowedFilters, activeFilters, summaryVariant: null };
};
