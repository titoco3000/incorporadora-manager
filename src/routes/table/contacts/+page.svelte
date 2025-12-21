<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  export let data;

  const cols = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'obs', label: 'Notes', type: 'text' }
  ];
</script>

<h1>Contacts</h1>
<DataTable data={data.rows} columns={cols} tableName="contact" />