<script>
	import Table from '$lib/components/NewDataTable/Table.svelte';
	export let data;
</script>

<main>
	<h1>{data.label}</h1>
	<Table id={data.tableSlug} columns={data.columns} data={data.rows} />
</main>

<style>
	main {
		padding: 10px;
	}
</style>
