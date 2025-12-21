import * as schema from '$lib/db/schema';

export type ColumnType = 'text' | 'number' | 'boolean' | 'date';

export interface TableMeta {
  schema: any;
  label: string;
  columns: { key: string; label: string; type: ColumnType }[];
}

export const TABLES: Record<string, TableMeta> = {
  'transaction-types': {
    schema: schema.transactionType,
    label: 'Transaction Types',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'isExpense', label: 'Is Expense?', type: 'boolean' }
    ]
  },
  'buildings': {
    schema: schema.building,
    label: 'Buildings',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'iptuId', label: 'IPTU ID', type: 'text' },
      { key: 'terrainArea', label: 'Terrain Area', type: 'number' },
      { key: 'builtArea', label: 'Built Area', type: 'number' },
      { key: 'floorWeightCapacity', label: 'Floor Weight', type: 'number' },
      { key: 'height', label: 'Height', type: 'number' }
    ]
  },
  'companies': {
    schema: schema.company,
    label: 'Companies',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'cnpj', label: 'CNPJ', type: 'text' },
      { key: 'isSupplier', label: 'Supplier?', type: 'boolean' },
      { key: 'hqAddress', label: 'HQ Address', type: 'text' }
    ]
  },
  'contracts': {
    schema: schema.contract,
    label: 'Contracts',
    columns: [
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'expirationDate', label: 'Expiration', type: 'date' },
      { key: 'startValue', label: 'Value', type: 'number' }
    ]
  },
  'contacts': {
    schema: schema.contact,
    label: 'Contacts',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' }
    ]
  }
};