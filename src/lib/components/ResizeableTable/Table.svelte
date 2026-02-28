<script lang="ts">
	import type { ColumnDef, RowData } from './types';

	interface Props {
		id: string;
		columns: ColumnDef[];
		data?: RowData[];
		rowKey?: string;
		borderColor?: string;
		onChange?: (rowID: any, columnKey: string, value: any) => void;
	}

	let { id, columns, data = [], rowKey, onChange, borderColor = '#e5e7eb' }: Props = $props();

	function getSavedWidths(): Record<string, number> {
		if (typeof window === 'undefined') return {};
		try {
			const saved = localStorage.getItem(`table_widths_${id}`);
			return saved ? JSON.parse(saved) : {};
		} catch {
			return {};
		}
	}

	let widthOverrides = $state<Record<string, number>>(getSavedWidths());

	// If the parent mutates `columns`, override the saved values.
	let activeColumns = $derived(
		columns.map((col) => ({
			...col,
			width: widthOverrides[col.key] ?? (col.width || 200)
		}))
	);

	let tableWidth = $derived(activeColumns.reduce((sum, col) => sum + col.width, 0));

	// Save to local storage whenever the widths change
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`table_widths_${id}`, JSON.stringify(widthOverrides));
		}
	});

	let resizingIndex = $state<number>(-1);
	let startX = $state<number>(0);
	let startWidth = $state<number>(0);
	let tableRef: HTMLTableElement;

	function onMouseDown(index: number, e: MouseEvent) {
		resizingIndex = index;
		startX = e.clientX;
		startWidth = activeColumns[index].width;

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function onMouseMove(e: MouseEvent) {
		if (resizingIndex === -1) return;

		const currentX = e.clientX;
		const diff = currentX - startX;
		const colKey = activeColumns[resizingIndex].key;

		widthOverrides[colKey] = Math.max(40, startWidth + diff);
	}

	function onMouseUp() {
		resizingIndex = -1;
		window.removeEventListener('mousemove', onMouseMove);
		window.removeEventListener('mouseup', onMouseUp);
	}

	function onDoubleClick(index: number) {
		if (!tableRef) return;

		const colKey = activeColumns[index].key;
		const headerText = activeColumns[index].label;
		const cellTexts = data.map((row) => String(row[colKey] ?? ''));

		const span = document.createElement('span');
		span.style.visibility = 'hidden';
		span.style.position = 'absolute';
		span.style.whiteSpace = 'nowrap';

		const tableStyle = window.getComputedStyle(tableRef);
		span.style.fontFamily = tableStyle.fontFamily;
		span.style.fontSize = tableStyle.fontSize;
		span.style.letterSpacing = tableStyle.letterSpacing;

		document.body.appendChild(span);

		// Header
		span.style.fontWeight = '600';
		span.textContent = headerText;
		let maxWidth = span.getBoundingClientRect().width;

		// Cells
		span.style.fontWeight = tableStyle.fontWeight;
		for (const text of cellTexts) {
			span.textContent = text;
			maxWidth = Math.max(maxWidth, span.getBoundingClientRect().width);
		}

		document.body.removeChild(span);

		widthOverrides[colKey] = Math.max(40, Math.ceil(maxWidth) + 32);
	}

	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let sortedData = $derived.by(() => {
		if (!sortKey) return data;

		const sortColumn = activeColumns.find((c) => c.key === sortKey);

		return [...data].sort((a, b) => {
			const aVal = a[sortKey!];
			const bVal = b[sortKey!];

			let comparison = 0;

			// Use custom sort function if provided
			if (sortColumn?.sortCompareFn) {
				comparison = sortColumn.sortCompareFn(aVal as never, bVal as never);
			} else {
				return 0;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});

	function toggleSort(colKey: string) {
		if (sortKey === colKey) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = colKey;
			sortDirection = 'asc';
		}
	}
</script>

<div class="table-container" style="--borderColor:{borderColor}">
	<table bind:this={tableRef} style="width: {tableWidth}px">
		<thead>
			<tr>
				{#each activeColumns as col, index}
					<th style="width: {col.width}px">
						<div class="header-content">
							{#if col.sortCompareFn}
								<button class="header-main" onclick={() => toggleSort(col.key)}>
									<span class="truncate">{col.label}</span>
									{#if sortKey === col.key}
										<span class="sort-indicator">
											{sortDirection === 'asc' ? '↑' : '↓'}
										</span>
									{/if}
								</button>
							{:else}
								<div class="header-main">
									<span class="truncate">{col.label}</span>
								</div>
							{/if}
							<button
								class="resizer"
								onmousedown={(e) => onMouseDown(index, e)}
								ondblclick={() => onDoubleClick(index)}
								aria-label="Resize column"
							></button>
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedData as row}
				<tr id={rowKey ? `row-${row[rowKey]}` : ''}>
					{#each activeColumns as col}
						<td>
							{#if col.renderer}
								{@const Renderer = col.renderer}
								<Renderer
									{...col.rendererParameters}
									value={row[col.key]}
									onChange={(newVal: any) =>
										rowKey && onChange && onChange(row[rowKey], col.key, newVal)}
								/>
							{:else}
								<div class="spacer">
									{row[col.key]}
								</div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		height: 100%;
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--borderColor);
	}

	table {
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
	}

	th,
	td {
		border-bottom: 1px solid var(--borderColor);
		border-right: 1px solid var(--borderColor);
		text-align: left;
		white-space: nowrap;
		box-sizing: border-box;
	}

	td {
		overflow: hidden;
		text-overflow: ellipsis;
		height: 1px; /* Truque para ter descententes com 100% de altura */
	}

	th {
		font-weight: 600;
		position: relative;
		user-select: none;
		overflow: visible;
	}
	.spacer {
		padding: 8px 12px;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.header-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		width: 100%;
		overflow: hidden;
		background: transparent;
		border: none;
		font: inherit;
		color: inherit;
		text-align: left;
		padding: 8px 12px;
	}

	button.header-main {
		cursor: pointer;
		padding-right: 0;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
		flex: 1 1 0%;
	}

	.sort-indicator {
		font-size: 0.8em;
		line-height: 1;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.resizer {
		background: transparent;
		border: none;
		padding: 0;
		position: absolute;
		right: -5px;
		top: 0;
		height: 100%;
		width: 10px;
		cursor: col-resize;
		z-index: 10;
	}

	.resizer::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		--w: 4px;
		left: calc(50% - calc(var(--w) * 0.5));
		width: var(--w);
		background-color: transparent;
		transition: background-color 0.2s;
	}

	.resizer:hover::after,
	.resizer:active::after {
		background-color: var(--borderColor);
	}
</style>
