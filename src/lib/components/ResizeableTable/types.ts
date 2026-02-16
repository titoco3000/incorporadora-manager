export interface ColumnDef {
	key: string;
	label: string;
	width?: number;
	type?: string;
	sortable?: boolean;
}

export interface CustomTypeDef {
	renderer?: undefined;
	sortCompareFn?: ((a: never, b: never) => number) | undefined;
}

export type RowData = Record<string, never>;
