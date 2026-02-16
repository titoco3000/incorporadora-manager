import type { Component } from 'svelte';

export interface ColumnDef {
	key: string;
	label: string;
	width?: number;
	renderer?: Component<any>;
	sortCompareFn?: (a: never, b: never) => number;
}

export type RowData = Record<string, never>;
