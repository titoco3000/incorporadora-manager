import { Hono } from 'hono';
import { count, desc, eq } from 'drizzle-orm';
import { db, write } from '../db/index.ts';
import { historyEntry, user } from '../db/schema.ts';
import { undoEntry } from '../history.ts';
import type { Env } from '../env.ts';

const app = new Hono<Env>();

app.get('/', async (c) => {
	try {
		const page = Math.max(1, parseInt(c.req.query('page') ?? '1') || 1);
		const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '50') || 50));
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

		return c.json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) });
	} catch {
		return c.json({ error: 'Failed to fetch history' }, 500);
	}
});

app.post('/:id/undo', async (c) => {
	const userId = c.get('user')!.userId;
	const id = parseInt(c.req.param('id'));
	if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
	try {
		await write((tx) => undoEntry(tx, id, userId));
		return c.json({ success: true });
	} catch (err) {
		return c.json({ error: (err as Error).message }, 400);
	}
});

export default app;
