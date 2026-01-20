// src/routes/table/[table]/+page.server.ts
import { db } from '$lib/db';
import { tableRegistry, type TableKey } from '$lib/table-config';
import { error } from '@sveltejs/kit';

// Map table slugs to their models for lookups
const tableModels: Record<string, any> = {
  'transaction-types': tableRegistry['transaction-types'].model,
  transactions: tableRegistry.transactions.model
};

export const load = async ({ params }) => {
  const config = tableRegistry['transactions' as TableKey];
  if (!config) throw error(404, 'Table not found');

  const rows = await db.select().from(config.model);
  
  // Load reference data for foreign key dropdowns
  const referenceData: Record<string, any[]> = {};
  
  for (const col of config.columns) {
    if (col.type === 'select' && col.reference) {
      // Determine which table this references
      const refTableName = col.reference.foreignTable;
      const refModel = tableModels[refTableName];
      
      if (refModel) {
        const refRows = await db.select().from(refModel);
        referenceData[col.key] = refRows;
      }
    }
  }
  
  return {
    rows,
    columns: config.columns,
    label: config.label,
    tableSlug: 'transactions',
    referenceData
  };
};