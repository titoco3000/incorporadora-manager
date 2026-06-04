import { json } from '@sveltejs/kit';
import { undoEntry } from '$lib/history';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
	const userId = event.locals.user?.userId;
	if (!userId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const id = parseInt(event.params.id ?? '');
	if (isNaN(id)) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}

	try {
		await undoEntry(id, userId);
		return json({ success: true });
	} catch (err) {
		const message = (err as Error).message;
		return json({ error: message }, { status: 400 });
	}
}
