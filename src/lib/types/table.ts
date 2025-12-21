export type ColumnType = 'text' | 'number' | 'boolean' | 'date';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
}

export interface RowData {
  id: number | string;
  [key: string]: unknown;
}
