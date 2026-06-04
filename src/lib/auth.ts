import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const SALT_ROUNDS = 10;

function getSecret(): string {
	const secret = env.JWT_SECRET;
	if (!secret) throw new Error('JWT_SECRET environment variable is not set');
	return secret;
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; email: string }): string {
	return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; email: string } | null {
	try {
		return jwt.verify(token, getSecret()) as { userId: number; email: string };
	} catch {
		return null;
	}
}
