<script>
	import DataTable from '$lib/components/DataTable.svelte';
	import Table from '$lib/components/NewDataTable/Table.svelte';
	export let data;
</script>

<main>
	<h1>{data.label}</h1>
	<Table
		id="teste2"
		columns={[
			{ key: 'id', label: 'ID', width: 100 },
			{ key: 'name', label: 'Name', width: 100 },
			{ key: 'email', label: 'Email', width: 100 },
			{ key: 'role', label: 'Role', width: 100 },
			{ key: 'status', label: 'Status', width: 100 }
		]}
		data={[
			{ id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' },
			{ id: 2, name: 'Bob', email: 'bob@example.com', role: 'User', status: 'Inactive' },
			{ id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User', status: 'Active' }
		]}
	/>
</main>

<style>
	main {
		padding: 10px;
	}
</style>
