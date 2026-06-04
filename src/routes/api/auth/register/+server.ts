import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { user, whitelistEntry } from '$lib/db/schema';
import { hashPassword, signToken } from '$lib/auth';
import { eq } from 'drizzle-orm';
import { getDbErrorMessage } from '$lib/db/errors';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		const [existingUser] = await db.select().from(user).where(eq(user.email, email));
		if (existingUser) {
			return json({ error: 'An account with this email already exists' }, { status: 409 });
		}

		const existingUsers = await db.select({ id: user.id }).from(user).limit(1);
		const userCount = existingUsers.length;
		if (userCount > 0) {
			const [entry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.email, email));
			if (!entry) {
				return json(
					{
						error:
							'This email is not authorized to register. Contact an existing user to be added to the whitelist.'
					},
					{ status: 403 }
				);
			}
		}

		const passwordHash = await hashPassword(password);
		const [newUser] = await db.insert(user).values({ email, passwordHash }).returning();

		await db.delete(whitelistEntry).where(eq(whitelistEntry.email, email));

		const token = signToken({ userId: newUser.id, email: newUser.email });

		cookies.set('token', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ token, user: { id: newUser.id, email: newUser.email } }, { status: 201 });
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return json({ error: msg }, { status: 409 });
	}
};
