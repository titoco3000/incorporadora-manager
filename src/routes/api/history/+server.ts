import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/db';
import { historyEntry, user } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(event: RequestEvent) {
	try {
		const entries = await db
			.select({
				id: historyEntry.id,
				userId: historyEntry.userId,
				userName: user.name,
				userEmail: user.email,
				action: historyEntry.action,
				tableName: historyEntry.tableName,
				rowId: historyEntry.rowId,
				changes: historyEntry.changes,
				description: historyEntry.description,
				undoneByUserId: historyEntry.undoneByUserId,
				undoneAt: historyEntry.undoneAt,
				createdAt: historyEntry.createdAt
			})
			.from(historyEntry)
			.leftJoin(user, eq(historyEntry.userId, user.id))
			.orderBy(desc(historyEntry.id));

		return json(entries);
	} catch {
		return json({ error: 'Failed to fetch history' }, { status: 500 });
	}
}
