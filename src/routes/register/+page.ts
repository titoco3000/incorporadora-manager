import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { request } from '$lib/api';

export const load: PageLoad = async ({ url, parent }) => {
	const { user } = await parent();
	if (user) redirect(302, '/');

	const email = url.searchParams.get('email');
	if (!email) redirect(302, '/');

	const res = await request('/api/auth/password-status', 'POST', { email });
	if (!res.ok || (await res.json()).exists) redirect(302, '/');

	return { email };
};
