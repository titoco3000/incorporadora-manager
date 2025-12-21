import { db } from '$lib/db';
import { company } from '$lib/db/schema';

export const load = async () => {
  const rows = await db.select().from(company);
  return { rows };
};