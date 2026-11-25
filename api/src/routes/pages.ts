// Data for the dashboard and reports (were +page.server.ts loads querying the DB directly).
import { Hono } from 'hono';
import { and, eq, getTableColumns, gte, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { building, transaction, transactionType } from '../db/schema.ts';
import type { Env } from '../env.ts';

const app = new Hono<Env>();

async function sumPerExpenseType(startDate: string, endDate: string) {
	try {
		return await db
			.select({
				label: transactionType.name,
				value: sql<number>`sum(${transaction.value})::float`
			})
			.from(transaction)
			.innerJoin(transactionType, eq(transaction.transactionTypeId, transactionType.id))
			.where(
				and(
					gte(transaction.date, startDate),
					lte(transaction.date, endDate),
					eq(transactionType.isExpense, true)
				)
			)
			.groupBy(transactionType.name);
	} catch (error) {
		console.error(error);
		return [];
	}
}

async function transactionVolumesPerBuilding(startDate: string, endDate: string) {
	try {
		const raw = await db
			.select({
				label: building.name,
				isExpense: transactionType.isExpense,
				total: sql<number>`sum(${transaction.value})::float`
			})
			.from(transaction)
			.leftJoin(building, eq(transaction.buildingId, building.id))
			.innerJoin(transactionType, eq(transaction.transactionTypeId, transactionType.id))
			.where(and(gte(transaction.date, startDate), lte(transaction.date, endDate)))
			.groupBy(building.name, transactionType.isExpense);

		const volumes = new Map<string, { label: string; value: number; negativeValue: number }>();
		for (const row of raw) {
			const label = row.label || '';
			if (!volumes.has(label)) volumes.set(label, { label, value: 0, negativeValue: 0 });
			const entry = volumes.get(label)!;
			if (row.isExpense) entry.negativeValue += row.total;
			else entry.value += row.total;
		}
		return Array.from(volumes.values());
	} catch (error) {
		console.error(error);
		return [];
	}
}

app.get('/dashboard', async (c) => {
	const iso = (d: Date) => d.toISOString().split('T')[0];
	const lastYear = new Date();
	lastYear.setFullYear(lastYear.getFullYear() - 1);
	const startDate = c.req.query('start') || iso(lastYear);
	const endDate = c.req.query('end') || iso(new Date());

	const [pieData, volumes] = await Promise.all([
		sumPerExpenseType(startDate, endDate),
		transactionVolumesPerBuilding(startDate, endDate)
	]);
	return c.json({ pieData, transactionVolumesPerBuilding: volumes, startDate, endDate });
});

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

app.get('/report/transactions/:type', async (c) => {
	const config = routeConfigs[c.req.param('type')] ?? { filters: [] };
	const { filters: allowedFilters, isExpenseOnly, summaryVariant } = config;
	const query = (k: string) => c.req.query(k);

	const activeFilters: Record<string, string> = {};
	const conditions = [];

	if (allowedFilters.includes('building') && query('building') !== undefined) {
		const val = query('building')!;
		activeFilters.building = val;
		conditions.push(eq(schema.transaction.buildingId, parseInt(val)));
	}
	if (allowedFilters.includes('transactionType') && query('transactionType') !== undefined) {
		const val = query('transactionType')!;
		activeFilters.transactionType = val;
		conditions.push(eq(schema.transaction.transactionTypeId, parseInt(val)));
	}
	for (const alias of ['company', 'supplier', 'client']) {
		if (allowedFilters.includes(alias) && query(alias) !== undefined) {
			const val = query(alias)!;
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
		return c.json({ rows, allowedFilters, activeFilters, summaryVariant: 'totals' as const });
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
			.where(and(...conditions));
		return c.json({ rows, allowedFilters, activeFilters, summaryVariant: null });
	}

	const rows = await db
		.select()
		.from(schema.transaction)
		.where(conditions.length > 0 ? and(...conditions) : undefined);
	return c.json({ rows, allowedFilters, activeFilters, summaryVariant: null });
});

export default app;
