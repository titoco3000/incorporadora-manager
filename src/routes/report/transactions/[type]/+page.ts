import type { PageLoad } from './$types';
import { load as get } from '$lib/api';

export const load: PageLoad = async ({ params, url, parent }) => {
	const { user } = await parent();
	if (!user) {
		return {
			rows: [] as any[],
			allowedFilters: [] as string[],
			activeFilters: {} as Record<string, string>,
			summaryVariant: null as 'single' | 'totals' | null
		};
	}
	const query = url.searchParams.size ? `?${url.searchParams}` : '';
	return get<{
		rows: any[];
		allowedFilters: string[];
		activeFilters: Record<string, string>;
		summaryVariant: 'single' | 'totals' | null;
	}>(`/api/report/transactions/${encodeURIComponent(params.type)}${query}`);
};
