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
    label: 'Imóveis',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'builtArea', label: 'Built Area', type: 'number' },
      { key: 'height', label: 'Height', type: 'number' }
    ]
  },
  companies: {
    model: schema.company,
    label: 'Empresas',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'cnpj', label: 'CNPJ', type: 'text' },
      { key: 'isSupplier', label: 'Supplier', type: 'boolean' }
    ]
  },
  contracts: {
    model: schema.contract,
    label: 'Contratos',
    columns: [
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'startValue', label: 'Value', type: 'number' },
      { key: 'expirationDate', label: 'Expires', type: 'date' }
    ]
  },
  contacts: {
    model: schema.contact,
    label: 'Contatos',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'companyId', label: 'Company', type: 'select' }
    ]
  },
  transactions: {
    model: schema.transaction,
    label: 'Transações',
    columns: [
      { key: 'transactionTypeId', label: 'Type', type: 'select' },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'companyId', label: 'Company', type: 'select' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'buildingId', label: 'Building', type: 'select' },
      { key: 'document', label: 'Document', type: 'text' }
    ]
  }
} as const;

export type TableKey = keyof typeof tableRegistry;
