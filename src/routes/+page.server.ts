// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { transaction, transactionType, building } from '$lib/db/schema';
import { and, gte, lte, eq, sql } from 'drizzle-orm';

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
	} catch {
		return [];
	}
}

async function loadTransactionVolumesPerBuilding(startDate: string, endDate: string) {
	try {
		const barResultsRaw = await db
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

		// Transform raw bar data into the expected format
		const barMap = new Map<string, { label: string; value: number; negativeValue: number }>();

		barResultsRaw.forEach((row) => {
			const displayLabel = row.label || '';

			if (!barMap.has(displayLabel)) {
				barMap.set(displayLabel, { label: displayLabel, value: 0, negativeValue: 0 });
			}
			const entry = barMap.get(displayLabel)!;
			if (row.isExpense) {
				entry.negativeValue += row.total;
			} else {
				entry.value += row.total;
			}
		});
		return Array.from(barMap.values());
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ url }) => {
	// Obtain date from url
	const startParam = url.searchParams.get('start');
	const endParam = url.searchParams.get('end');

	const getIsoDate = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	// Calculate defaults
	const lastYear = new Date();
	lastYear.setFullYear(lastYear.getFullYear() - 1);

	// If it date isnt defined in the url, use defaults
	const startDate = startParam || getIsoDate(lastYear);
	const endDate = endParam || getIsoDate(new Date());

	return {
		pieData: await sumPerExpenseType(startDate, endDate),
		barData: await loadTransactionVolumesPerBuilding(startDate, endDate),
		startDate: startDate,
		endDate: endDate
	};
};
