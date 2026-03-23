<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CustomInput from '$lib/components/CustomInput.svelte';
	import DataTable from '$lib/components/DataTable/DataTable.svelte';
	import type { CustomInputType } from '$lib/types/CustomInput.js';

	let { data } = $props();

	function updateFilter(paramKey: string, paramValue: string) {
		const url = new URL(page.url);

		console.log(`updateFilter(${paramKey}, ${paramValue})`);

		if (paramValue) {
			if (url.searchParams.get(paramKey) != paramValue) url.searchParams.set(paramKey, paramValue);
		} else {
			url.searchParams.delete(paramKey);
		}

		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	const filters = {
		get buildingId() {
			const id = data.activeFilters.buildingId;
			return id ? { id } : null;
		},
		set buildingId(val: any) {
			updateFilter('buildingId', val?.id ? String(val.id) : '');
		},

		get companyId() {
			const id = data.activeFilters.companyId;
			return id ? { id } : null;
		},
		set companyId(val: any) {
			updateFilter('companyId', val?.id ? String(val.id) : '');
		},

		get transactionTypeId() {
			const id = data.activeFilters.transactionTypeId;
			return id ? { id } : null;
		},
		set transactionTypeId(val: any) {
			updateFilter('transactionTypeId', val?.id ? String(val.id) : '');
		}
	};

	type FilterKey = 'buildingId' | 'companyId' | 'transactionTypeId';
	const filterConfig: Record<FilterKey, { type: string; placeholder: string }> = {
		buildingId: {
			type: 'building',
			placeholder: 'Imóvel'
		},
		companyId: {
			type: 'supplier',
			placeholder: 'Fornecedor'
		},
		transactionTypeId: {
			type: 'transactionType',
			placeholder: 'Tipo'
		}
	};

	const allColumns = [
		'transactionTypeId',
		'value',
		'companyId',
		'date',
		'buildingId',
		'document',
		'obs'
	];

	let visibleColumns = $derived(
		allColumns.filter((col) => !data.allowedFilters.includes(col) || !data.activeFilters[col])
	);
</script>

<div class="filters-bar" style="display: flex; gap: 1.5rem; min-height: 40px; ">
	{#each data.allowedFilters as filterKey}
		{@const config = filterConfig[filterKey as FilterKey]}
		{#if config}
			<div style="flex: 1; max-width: 300px; padding: 0.5rem 0.75rem;">
				<CustomInput
					type={config.type as CustomInputType}
					bind:value={filters[filterKey as FilterKey]}
					placeholder={config.placeholder}
					style="border:1px solid var(--border-color-2); border-radius: var(--border-radius); padding: 0.5rem 0.75rem;"
				/>
			</div>
		{/if}
	{/each}
</div>

<DataTable type="transaction" rows={data.rows as any} {visibleColumns} />
