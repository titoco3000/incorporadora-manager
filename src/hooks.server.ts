import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const authHeader = event.request.headers.get('authorization');
	const token = authHeader?.startsWith('Bearer ')
		? authHeader.slice(7)
		: event.cookies.get('token') || null;

	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = payload;
		} else {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
