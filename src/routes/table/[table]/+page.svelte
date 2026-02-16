<script>
	import DataTable from '$lib/components/DataTable.svelte';
	import Table from '$lib/components/NewDataTable/Table.svelte';
	export let data;
</script>

<main>
	<h1>{data.label}</h1>
	<Table />
</main>

<style>
	main {
		padding: 10px;
	}
</style>
