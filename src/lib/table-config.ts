// src/lib/table-config.ts
import * as schema from '$lib/db/schema';
import { getTableColumns } from 'drizzle-orm';
import type { ColumnDef } from '$lib/types/table';

// Map foreign keys to their table names (you may need to adjust based on your schema)
const foreignKeyMap: Record<string, string> = {
  companyId: 'companies',
  buildingId: 'buildings',
  transactionTypeId: 'transaction-types',
  contractId: 'contracts'
};

// Helper to infer column type from Drizzle schema
function inferColumnType(key: string, column: any): ColumnDef['type'] {
  // Check if it's a foreign key
  if (key.endsWith('Id') && foreignKeyMap[key]) {
    return 'select';
  }
  
  const dataType = column.dataType;
  
  if (dataType === 'boolean') return 'boolean';
  if (dataType === 'date') return 'date';
  if (dataType === 'number' || column.columnType.includes('integer') || column.columnType.includes('numeric')) {
    return 'number';
  }
  
  return 'text';
}

function getDisplayName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/Id$/, '');
}

function autoGenerateColumns(model: any, labelOverrides: ColumnOverrides = {}): ColumnDef[] {
  const columns = getTableColumns(model);
  const columnDefs: ColumnDef[] = [];

  for (const [key, column] of Object.entries(columns)) {
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;

    const type = inferColumnType(key, column);
    
    const colDef: ColumnDef = {
      key,
      label: labelOverrides[key] || getDisplayName(key),
      type
    };

    if (type === 'select' && foreignKeyMap[key]) {
      colDef.reference = {
        foreignTable: foreignKeyMap[key],
        displayColumn: 'name'
      };
    }

    columnDefs.push(colDef);
  }

  return columnDefs;
}

type ColumnOverrides = Partial<Record<string, string>>;

export const tableRegistry = {
  'transaction-types': {
    model: schema.transactionType,
    label: 'Transaction Types',
    columns: autoGenerateColumns(schema.transactionType, {
      name: 'Nome',
      isExpense: 'É Gasto'
    })
  },
  buildings: {
    model: schema.building,
    label: 'Imóveis',
    columns: autoGenerateColumns(schema.building, {
      name: 'Nome',
      address: 'Endereço',
      iptuId: 'Nº IPTU',
      terrainArea: 'Área do Terreno (m²)',
      builtArea: 'Área Construída (m²)',
      insuranceInfo: 'Dados do Seguro',
      height: 'Altura (m)',
      floorWeightCapacity: 'Capacidade do piso (ton/m²)',
    })
  },
  companies: {
    model: schema.company,
    label: 'Empresas',
    columns: autoGenerateColumns(schema.company, {
      isSupplier: 'É Fornecedor?'
    })
  },
  contracts: {
    model: schema.contract,
    label: 'Contratos',
    columns: autoGenerateColumns(schema.contract, {
      startDate: 'Data de Início',
      startValue: 'Valor Inicial',
      expirationDate: 'Data de Expiração'
    })
  },
  contacts: {
    model: schema.contact,
    label: 'Contatos',
    columns: autoGenerateColumns(schema.contact, {
      companyId: 'Empresa'
    })
  },
  transactions: {
    model: schema.transaction,
    label: 'Transações',
    columns: autoGenerateColumns(schema.transaction, {
      transactionTypeId: 'Tipo',
      value: 'Valor',
      companyId: 'Empresa',
      date: 'Data',
      buildingId: 'Imóvel',
      document: 'Documento'
    })
  }
} as const;

export type TableKey = keyof typeof tableRegistry;