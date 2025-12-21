import * as schema from '$lib/db/schema';

export const tableRegistry = {
  'transaction-types': {
    model: schema.transactionType,
    label: 'Transaction Types',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'isExpense', label: 'Is Expense', type: 'boolean' }
    ]
  },
  buildings: {
    model: schema.building,
    label: 'Buildings',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'builtArea', label: 'Built Area', type: 'number' },
      { key: 'height', label: 'Height', type: 'number' }
    ]
  },
  companies: {
    model: schema.company,
    label: 'Companies',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'cnpj', label: 'CNPJ', type: 'text' },
      { key: 'isSupplier', label: 'Supplier', type: 'boolean' }
    ]
  },
  contracts: {
    model: schema.contract,
    label: 'Contracts',
    columns: [
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'startValue', label: 'Value', type: 'number' },
      { key: 'expirationDate', label: 'Expires', type: 'date' }
    ]
  }
} as const;

export type TableKey = keyof typeof tableRegistry;
