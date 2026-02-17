<script lang="ts">
	import DataTable from '$lib/components/DataTable/DataTable.svelte';
	import type { RowData } from '$lib/components/ResizeableTable/types.js';

	interface DataType {
		rows: RowData[];
		label: string;
		tableSlug: string;
	}

	let { data } = $props<{ data: DataType }>();
</script>

<DataTable
	type={data.tableSlug}
	rows={data.rows}
	label={data.label}
	allowDelete={true}
	allowEdit={true}
/>
