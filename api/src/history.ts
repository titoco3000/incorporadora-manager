import { eq, getTableColumns } from 'drizzle-orm';
import * as schema from './db/schema.ts';
import { historyEntry } from './db/schema.ts';
import type { Tx } from './db/index.ts';

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

// Runs inside the caller's write transaction, so the change and its history entry are
// committed together (or not at all).
export async function recordHistory(
	tx: Tx,
	params: {
		userId: number;
		action: 'CREATE' | 'UPDATE' | 'DELETE';
		tableName: string;
		rowId: number;
		changes: Record<string, any>;
		description: string;
	}
) {
	const [entry] = await tx.insert(historyEntry).values(params).returning();
	return entry;
}

// Snapshots in `changes` went through JSON, so timestamps are strings; drizzle wants Dates.
function revive(table: any, row: Record<string, any>) {
	const out: Record<string, any> = { ...row };
	for (const [key, column] of Object.entries(getTableColumns(table))) {
		if ((column as any).columnType === 'PgTimestamp' && typeof out[key] === 'string') {
			out[key] = new Date(out[key]);
		}
	}
	return out;
}

export async function undoEntry(tx: Tx, entryId: number, userId: number) {
	const [entry] = await tx.select().from(historyEntry).where(eq(historyEntry.id, entryId));
	if (!entry) throw new Error('Entry not found');

	const table = schemaMap[entry.tableName];
	if (!table) throw new Error(`Unknown table: ${entry.tableName}`);

	const changes = entry.changes as Record<string, any>;

	if (entry.undoneAt) {
		switch (entry.action) {
			case 'CREATE': {
				const [inserted] = await tx.insert(table).values(revive(table, changes.after)).returning();
				if (!inserted) throw new Error('Falha ao refazer');
				break;
			}
			case 'UPDATE': {
				const after = revive(table, { ...changes.after, id: entry.rowId });
				const [updated] = await tx
					.update(table)
					.set(after)
					.where(eq(table.id, entry.rowId))
					.returning();
				if (!updated) throw new Error('Registro não encontrado para refazer');
				break;
			}
			case 'DELETE': {
				const [deleted] = await tx.delete(table).where(eq(table.id, entry.rowId)).returning();
				if (!deleted) throw new Error('Registro não encontrado para refazer');
				break;
			}
		}

		await tx
			.update(historyEntry)
			.set({ undoneByUserId: null, undoneAt: null })
			.where(eq(historyEntry.id, entryId));

		await tx.insert(historyEntry).values({
			userId,
			action: entry.action,
			tableName: entry.tableName,
			rowId: entry.rowId,
			changes: entry.changes,
			description: `REDO: ${entry.description}`
		});
		return;
	}

	switch (entry.action) {
		case 'CREATE': {
			const [deleted] = await tx.delete(table).where(eq(table.id, entry.rowId)).returning();
			if (!deleted) throw new Error('Row not found for undo');
			break;
		}
		case 'UPDATE': {
			const before = revive(table, { ...changes.before, id: entry.rowId });
			const [updated] = await tx
				.update(table)
				.set(before)
				.where(eq(table.id, entry.rowId))
				.returning();
			if (!updated) throw new Error('Row not found for undo');
			break;
		}
		case 'DELETE': {
			await tx.insert(table).values(revive(table, changes.before));
			break;
		}
	}

	await tx
		.update(historyEntry)
		.set({ undoneByUserId: userId, undoneAt: new Date() })
		.where(eq(historyEntry.id, entryId));

	const reverseAction =
		entry.action === 'CREATE' ? 'DELETE' : entry.action === 'DELETE' ? 'CREATE' : 'UPDATE';

	await tx.insert(historyEntry).values({
		userId,
		action: reverseAction,
		tableName: entry.tableName,
		rowId: entry.rowId,
		changes: entry.changes,
		description: `UNDO: ${entry.description}`
	});
}
