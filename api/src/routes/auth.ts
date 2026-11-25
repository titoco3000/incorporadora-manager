import { Hono, type Context } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db, write } from '../db/index.ts';
import { user, whitelistEntry } from '../db/schema.ts';
import { getDbErrorMessage } from '../db/errors.ts';
import { hashPassword, signToken, verifyPassword } from '../auth.ts';
import { recordHistory } from '../history.ts';
import type { Env } from '../env.ts';

const auth = new Hono<Env>();

const MAX_AGE = 60 * 60 * 24 * 7;

function setTokenCookie(c: Context, token: string) {
	setCookie(c, 'token', token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'Lax',
		maxAge: MAX_AGE
	});
}

auth.post('/check-email', async (c) => {
	try {
		let { email } = await c.req.json();
		if (!email) return c.json({ error: 'Email is required' }, 400);
		email = email.toLowerCase().trim();

		const [existing] = await db.select().from(user).where(eq(user.email, email));
		if (existing) return c.json({ error: 'Este email já está registrado.' }, 409);

		const [entry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.email, email));
		if (!entry) {
			return c.json({ error: 'Email não autorizado. Contate um administrador.' }, 404);
		}
		return c.json({ whitelisted: true });
	} catch {
		return c.json({ error: 'Falha na verificação' }, 500);
	}
});

// Used by the /confirm-password page load (was a server load querying the DB directly).
auth.post('/password-status', async (c) => {
	try {
		let { email } = await c.req.json();
		if (!email) return c.json({ error: 'Email is required' }, 400);
		email = email.toLowerCase().trim();
		const [found] = await db.select().from(user).where(eq(user.email, email));
		return c.json({ exists: !!found, hasPassword: !!found?.passwordHash });
	} catch {
		return c.json({ error: 'Falha na verificação' }, 500);
	}
});

auth.post('/confirm-password', async (c) => {
	try {
		const data = await c.req.json();
		let { email } = data;
		const { password } = data;
		if (!email || !password) {
			return c.json({ error: 'Email and password are required' }, 400);
		}
		email = email.toLowerCase().trim();
		if (password.length < 6) {
			return c.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, 400);
		}

		const [found] = await db.select().from(user).where(eq(user.email, email));
		if (!found) return c.json({ error: 'Usuário não encontrado' }, 404);
		if (found.passwordHash) {
			return c.json({ error: 'Este usuário já possui uma senha definida' }, 409);
		}

		const passwordHash = await hashPassword(password);
		const [updated] = await write((tx) =>
			tx.update(user).set({ passwordHash }).where(eq(user.email, email)).returning()
		);

		const token = await signToken({ userId: updated.id, email: updated.email });
		setTokenCookie(c, token);
		return c.json({ token, user: { id: updated.id, email: updated.email } }, 201);
	} catch {
		return c.json({ error: 'Falha ao definir senha' }, 500);
	}
});

auth.post('/login', async (c) => {
	try {
		const data = await c.req.json();
		let { email } = data;
		const { password } = data;
		if (!email || !password) {
			return c.json({ error: 'Email and password are required' }, 400);
		}
		email = email.toLowerCase().trim();

		const [found] = await db.select().from(user).where(eq(user.email, email));
		if (!found) {
			const [entry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.email, email));
			return c.json({ error: 'Usuário não encontrado', whitelisted: !!entry }, 404);
		}
		if (!found.passwordHash) {
			return c.json({ needsPasswordSetup: true, email: found.email }, 200);
		}
		if (!(await verifyPassword(password, found.passwordHash))) {
			return c.json({ error: 'Senha incorreta' }, 401);
		}

		const token = await signToken({ userId: found.id, email: found.email });
		setTokenCookie(c, token);
		return c.json({ token, user: { id: found.id, email: found.email } });
	} catch {
		return c.json({ error: 'Falha na autenticação' }, 500);
	}
});

auth.post('/logout', (c) => {
	deleteCookie(c, 'token', { path: '/', secure: true });
	return c.json({ success: true });
});

auth.get('/me', (c) => {
	const current = c.get('user');
	if (!current) return c.json({ error: 'Not authenticated' }, 401);
	return c.json({ user: current });
});

auth.post('/register', async (c) => {
	try {
		const data = await c.req.json();
		let { email } = data;
		const { password } = data;
		if (!email || !password) {
			return c.json({ error: 'Email and password are required' }, 400);
		}
		email = email.toLowerCase().trim();
		if (password.length < 6) {
			return c.json({ error: 'Password must be at least 6 characters' }, 400);
		}

		const [existingUser] = await db.select().from(user).where(eq(user.email, email));
		if (existingUser) {
			return c.json({ error: 'An account with this email already exists' }, 409);
		}

		const existingUsers = await db.select({ id: user.id }).from(user).limit(1);
		if (existingUsers.length > 0) {
			const [entry] = await db.select().from(whitelistEntry).where(eq(whitelistEntry.email, email));
			if (!entry) {
				return c.json(
					{
						error:
							'This email is not authorized to register. Contact an existing user to be added to the whitelist.'
					},
					403
				);
			}
		}

		const passwordHash = await hashPassword(password);
		const newUser = await write(async (tx) => {
			const [created] = await tx.insert(user).values({ email, passwordHash }).returning();
			await tx.delete(whitelistEntry).where(eq(whitelistEntry.email, email));
			return created;
		});

		const token = await signToken({ userId: newUser.id, email: newUser.email });
		setTokenCookie(c, token);
		return c.json({ token, user: { id: newUser.id, email: newUser.email } }, 201);
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return c.json({ error: msg }, 409);
	}
});

auth.get('/whitelist', async (c) => {
	if (!c.get('user')) return c.json({ error: 'Not authenticated' }, 401);
	const entries = await db.select().from(whitelistEntry).orderBy(whitelistEntry.createdAt);
	return c.json(entries);
});

auth.post('/whitelist', async (c) => {
	const current = c.get('user');
	if (!current) return c.json({ error: 'Not authenticated' }, 401);
	try {
		let { email } = await c.req.json();
		if (!email) return c.json({ error: 'Email is required' }, 400);
		email = email.toLowerCase().trim();

		const entry = await write(async (tx) => {
			const [created] = await tx
				.insert(whitelistEntry)
				.values({ email, addedById: current.userId })
				.returning();
			await recordHistory(tx, {
				userId: current.userId,
				action: 'CREATE',
				tableName: 'whitelist_entry',
				rowId: created.id,
				changes: { after: created },
				description: `Email '${email}' adicionado à whitelist`
			});
			return created;
		});
		return c.json(entry, 201);
	} catch (err) {
		const msg = getDbErrorMessage(err) ?? (err as Error).message;
		return c.json({ error: msg }, 409);
	}
});

auth.delete('/whitelist', async (c) => {
	const current = c.get('user');
	if (!current) return c.json({ error: 'Not authenticated' }, 401);
	try {
		const { id } = await c.req.json();
		if (!id) return c.json({ error: 'ID is required' }, 400);

		const deleted = await write(async (tx) => {
			const [old] = await tx.delete(whitelistEntry).where(eq(whitelistEntry.id, id)).returning();
			if (!old) return null;
			await recordHistory(tx, {
				userId: current.userId,
				action: 'DELETE',
				tableName: 'whitelist_entry',
				rowId: id,
				changes: { before: old },
				description: `Email '${old.email}' removido da whitelist`
			});
			return old;
		});
		if (!deleted) return c.json({ error: 'Entry not found' }, 404);
		return c.json({ success: true });
	} catch {
		return c.json({ error: 'Failed to delete entry' }, 500);
	}
});

export default auth;
