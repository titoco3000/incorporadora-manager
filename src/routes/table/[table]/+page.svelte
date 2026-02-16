<script lang="ts">
	import MailLink from '$lib/components/NewDataTable/MailLink.svelte';
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
	<Table id={data.tableSlug} columns={columnsDef} data={data.rows}>
		<TableRow>
			<TableCell>a</TableCell>
			<TableCell>b</TableCell>
			<TableCell>c</TableCell>
		</TableRow>
	</Table>
</main>

<style>
	main {
		padding: 10px;
	}
</style>
