<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { type ColumnDef, type RowData } from '$lib/types/table';
	import { api } from '$lib/api';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

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
		if (col.type === 'date') {
			const [day, month, year] = value.split('/').map(Number);
			const date = new Date(year, month - 1, day);

			return date.toString() === 'Invalid Date' ? null : value;
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
			alert('Failed to save.' + e.error);
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

	// Masks the input to format DD/MM/YYYY
	function maskDateBR(value: string) {
		let v = value.replace(/\D/g, '');
		if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
		if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
		return v;
	}
	// Masks the input to the format 00.000.000/0000-00
	function maskCNPJ(value: string) {
		let v = value.replace(/[^A-Z0-9]/g, ''); // alfanumérico!
		if (v.length > 2) v = v.slice(0, 2) + '.' + v.slice(2);
		if (v.length > 6) v = v.slice(0, 6) + '.' + v.slice(6);
		if (v.length > 10) v = v.slice(0, 10) + '/' + v.slice(10);
		if (v.length > 15) v = v.slice(0, 15) + '-' + v.slice(15, 17);
		return v;
	}

	function ISOToDateBR(value: string) {
		const [year, month, day] = value.split('-');
		return value ? `${day}/${month}/${year}` : value;
	}
	function NumEUAToNumBR(value: string) {
		return value ? value.replace(',', '.') : value;
	}

	const columnTypeToRatioMap: Record<string, number> = {
		numeric: 1,
		'text-short': 1.67,
		'text-long': 3.33,
		date: 1.5,
		select: 1.67,
		boolean: 1,
		cnpj: 2
	};

	const MIN_COL_WIDTH = 150;

	let table: HTMLTableElement;
	let maxTableWidth: number | null = null;
	let headerBeingResized: HTMLTableCellElement | null = null;
	let columnWidths: number[] = [];

	function getMaxTableWidthPx(el: HTMLElement): number | null {
		const styles = getComputedStyle(el);
		const maxWidth = styles.maxWidth;

		if (!maxWidth || maxWidth === 'none') {
			return null;
		}

		return parseFloat(maxWidth);
	}

	function startResize(e: MouseEvent, index: number) {
		e.preventDefault();
		let tableWidth: number = columnWidths.reduce((acc, v) => acc + v, 0);
		const startX = e.clientX;
		const startWidth = columnWidths[index];
		headerBeingResized = e.target as HTMLSpanElement;

		function onMouseMove(ev: MouseEvent) {
			const delta = ev.clientX - startX;
			const newWidth = Math.max(MIN_COL_WIDTH, startWidth + delta);
			headerBeingResized.style.backgroundColor = '#00ccff';
			headerBeingResized.style.opacity = '0.8';

			const currentWidth = columnWidths[index];
			tableWidth = columnWidths.reduce((acc, v) => acc + v, 0);
			if (maxTableWidth < tableWidth && newWidth >= currentWidth) return;
			columnWidths[index] = newWidth;
		}

		function onMouseUp() {
			headerBeingResized.style.backgroundColor = '';
			headerBeingResized.style.opacity = '';
			headerBeingResized = null;

			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function resetColumns() {
		maxTableWidth = getMaxTableWidthPx(table);
		columnWidths = [
			...columns.map((col) => {
				const ratio = columnTypeToRatioMap[col.type] ?? 1.67;
				return MIN_COL_WIDTH * ratio;
			}),
			120 // actions
		];
	}

	onMount(() => resetColumns());
	$: if (browser && table) {
		$page.url.pathname;
		resetColumns();
	}

	$: gridTemplateColumns = columnWidths.map((w) => `minmax(${w}px, ${w}px)`).join(' ');

	$: {
		let i: number = 0;
		for (let row of rows) {
			for (let col of columns) {
				const cellValue = row[col.key];
				if (col.type === 'date') {
					rows[i][col.key] = ISOToDateBR(cellValue);
				} else if (col.type === 'number') {
					rows[i][col.key] = NumEUAToNumBR(cellValue);
				}
			}
			i++;
		}
	}
</script>

<main>
	<div class="controls">
		<button class="add-btn" on:click={addEmptyRow}> + Add New Row </button>
	</div>

	<table
		bind:this={table}
		class="admin-table"
		style={`grid-template-columns: ${gridTemplateColumns};`}
	>
		<thead>
			<tr>
				{#each columns as col, index}
					<th
						>{col.label}<span class="resize-handle" on:mousedown={(e) => startResize(e, index)}
						></span></th
					>
				{/each}
				<th bind:this={headerBeingResized}
					>Actions <span class="resize-handle" on:mousedown={(e) => startResize(e, columns.length)}
					></span></th
				>
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
										handleEdit(row, col.key, e.target.value === '' ? null : Number(e.target.value))}
								>
									<option value="">-- Select --</option>
									{#each referenceData[col.key] || [] as refItem}
										<option value={refItem.id}>
											{getDisplayValue(referenceData[col.key], refItem.id)}
										</option>
									{/each}
								</select>
							{:else if col.type === 'date'}
								<input
									type="text"
									placeholder={col.label}
									value={String(row[col.key] ?? '')}
									pattern="^\d{2}/\d{2}/\d{4}$"
									on:change={(e) => handleEdit(row, col.key, (e.target as HTMLInputElement).value)}
									on:input={(e) => {
										const input = e.target as HTMLInputElement;
										input.value = maskDateBR(input.value);
									}}
								/>
							{:else if col.type === 'cnpj'}
								<input
									type="text"
									placeholder={col.label}
									value={String(row[col.key] ?? '')}
									pattern="^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$"
									on:change={(e) => handleEdit(row, col.key, (e.target as HTMLInputElement).value)}
									on:input={(e) => {
										const input = e.target as HTMLInputElement;
										input.value = maskCNPJ(input.value);
									}}
								/>
							{:else}
								<input
									type={col.type === 'number' ? 'number' : 'text'}
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
		max-width: 95vw;
		border-collapse: collapse;
		color: white;
		display: grid;
		flex: 1;
	}
	thead,
	tbody,
	tr {
		display: contents;
	}
	td,
	th {
		background-color: var(--light-black);
		border: 1px solid #ddd;
		padding: 15px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	th {
		position: relative;
		top: 0;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		background: black;
		opacity: 0;
		width: 5px;
		cursor: col-resize;
	}

	/* The following selector is needed so the handle is visible during resize */
	th .resize-handle:hover {
		background-color: #00ccff;
		opacity: 0.3;
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
		background: var(--black);
		color: var(--main-text-color);
	}
	select {
		cursor: pointer;
	}
</style>
