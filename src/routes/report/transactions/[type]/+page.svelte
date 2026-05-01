<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CustomInput from '$lib/components/CustomInput.svelte';
	import DataTable from '$lib/components/DataTable/DataTable.svelte';
	import SummaryTable from '$lib/components/SummaryTable.svelte';
	import type { CustomInputType } from '$lib/types/CustomInput.js';

	let { data } = $props();

	function updateFilter(paramKey: string, paramValue: string) {
		const url = new URL(page.url);

		if (paramValue) {
			if (url.searchParams.get(paramKey) != paramValue) url.searchParams.set(paramKey, paramValue);
		} else {
			url.searchParams.delete(paramKey);
		}

		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	const filters = {
		get building() {
			const id = data.activeFilters.building;
			return id ? { id } : null;
		},
		set building(val: any) {
			updateFilter('building', val?.id ? String(val.id) : '');
		},

		get company() {
			const id = data.activeFilters.company;
			return id ? { id } : null;
		},
		set company(val: any) {
			updateFilter('company', val?.id ? String(val.id) : '');
		},

		get transactionType() {
			const id = data.activeFilters.transactionType;
			return id ? { id } : null;
		},
		set transactionType(val: any) {
			updateFilter('transactionType', val?.id ? String(val.id) : '');
		},

		get supplier() {
			const id = data.activeFilters.supplier;
			return id ? { id } : null;
		},
		set supplier(val: any) {
			updateFilter('supplier', val?.id ? String(val.id) : '');
		},

		get client() {
			const id = data.activeFilters.client;
			return id ? { id } : null;
		},
		set client(val: any) {
			updateFilter('client', val?.id ? String(val.id) : '');
		}
	};

	type FilterKey = 'building' | 'company' | 'transactionType' | 'supplier' | 'client';

	const filterConfig: Record<FilterKey, { placeholder: string }> = {
		building: { placeholder: 'Imóvel' },
		company: { placeholder: 'Empresa' },
		transactionType: { placeholder: 'Tipo' },
		supplier: { placeholder: 'Fornecedor' },
		client: { placeholder: 'Cliente' }
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

	const columnToFiltersMap: Record<string, FilterKey[]> = {
		buildingId: ['building'],
		transactionTypeId: ['transactionType'],
		companyId: ['company', 'supplier', 'client']
	};

	let visibleColumns = $derived(
		allColumns.filter((col) => {
			const relatedFilters = columnToFiltersMap[col];
			if (!relatedFilters) return true;
			const isFilterActive = relatedFilters.some(
				(filterKey) => data.allowedFilters.includes(filterKey) && data.activeFilters[filterKey]
			);
			return !isFilterActive;
		})
	);
</script>

<div class="filters-bar" style="display: flex; gap: 1.5rem; min-height: 40px;">
	{#each data.allowedFilters as filterKey}
		{@const config = filterConfig[filterKey as FilterKey]}
		{#if config}
			<div style="flex: 1; max-width: 300px; padding: 0.5rem 0.75rem;">
				<CustomInput
					type={filterKey as CustomInputType}
					bind:value={filters[filterKey as FilterKey]}
					placeholder={config.placeholder}
					style="border:1px solid var(--border-color-2); border-radius: var(--border-radius); padding: 0.5rem 0.75rem;"
				/>
			</div>
		{/if}
	{/each}
</div>

{#if data.summaryVariant}
	<SummaryTable rows={data.rows as any} tableId={page.params.type} variant={data.summaryVariant} />
{:else}
	<DataTable type="transaction" rows={data.rows as any} {visibleColumns} />
{/if}
