<script lang="ts">
	import MailLink from '$lib/components/NewDataTable/MailLink.svelte';
	import SimpleInput from '$lib/components/NewDataTable/SimpleInput.svelte';
	import Table from '$lib/components/ResizeableTable/Table.svelte';
	import type { ColumnDef } from '$lib/components/ResizeableTable/types.js';
	export let data;

	const strCompare = (a: string, b: string) => a.localeCompare(b);

	const columnsDef: ColumnDef[] = [
		{
			key: 'name',
			label: 'Nome',
			sortCompareFn: strCompare
		},
		{
			key: 'email',
			label: 'Email',
			sortCompareFn: strCompare,
			renderer: MailLink
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
			sortCompareFn: strCompare
		},
		{
			key: 'obs',
			label: 'Observações',
			sortCompareFn: strCompare
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
