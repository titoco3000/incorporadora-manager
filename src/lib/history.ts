import { db } from '$lib/db';
import { historyEntry } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/db/schema';

const schemaMap: Record<string, any> = {
	transaction_type: schema.transactionType,
	building: schema.building,
	company: schema.company,
	contract: schema.contract,
	contact: schema.contact,
	transaction: schema.transaction,
	user: schema.user,
	whitelist_entry: schema.whitelistEntry
};

export async function recordHistory(params: {
	userId: number;
	action: 'CREATE' | 'UPDATE' | 'DELETE';
	tableName: string;
	rowId: number;
	changes: Record<string, any>;
	description: string;
}) {
	try {
		const [entry] = await db
			.insert(historyEntry)
			.values({
				userId: params.userId,
				action: params.action,
				tableName: params.tableName,
				rowId: params.rowId,
				changes: params.changes,
				description: params.description
			})
			.returning();
		return entry;
	} catch (e) {
		console.error('Failed to record history:', e);
	}
}

export async function undoEntry(entryId: number, userId: number) {
	const [entry] = await db.select().from(historyEntry).where(eq(historyEntry.id, entryId));
	if (!entry) throw new Error('Entry not found');

	const table = schemaMap[entry.tableName];
	if (!table) throw new Error(`Unknown table: ${entry.tableName}`);

	const changes = entry.changes as Record<string, any>;

	if (entry.undoneAt) {
		switch (entry.action) {
			case 'CREATE': {
				const after = changes.after;
				const [inserted] = await db.insert(table).values(after).returning();
				if (!inserted) throw new Error('Falha ao refazer');
				break;
			}
			case 'UPDATE': {
				const after = { ...changes.after, id: entry.rowId };
				const [updated] = await db
					.update(table)
					.set(after)
					.where(eq(table.id, entry.rowId))
					.returning();
				if (!updated) throw new Error('Registro não encontrado para refazer');
				break;
			}
			case 'DELETE': {
				const [deleted] = await db.delete(table).where(eq(table.id, entry.rowId)).returning();
				if (!deleted) throw new Error('Registro não encontrado para refazer');
				break;
			}
		}

		await db
			.update(historyEntry)
			.set({ undoneByUserId: null, undoneAt: null })
			.where(eq(historyEntry.id, entryId));

		await db
			.insert(historyEntry)
			.values({
				userId,
				action: entry.action,
				tableName: entry.tableName,
				rowId: entry.rowId,
				changes: entry.changes,
				description: `REDO: ${entry.description}`
			})
			.returning();

		return;
	}

	switch (entry.action) {
		case 'CREATE': {
			const [deleted] = await db.delete(table).where(eq(table.id, entry.rowId)).returning();
			if (!deleted) throw new Error('Row not found for undo');
			break;
		}
		case 'UPDATE': {
			const before = { ...changes.before, id: entry.rowId };
			const [updated] = await db
				.update(table)
				.set(before)
				.where(eq(table.id, entry.rowId))
				.returning();
			if (!updated) throw new Error('Row not found for undo');
			break;
		}
		case 'DELETE': {
			const before = changes.before;
			const [inserted] = await db.insert(table).values(before).returning();
			break;
		}
	}

	await db
		.update(historyEntry)
		.set({ undoneByUserId: userId, undoneAt: new Date() })
		.where(eq(historyEntry.id, entryId));

	const reverseAction =
		entry.action === 'CREATE' ? 'DELETE' : entry.action === 'DELETE' ? 'CREATE' : 'UPDATE';

	await db
		.insert(historyEntry)
		.values({
			userId,
			action: reverseAction,
			tableName: entry.tableName,
			rowId: entry.rowId,
			changes: entry.changes,
			description: `UNDO: ${entry.description}`
		})
		.returning();
}
