import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function load(event: RequestEvent) {
	if (!event.locals.user) {
		redirect(302, '/');
	}
}
