<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  export let data;

  const cols = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'cnpj', label: 'CNPJ', type: 'text' },
    { key: 'hqAddress', label: 'HQ Address', type: 'text' },
    { key: 'isSupplier', label: 'Supplier?', type: 'boolean' },
    { key: 'obs', label: 'Observations', type: 'text' }
  ];
</script>

<h1>Companies</h1>
<DataTable data={data.rows} columns={cols} tableName="company" />