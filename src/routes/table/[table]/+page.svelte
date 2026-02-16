<script lang="ts">
	import MailLink from '$lib/components/NewDataTable/MailLink.svelte';
	import SimpleInput from '$lib/components/NewDataTable/SimpleInput.svelte';
	import Table from '$lib/components/ResizeableTable/Table.svelte';
	import type { ColumnDef, RowData } from '$lib/components/ResizeableTable/types.js';

	interface DataType {
		rows: RowData[];
		label: string;
		tableSlug: string;
	}

	let { data } = $props<{ data: DataType }>();

	const strCompare = (a: string, b: string) => a.localeCompare(b);

	const columnsDef: ColumnDef[] = [
		{
			key: 'name',
			label: 'Nome',
			sortCompareFn: strCompare,
			renderer: SimpleInput
		},
		{
			key: 'email',
			label: 'Email',
			sortCompareFn: strCompare,
			renderer: SimpleInput
		},
		{
			key: 'phone',
			label: 'Telefone',
			sortCompareFn: strCompare,
			renderer: SimpleInput
		},
		{
			key: 'role',
			label: 'Cargo',
			sortCompareFn: strCompare,
			renderer: SimpleInput
		},
		{
			key: 'obs',
			label: 'Observações',
			sortCompareFn: strCompare,
			renderer: SimpleInput
		}
	];
</script>

<main>
	<h1>{data.label}</h1>
	<Table
		id={data.tableSlug}
		columns={columnsDef}
		data={data.rows}
		rowKey="id"
		onChange={(rowID, columnKey, value) => console.log(rowID, columnKey, value)}
	/>
</main>

<style>
	main {
		padding: 10px;
	}
</style>
