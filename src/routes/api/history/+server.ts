import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/db';
import { historyEntry, user } from '$lib/db/schema';
import { desc, eq, count } from 'drizzle-orm';

export async function GET(event: RequestEvent) {
	try {
		const url = event.url;
		const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
		const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50')));
		const offset = (page - 1) * limit;

		const [{ total }] = await db.select({ total: count() }).from(historyEntry);

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
			.orderBy(desc(historyEntry.id))
			.limit(limit)
			.offset(offset);

		return json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) });
	} catch {
		return json({ error: 'Failed to fetch history' }, { status: 500 });
	}
}
