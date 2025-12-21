import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { error } from '@sveltejs/kit';

export const load = async () => {
  try {
    const buildings = await db.select().from(schema.building);
    const companies = await db.select().from(schema.company);
    const transactionTypes = await db.select().from(schema.transactionType);

    return {
      buildings,
      companies,
      transactionTypes
    };
  } catch (err) {
    throw error(500, "Could not load data for forms");
  }
};