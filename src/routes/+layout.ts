// Single-page app: no SSR, no prerendering. The user comes from the HttpOnly cookie via
// /api/auth/me (was +layout.server.ts reading `locals`).
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async ({ fetch }) => {
	const res = await fetch('/api/auth/me');
	if (!res.ok) return { user: null };
	const { user } = (await res.json()) as { user: { userId: number; email: string } };
	return { user };
};
