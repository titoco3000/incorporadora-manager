import type { Component } from 'svelte';

export interface ColumnDef<Props extends Record<string, unknown> = Record<string, unknown>> {
	key: string;
	label: string;
	width?: number;
	renderer?: Component<Props>;
	rendererParameters?: Omit<Props, 'value' | 'onChange'>;
	sortCompareFn?: (a: never, b: never) => number;
}

export type RowData = Record<string, never>;
