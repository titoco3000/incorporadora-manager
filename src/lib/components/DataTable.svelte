<script>
  import { invalidateAll } from '$app/navigation';
  export let rows = [];
  export let columns = [];
  export let tableSlug = '';

  async function updateField(id, key, value) {
    await fetch(`/api/table/${tableSlug}`, {
      method: 'PATCH',
      body: JSON.stringify({ id, [key]: value })
    });
  }

  async function deleteRow(id) {
    if (!confirm('Delete this row?')) return;
    await fetch(`/api/table/${tableSlug}`, {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    invalidateAll();
  }
</script>

<table class="admin-table">
  <thead>
    <tr>
      {#each columns as col} 
        <th>{col.label}</th> 
      {/each}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each rows as row}
      <tr>
        {#each columns as col}
          <td>
            {#if col.type === 'boolean'}
              <input type="checkbox" checked={row[col.key]} 
                on:change={(e) => updateField(row.id, col.key, e.target.checked)} />
            {:else}
              <input type={col.type} value={row[col.key]} 
                on:blur={(e) => updateField(row.id, col.key, e.target.value)} />
            {/if}
          </td>
        {/each}
        <td><button on:click={() => deleteRow(row.id)}>Remove</button></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .admin-table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #ddd; padding: 8px; }
  input:not([type="checkbox"]) { width: 100%; border: none; background: transparent; }
  input:focus { outline: 1px solid blue; background: white; }
</style>