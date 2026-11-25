import type { PageLoad } from './$types';
import { load as get } from '$lib/api';

type Slice = { label: string; value: number };
type Bar = { label: string; value: number; negativeValue: number };

export const load: PageLoad = async ({ url, parent }) => {
	const { user } = await parent();
	const params = new URLSearchParams();
	for (const key of ['start', 'end']) {
		const value = url.searchParams.get(key);
		if (value) params.set(key, value);
	}
	if (!user) {
		return { pieData: [], transactionVolumesPerBuilding: [], startDate: '', endDate: '' };
	}
	return get<{
		pieData: Slice[];
		transactionVolumesPerBuilding: Bar[];
		startDate: string;
		endDate: string;
	}>(`/api/dashboard${params.size ? `?${params}` : ''}`);
};
