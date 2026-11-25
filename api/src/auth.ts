import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const SALT_ROUNDS = 10;
const SSM_PREFIX = process.env.SSM_PREFIX ?? '/incorporadora/prod';

export type AuthUser = { userId: number; email: string };

// JWT secret: env locally, SSM in AWS (read once per cold start, retried after a failure).
let secret: Promise<string> | undefined;

async function readSecret(): Promise<string> {
	if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
	const res = await new SSMClient({}).send(
		new GetParameterCommand({ Name: `${SSM_PREFIX}/jwt-secret`, WithDecryption: true })
	);
	const value = res.Parameter?.Value?.trim() ?? '';
	// Terraform creates the parameter with "placeholder"; a known secret lets anyone forge logins.
	if (value.length < 32) throw new Error('jwt-secret not set: run `make jwt-secret <env>`');
	return value;
}

function getSecret(): Promise<string> {
	secret ??= readSecret().catch((err) => {
		secret = undefined;
		throw err;
	});
	return secret;
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function signToken(payload: AuthUser): Promise<string> {
	return jwt.sign(payload, await getSecret(), { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
	const key = await getSecret();
	try {
		const { userId, email } = jwt.verify(token, key) as AuthUser;
		return { userId, email };
	} catch {
		return null;
	}
}
