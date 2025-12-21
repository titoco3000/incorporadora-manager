import { db } from '$lib/db';
import { contract } from '$lib/db/schema';

export const load = async () => {
  const rows = await db.select().from(contract);
  return { rows };
};