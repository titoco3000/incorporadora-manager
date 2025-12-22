// src/lib/types/table.ts
export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select';
  reference?: {
    foreignTable: string;
    displayColumn?: string;
  };
}

export type RowData = Record<string, any>;