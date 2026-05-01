<script lang="ts">
	import Table from '$lib/components/ResizeableTable/Table.svelte';
	import type { ColumnDef, RowData } from '$lib/components/ResizeableTable/types.js';
	import { strCompare } from '$lib/sortComparators';

	let {
		rows,
		tableId = 'building-summary',
		variant = 'single'
	} = $props<{
		rows: RowData[];
		tableId?: string;
		variant?: 'single' | 'totals';
	}>();

	const formatCurrency = (val: unknown) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
			parseFloat(String(val ?? '0'))
		);

	const parseBRL = (s: string) => parseFloat(s.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;

	const currencyCompare = (a: string, b: string) => parseBRL(a) - parseBRL(b);

	const currencyFields = $derived(variant === 'totals' ? ['income', 'expense'] : ['total']);

	let displayRows = $derived(
		rows.map((r: { [x: string]: unknown }) => {
			const formatted: Record<string, string> = {};
			for (const field of currencyFields) {
				formatted[field] = formatCurrency(r[field as never]);
			}
			return { ...r, ...formatted };
		})
	);

	const nameColumn: ColumnDef = {
		key: 'name',
		label: 'Imóvel',
		sortCompareFn: strCompare as never,
		width: 300
	};

	const currencyColumn = (key: string, label: string): ColumnDef => ({
		key,
		label,
		sortCompareFn: currencyCompare as never,
		width: 200
	});

	const columnSets: Record<typeof variant, ColumnDef[]> = {
		single: [nameColumn, currencyColumn('total', 'Total')],
		totals: [nameColumn, currencyColumn('income', 'Receita'), currencyColumn('expense', 'Despesa')]
	};

	let columns = $derived(columnSets[variant]);
</script>

<Table id={tableId} {columns} data={displayRows} rowKey="id" borderColor="var(--border-color-2)" />
