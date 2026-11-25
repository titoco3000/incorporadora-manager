import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { request } from '$lib/api';

export const load: PageLoad = async ({ url, parent }) => {
	const { user } = await parent();
	if (user) redirect(302, '/');

	const email = url.searchParams.get('email');
	const password = url.searchParams.get('password');
	if (!email || !password || password.length < 6) redirect(302, '/');

	const res = await request('/api/auth/password-status', 'POST', { email });
	if (!res.ok) redirect(302, '/');
	const status = (await res.json()) as { exists: boolean; hasPassword: boolean };
	if (!status.exists || status.hasPassword) redirect(302, '/');

	return { email, password };
};
