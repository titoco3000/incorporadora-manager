import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { hashPassword, signToken } from '$lib/auth';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = await request.json();
		let { email } = data;
		const { password } = data;

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		email = email.toLowerCase().trim();

		if (password.length < 6) {
			return json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
		}

		const [found] = await db.select().from(user).where(eq(user.email, email));

		if (!found) {
			return json({ error: 'Usuário não encontrado' }, { status: 404 });
		}

		if (found.passwordHash) {
			return json({ error: 'Este usuário já possui uma senha definida' }, { status: 409 });
		}

		const passwordHash = await hashPassword(password);

		const [updated] = await db
			.update(user)
			.set({ passwordHash })
			.where(eq(user.email, email))
			.returning();

		const token = signToken({ userId: updated.id, email: updated.email });

		cookies.set('token', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ token, user: { id: updated.id, email: updated.email } }, { status: 201 });
	} catch {
		return json({ error: 'Falha ao definir senha' }, { status: 500 });
	}
};
