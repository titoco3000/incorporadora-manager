import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { whitelistEntry } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getDbErrorMessage } from '$lib/db/errors';

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

		const [deleted] = await db.delete(whitelistEntry).where(eq(whitelistEntry.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch {
		return json({ error: 'Failed to delete entry' }, { status: 500 });
	}
};
