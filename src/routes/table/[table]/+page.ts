import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { request } from '$lib/api';

export const load: PageLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (!user) return { rows: [], tableSlug: params.table };
	const res = await request(`/api/table/${encodeURIComponent(params.table)}`);
	if (res.status === 404) error(404, 'Table not found');
	if (!res.ok) error(res.status, (await res.json().catch(() => null))?.error ?? res.statusText);
	return (await res.json()) as { rows: any[]; tableSlug: string };
};
