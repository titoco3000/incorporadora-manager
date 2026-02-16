import type { Component } from 'svelte';

export interface ColumnDef {
	key: string;
	label: string;
	width?: number;
	renderer?: Component<{ value?: string; onChange?: (x: string) => void }>;
	sortCompareFn?: (a: never, b: never) => number;
}

export type RowData = Record<string, never>;
