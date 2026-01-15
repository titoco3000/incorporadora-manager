// src/routes/table/[table]/+page.server.ts
import { db } from '$lib/db';
import { tableRegistry, type TableKey } from '$lib/table-config';
import { error } from '@sveltejs/kit';

// Map table slugs to their models for lookups
const tableModels: Record<string, any> = {
  companies: tableRegistry.companies.model,
  buildings: tableRegistry.buildings.model,
  'transaction-types': tableRegistry['transaction-types'].model,
  contracts: tableRegistry.contracts.model,
  contacts: tableRegistry.contacts.model,
  transactions: tableRegistry.transactions.model
};

export const load = async ({ params }) => {
  const config = tableRegistry[params.table as TableKey];
  if (!config) throw error(404, 'Table not found');

  const rows = await db.select().from(config.model);
  
  // Load reference data for foreign key dropdowns
  const referenceData: Record<string, any[]> = {};
  
  let i: number = 0;
  for (const col of config.columns) {
    if (col.label === "Data") config.columns[i].type = "date"; 

    if (col.type === 'select' && col.reference) {
      // Determine which table this references
      const refTableName = col.reference.foreignTable;
      const refModel = tableModels[refTableName];
      
      if (refModel) {
        const refRows = await db.select().from(refModel);
        referenceData[col.key] = refRows;
      }
    }
    i++;
  }
  
  return {
    rows,
    columns: config.columns,
    label: config.label,
    tableSlug: params.table,
    referenceData
  };
};