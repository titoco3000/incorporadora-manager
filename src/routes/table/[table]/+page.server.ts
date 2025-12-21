import { db } from '$lib/db';
import { tableRegistry } from '$lib/table-config';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  const config = tableRegistry[params.table];
  if (!config) throw error(404, 'Table not found');

  const rows = await db.select().from(config.model);
  
  return {
    rows,
    columns: config.columns,
    label: config.label,
    tableSlug: params.table
  };
};