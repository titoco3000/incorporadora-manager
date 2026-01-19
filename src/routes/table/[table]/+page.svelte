<script>
  import DataTable from '$lib/components/DataTable.svelte';
  import TableHeader from '$lib/components/TableHeader.svelte';
  export let data;
</script>

<TableHeader title={data.label} />
<DataTable 
  rows={data.rows} 
  columns={data.columns} 
  tableSlug={data.tableSlug}
  referenceData={data.referenceData}
/>