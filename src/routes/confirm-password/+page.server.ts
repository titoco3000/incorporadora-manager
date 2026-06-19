import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const email = url.searchParams.get('email');
	const password = url.searchParams.get('password');

	if (!email || !password) {
		redirect(302, '/');
	}

	if (password.length < 6) {
		redirect(302, '/');
	}

	const [found] = await db.select().from(user).where(eq(user.email, email));
	if (!found) {
		redirect(302, '/');
	}

	if (found.passwordHash) {
		redirect(302, '/');
	}

	return { email, password };
};
