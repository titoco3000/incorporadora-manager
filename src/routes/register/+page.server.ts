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
	if (!email) {
		redirect(302, '/');
	}

	const [existing] = await db.select().from(user).where(eq(user.email, email));
	if (existing) {
		redirect(302, '/');
	}

	return { email };
};
