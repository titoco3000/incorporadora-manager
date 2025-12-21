<script>
  import { invalidateAll } from '$app/navigation';
  export let rows = [];
  export let columns = [];
  export let tableSlug = '';

  // Local state to manage rows including unsaved ones
  let displayRows = [];
  $: displayRows = [...rows];

  function addEmptyRow() {
    const newRow = { id: `temp-${Date.now()}` };
    columns.forEach(col => newRow[col.key] = col.type === 'boolean' ? false : '');
    displayRows = [...displayRows, newRow];
  }

  async function handleEdit(row, key, value) {
    const isTemp = String(row.id).startsWith('temp-');
    const payload = { ...row, [key]: value };
    
    // Remove the temp ID before sending to server
    if (isTemp) delete payload.id;

    const method = isTemp ? 'POST' : 'PATCH';
    
    try {
      const res = await fetch(`/api/table/${tableSlug}`, {
        method,
        body: JSON.stringify(isTemp ? payload : { id: row.id, [key]: value })
      });

      if (res.ok) {
        // If it was a new row, we need the real ID from the DB
        invalidateAll();
      } else {
        const err = await res.json();
        console.error("Save failed: ", err.error);
        // Optional: toast notification for "Mandatory fields missing"
      }
    } catch (e) {
      console.error("Network error", e);
    }
  }

  async function deleteRow(id) {
    if (String(id).startsWith('temp-')) {
      displayRows = displayRows.filter(r => r.id !== id);
      return;
    }
    if (!confirm('Delete this row?')) return;
    await fetch(`/api/table/${tableSlug}`, {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    invalidateAll();
  }
</script>

<div class="controls">
  <button class="add-btn" on:click={addEmptyRow}>+ Add New Row</button>
</div>

<table class="admin-table">
  <thead>
    <tr>
      {#each columns as col} <th>{col.label}</th> {/each}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each displayRows as row (row.id)}
      <tr class:is-temp={String(row.id).startsWith('temp-')}>
        {#each columns as col}
          <td>
            {#if col.type === 'boolean'}
              <input type="checkbox" checked={row[col.key]} 
                on:change={(e) => handleEdit(row, col.key, e.target.checked)} />
            {:else}
              <input type={col.type} value={row[col.key]} 
                on:blur={(e) => handleEdit(row, col.key, e.target.value)}
                placeholder={col.label} />
            {/if}
          </td>
        {/each}
        <td><button on:click={() => deleteRow(row.id)}>Remove</button></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .controls { margin-bottom: 1rem; }
  .add-btn { background: #28a745; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; }
  .admin-table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #ddd; padding: 8px; }
  .is-temp { background-color: #f0fff4; }
  input:not([type="checkbox"]) { width: 100%; border: none; background: transparent; height: 100%; }
  input:focus { outline: 2px solid #007bff; background: white; }
</style>