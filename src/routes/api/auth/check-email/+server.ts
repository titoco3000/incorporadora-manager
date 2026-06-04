import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { user, whitelistEntry } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		const [existing] = await db.select().from(user).where(eq(user.email, email));
		if (existing) {
			return json({ error: 'Este email já está registrado.' }, { status: 409 });
		}

		const [entry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.email, email));
		if (!entry) {
			return json({ error: 'Email não autorizado. Contate um administrador.' }, { status: 404 });
		}

		return json({ whitelisted: true });
	} catch {
		return json({ error: 'Falha na verificação' }, { status: 500 });
	}
};
