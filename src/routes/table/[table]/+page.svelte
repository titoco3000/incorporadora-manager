<script>
  import DataTable from '$lib/components/DataTable.svelte';
  export let data;
</script>

<h1>{data.label}</h1>
<DataTable 
  rows={data.rows} 
  columns={data.columns} 
  tableSlug={data.tableSlug} 
/>