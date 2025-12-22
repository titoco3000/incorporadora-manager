<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { type ColumnDef, type RowData } from '$lib/types/table';

  export let rows: RowData[] = [];
  export let columns: readonly ColumnDef[] = [];
  export let tableSlug: string = '';
  export let referenceData: Record<string, any[]> = {};

  let displayRows: RowData[] = [];
  $: displayRows = [...rows];

  // Helper to get display value for foreign key
  function getDisplayValue(refRows: any[], id: any): string {
    if (!id) return '';
    const item = refRows.find(r => r.id === id);
    return item?.name || item?.title || String(id);
  }

  function addEmptyRow() {
    const newRow: RowData = { id: `temp-${Date.now()}` };

    columns.forEach((col) => {
      if (col.type === 'boolean') {
        newRow[col.key] = false;
      } else if (col.type === 'select') {
        newRow[col.key] = null;
      } else {
        newRow[col.key] = '';
      }
    });

    displayRows = [...displayRows, newRow];
  }

  async function handleEdit(row: RowData, key: string, value: unknown) {
    const isTemp = String(row.id).startsWith('temp-');

    const payload: Record<string, unknown> = {
      ...row,
      [key]: value === '' ? null : value
    };

    if (isTemp) delete payload.id;

    const method: 'POST' | 'PATCH' = isTemp ? 'POST' : 'PATCH';

    try {
      const res = await fetch(`/api/table/${tableSlug}`, {
        method,
        body: JSON.stringify(
          isTemp ? payload : { id: row.id, [key]: value === '' ? null : value }
        )
      });

      if (res.ok) {
        invalidateAll();
      } else {
        const err = await res.json();
        console.error('Save failed:', err.error);
      }
    } catch (e) {
      console.error('Network error', e);
    }
  }

  async function deleteRow(id: RowData['id']) {
    if (String(id).startsWith('temp-')) {
      displayRows = displayRows.filter((r) => r.id !== id);
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
  <button class="add-btn" on:click={addEmptyRow}>
    + Add New Row
  </button>
</div>

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
    {#each displayRows as row (row.id)}
      <tr class:is-temp={String(row.id).startsWith('temp-')}>
        {#each columns as col}
          <td>
            {#if col.type === 'boolean'}
              <input
                type="checkbox"
                checked={Boolean(row[col.key])}
                on:change={(e) =>
                  handleEdit(
                    row,
                    col.key,
                    (e.target as HTMLInputElement).checked
                  )
                }
              />
            {:else if col.type === 'select'}
              <select
                value={row[col.key] ?? ''}
                on:change={(e) =>
                  handleEdit(
                    row,
                    col.key,
                    (e.target as HTMLSelectElement).value || null
                  )
                }
              >
                <option value="">-- Select --</option>
                {#each referenceData[col.key] || [] as refItem}
                  <option value={refItem.id}>
                    {getDisplayValue(referenceData[col.key], refItem.id)}
                  </option>
                {/each}
              </select>
            {:else}
              <input
                type={col.type}
                value={String(row[col.key] ?? '')}
                placeholder={col.label}
                on:blur={(e) =>
                  handleEdit(
                    row,
                    col.key,
                    (e.target as HTMLInputElement).value
                  )
                }
              />
            {/if}
          </td>
        {/each}
        <td>
          <button on:click={() => deleteRow(row.id)}>
            Remove
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .controls {
    margin-bottom: 1rem;
  }

  .add-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 4px;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
  }

  td,
  th {
    border: 1px solid #ddd;
    padding: 8px;
  }

  .is-temp {
    background-color: #f0fff4;
  }

  input:not([type='checkbox']),
  select {
    width: 100%;
    border: none;
    background: transparent;
    height: 100%;
    padding: 4px;
  }

  input:focus,
  select:focus {
    outline: 2px solid #007bff;
    background: white;
  }

  select {
    cursor: pointer;
  }
</style>