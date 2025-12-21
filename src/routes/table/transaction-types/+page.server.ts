import { db } from '$lib/db';
import { transactionType } from '$lib/db/schema';

export const load = async () => {
  const rows = await db.select().from(transactionType);
  return { rows };
};