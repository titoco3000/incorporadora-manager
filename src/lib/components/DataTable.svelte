<script lang="ts">
  export let data: any[];
  export let columns: { key: string; label: string; type: 'text' | 'number' | 'boolean' | 'date' }[];
  export let tableName: string;

  async function updateRow(id: number, field: string, value: any) {
    await fetch(`/api/table/${tableName}`, {
      method: 'PATCH',
      body: JSON.stringify({ id, field, value }),
    });
  }

  async function deleteRow(id: number) {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/table/${tableName}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    // Refresh page or filter local state
    location.reload();
  }
</script>

<table class="excel-table">
  <thead>
    <tr>
      {#each columns as col} <th>{col.label}</th> {/each}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each data as row}
      <tr>
        {#each columns as col}
          <td>
            {#if col.type === 'boolean'}
              <input type="checkbox" checked={row[col.key]} 
                on:change={(e) => updateRow(row.id, col.key, e.currentTarget.checked)} />
            {:else if col.type === 'number'}
              <input type="number" value={row[col.key]} 
                on:blur={(e) => updateRow(row.id, col.key, parseFloat(e.currentTarget.value))} />
            {:else if col.type === 'date'}
              <input type="date" value={row[col.key]} 
                on:blur={(e) => updateRow(row.id, col.key, e.currentTarget.value)} />
            {:else}
              <input type="text" value={row[col.key]} 
                on:blur={(e) => updateRow(row.id, col.key, e.currentTarget.value)} />
            {/if}
          </td>
        {/each}
        <td>
          <button on:click={() => deleteRow(row.id)}>Delete</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .excel-table { width: 100%; border-collapse: collapse; }
  .excel-table td, .excel-table th { border: 1px solid #ccc; padding: 4px; }
  input { border: none; width: 100%; background: transparent; }
  input:focus { background: #fff; outline: 1px solid #007bff; }
</style>