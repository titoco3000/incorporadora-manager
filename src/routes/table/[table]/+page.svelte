<script lang="ts">
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
			sortCompareFn: strCompare
		},
		{
			key: 'phone',
			label: 'Telefone',
			sortCompareFn: strCompare
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
	<Table id={data.tableSlug} columns={columnsDef} data={data.rows} />
</main>

<style>
	main {
		padding: 10px;
	}
</style>
