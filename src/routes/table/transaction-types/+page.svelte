<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  export let data;

  const cols = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'isExpense', label: 'isExpense', type: 'boolean' },
  ];
</script>

<h1>Transactions Management</h1>
<DataTable data={data.rows} columns={cols} tableName="transactionType" />