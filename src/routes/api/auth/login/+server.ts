import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { user, whitelistEntry } from '$lib/db/schema';
import { verifyPassword, signToken } from '$lib/auth';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		const [found] = await db.select().from(user).where(eq(user.email, email));

		if (!found) {
			const [entry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.email, email));
			return json({ error: 'Usuário não encontrado', whitelisted: !!entry }, { status: 404 });
		}

		const valid = await verifyPassword(password, found.passwordHash);
		if (!valid) {
			return json({ error: 'Senha incorreta' }, { status: 401 });
		}

		const token = signToken({ userId: found.id, email: found.email });

		cookies.set('token', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ token, user: { id: found.id, email: found.email } });
	} catch {
		return json({ error: 'Falha na autenticação' }, { status: 500 });
	}
};
