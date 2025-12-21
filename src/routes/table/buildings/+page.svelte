<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  export let data;

  const cols = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'builtArea', label: 'Built Area (m²)', type: 'number' },
    { key: 'height', label: 'Height', type: 'number' },
  ];
</script>

<h1>Buildings Management</h1>
<DataTable data={data.rows} columns={cols} tableName="building" />