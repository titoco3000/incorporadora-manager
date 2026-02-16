<script lang="ts">
	export interface Column {
		key: string;
		label: string;
		width: number;
	}

	export interface RowData {
		[key: string]: any;
	}

	interface Props {
		data?: RowData[];
	}

	let { data = [] }: Props = $props();

	let columns = $state<Column[]>([
		{ key: 'id', label: 'ID', width: 100 },
		{ key: 'name', label: 'Name', width: 100 },
		{ key: 'email', label: 'Email', width: 100 },
		{ key: 'role', label: 'Role', width: 100 },
		{ key: 'status', label: 'Status', width: 100 }
	]);

	const tableData: RowData[] = data.length
		? data
		: [
				{ id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' },
				{ id: 2, name: 'Bob', email: 'bob@example.com', role: 'User', status: 'Inactive' },
				{ id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User', status: 'Active' }
			];

	let resizingIndex = $state<number>(-1);
	let startX = $state<number>(0);
	let startWidth = $state<number>(0);
	let tableRef: HTMLTableElement; // Added ref to get font styles

	let tableWidth = $derived(columns.reduce((sum, col) => sum + col.width, 0));

	function onMouseDown(index: number, e: MouseEvent) {
		resizingIndex = index;
		startX = e.clientX;
		startWidth = columns[index].width;

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function onMouseMove(e: MouseEvent) {
		if (resizingIndex === -1) return;

		const currentX = e.clientX;
		const diff = currentX - startX;

		columns[resizingIndex].width = Math.max(40, startWidth + diff);
	}

	function onMouseUp() {
		resizingIndex = -1;
		window.removeEventListener('mousemove', onMouseMove);
		window.removeEventListener('mouseup', onMouseUp);
	}

	function onDoubleClick(index: number) {
		if (!tableRef) return;

		const colKey = columns[index].key;
		const headerText = columns[index].label;
		const cellTexts = tableData.map((row) => String(row[colKey] ?? ''));

		// Create an off-screen span to measure text bounds accurately
		const span = document.createElement('span');
		span.style.visibility = 'hidden';
		span.style.position = 'absolute';
		span.style.whiteSpace = 'nowrap';

		// Inherit base font styles from the table
		const tableStyle = window.getComputedStyle(tableRef);
		span.style.fontFamily = tableStyle.fontFamily;
		span.style.fontSize = tableStyle.fontSize;
		span.style.letterSpacing = tableStyle.letterSpacing;

		document.body.appendChild(span);

		// Measure header (separated because of the bolder font-weight)
		span.style.fontWeight = '600';
		span.textContent = headerText;
		let maxWidth = span.getBoundingClientRect().width;

		// Measure all cells in the column
		span.style.fontWeight = tableStyle.fontWeight;
		for (const text of cellTexts) {
			span.textContent = text;
			maxWidth = Math.max(maxWidth, span.getBoundingClientRect().width);
		}

		document.body.removeChild(span);

		// Calculate final width: text width + 24px padding (12px * 2) + 8px breathing room
		columns[index].width = Math.max(40, Math.ceil(maxWidth) + 32);
	}
</script>

<div class="table-container">
	<table bind:this={tableRef} style="width: {tableWidth}px">
		<thead>
			<tr>
				{#each columns as col, index}
					<th style="width: {col.width}px">
						<div class="header-content">
							<span class="truncate">{col.label}</span>
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
			{#each tableData as row}
				<tr>
					{#each columns as col}
						<td>{row[col.key]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		width: 100%;
		overflow-x: auto;
		border: 1px solid #e5e7eb;
	}

	table {
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
	}

	th,
	td {
		border-bottom: 1px solid #e5e7eb;
		border-right: 1px solid #e5e7eb;
		padding: 8px 12px;
		text-align: left;
		white-space: nowrap;
		box-sizing: border-box;
	}

	td {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	th {
		font-weight: 600;
		position: relative;
		user-select: none;
		overflow: visible;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
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
		background-color: white;
	}
</style>
