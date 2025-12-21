import { db } from '$lib/db';
import { contact } from '$lib/db/schema';

export const load = async () => {
  const rows = await db.select().from(contact);
  return { rows };
};