<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { type ColumnDef, type RowData } from '$lib/types/table';
	import { api } from '$lib/api';

	export let rows: RowData[] = [];
	export let columns: readonly ColumnDef[] = [];
	export let tableSlug: string = '';
	export let referenceData: Record<string, any[]> = {};

	let displayRows: RowData[] = [];
	$: displayRows = [...rows];

	let tempRowData = new Map<string, RowData>();

	const apiMap: Record<string, any> = {
		'transaction-types': api.transactionTypes,
		buildings: api.buildings,
		companies: api.companies,
		contacts: api.contacts,
		contracts: api.contracts,
		transactions: api.transactions
	};

	function getDisplayValue(refRows: any[], id: any): string {
		if (!id) return '';
		const item = refRows.find((r) => r.id === id);
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
		tempRowData.set(newRow.id as string, { ...newRow });
	}

	function convertValue(col: ColumnDef, value: any): any {
		if (value === '' || value === null || value === undefined) {
			return null;
		}
		if (col.type === 'number') {
			const num = Number(value);
			return isNaN(num) ? null : num;
		}
		if (col.type === 'boolean') {
			return Boolean(value);
		}
		return value;
	}

	function updateTempRow(rowId: string, key: string, value: unknown) {
		const currentData = tempRowData.get(rowId) || {};
		const col = columns.find((c) => c.key === key);
		const convertedValue = col ? convertValue(col, value) : value;

		tempRowData.set(rowId, {
			...currentData,
			[key]: convertedValue
		});

		displayRows = displayRows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r));
	}

	async function saveTempRow(rowId: string) {
		const apiClient = apiMap[tableSlug];
		if (!apiClient) {
			console.error(`No API client found for table: ${tableSlug}`);
			return;
		}

		const rowData = tempRowData.get(rowId);
		if (!rowData) return;

		const payload: Record<string, unknown> = {};
		columns.forEach((c) => {
			payload[c.key] = convertValue(c, rowData[c.key]);
		});

		try {
			await apiClient.post(payload);
			tempRowData.delete(rowId);
			invalidateAll();
		} catch (e) {
			console.error('Save failed:', e);
			alert('Failed to save. Please check all required fields are filled.');
		}
	}

	async function handleEdit(row: RowData, key: string, value: unknown) {
		const col = columns.find((c) => c.key === key);
		const convertedValue = col ? convertValue(col, value) : value;

		if (row[key] === convertedValue) {
			return;
		}

		const isTemp = String(row.id).startsWith('temp-');

		if (isTemp) {
			updateTempRow(row.id as string, key, convertedValue);
			return;
		}

		const apiClient = apiMap[tableSlug];
		if (!apiClient) {
			console.error(`No API client found for table: ${tableSlug}`);
			return;
		}

		try {
			await apiClient.patch(row.id, { [key]: convertedValue });
			invalidateAll();
		} catch (e) {
			console.error('Save failed:', e);
		}
	}

	async function deleteRow(id: RowData['id']) {
		if (String(id).startsWith('temp-')) {
			displayRows = displayRows.filter((r) => r.id !== id);
			tempRowData.delete(id as string);
			return;
		}

		if (!confirm('Delete this row?')) return;

		const apiClient = apiMap[tableSlug];
		if (!apiClient) return;

		try {
			await apiClient.delete(id as number);
			invalidateAll();
		} catch (e) {
			console.error('Delete failed:', e);
		}
	}
</script>

<main>
	<div class="controls">
		<button class="add-btn" on:click={addEmptyRow}> + Add New Row </button>
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
				{@const isTemp = String(row.id).startsWith('temp-')}
				<tr class:is-temp={isTemp}>
					{#each columns as col}
						<td>
							{#if col.type === 'boolean'}
								<input
									type="checkbox"
									checked={Boolean(row[col.key])}
									on:change={(e) =>
										handleEdit(row, col.key, (e.target as HTMLInputElement).checked)}
								/>
							{:else if col.type === 'select'}
								<select
									value={row[col.key] ?? ''}
									on:change={(e) =>
										handleEdit(row, col.key, (e.target as HTMLSelectElement).value || null)}
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
									type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
									value={String(row[col.key] ?? '')}
									placeholder={col.label}
									step={col.type === 'number' ? 'any' : undefined}
									on:blur={(e) => handleEdit(row, col.key, (e.target as HTMLInputElement).value)}
								/>
							{/if}
						</td>
					{/each}
					<td class="actions-cell">
						{#if isTemp}
							<button class="save-btn" on:click={() => saveTempRow(row.id as string)}>
								Save
							</button>
						{/if}
						<button class="delete-btn" on:click={() => deleteRow(row.id)}>
							{isTemp ? 'Cancel' : 'Remove'}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>

  main {
    padding: 2.5vw;
  }

	.controls {
		margin-bottom: 1.5rem;
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
		color: white;
	}
	td,
	th {
		border: 1px solid #ddd;
		padding: 8px;
    background-color: var(--light-black);
	}
	.is-temp {
		background-color: #fff3cd;
	}
	.actions-cell {
		white-space: nowrap;
	}
	.save-btn {
		background: #007bff;
		color: white;
		border: none;
		padding: 4px 12px;
		cursor: pointer;
		border-radius: 4px;
		margin-right: 4px;
	}
	.delete-btn {
		background: #dc3545;
		color: white;
		border: none;
		padding: 4px 12px;
		cursor: pointer;
		border-radius: 4px;
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
		color: #000;
	}
	select {
		cursor: pointer;
	}
</style>
