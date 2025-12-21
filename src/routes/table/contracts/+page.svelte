<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  export let data;

  const cols = [
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'expirationDate', label: 'Expiration', type: 'date' },
    { key: 'startValue', label: 'Value', type: 'number' },
    { key: 'obs', label: 'Notes', type: 'text' }
  ];
</script>

<h1>Contracts</h1>
<DataTable data={data.rows} columns={cols} tableName="contract" />