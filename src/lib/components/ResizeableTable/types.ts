export interface ColumnDef {
	key: string;
	label: string;
	width?: number;
	renderer?: undefined;
	sortCompareFn?: ((a: never, b: never) => number) | undefined;
}

export type RowData = Record<string, never>;
