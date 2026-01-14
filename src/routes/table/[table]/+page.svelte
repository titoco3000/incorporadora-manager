<script>
  import DataTable from '$lib/components/DataTable.svelte';
  import Header from '$lib/components/Header.svelte';
  export let data;
</script>

<Header title={data.label} />
<DataTable 
  rows={data.rows} 
  columns={data.columns} 
  tableSlug={data.tableSlug}
  referenceData={data.referenceData}
/>