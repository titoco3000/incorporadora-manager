import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { whitelistEntry } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getDbErrorMessage } from '$lib/db/errors';
import { recordHistory } from '$lib/history';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const entries = await db.select().from(whitelistEntry).orderBy(whitelistEntry.createdAt);
	return json(entries);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		let { email } = await request.json();
		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}
		email = email.toLowerCase().trim();

		const [entry] = await db
			.insert(whitelistEntry)
			.values({ email, addedById: locals.user.userId })
			.returning();

		recordHistory({
			userId: locals.user.userId,
			action: 'CREATE',
			tableName: 'whitelist_entry',
			rowId: entry.id,
			changes: { after: entry },
			description: `Email '${email}' adicionado à whitelist`
		});

		return json(entry, { status: 201 });
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return json({ error: msg }, { status: 409 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { id } = await request.json();
		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [oldEntry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.id, id));
		if (!oldEntry) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		const [deleted] = await db.delete(whitelistEntry).where(eq(whitelistEntry.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		await recordHistory({
			userId: locals.user.userId,
			action: 'DELETE',
			tableName: 'whitelist_entry',
			rowId: id,
			changes: { before: oldEntry },
			description: `Email '${oldEntry.email}' removido da whitelist`
		});

		return json({ success: true });
	} catch {
		return json({ error: 'Failed to delete entry' }, { status: 500 });
	}
};
