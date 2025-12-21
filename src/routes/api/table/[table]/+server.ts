import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH = async ({ params, request }) => {
  const { id, field, value } = await request.json();
  const table = (schema as any)[params.table];

  await db.update(table)
    .set({ [field]: value })
    .where(eq(table.id, id));

  return json({ success: true });
};

export const DELETE = async ({ params, request }) => {
  const { id } = await request.json();
  const table = (schema as any)[params.table];

  await db.delete(table).where(eq(table.id, id));
  return json({ success: true });
};