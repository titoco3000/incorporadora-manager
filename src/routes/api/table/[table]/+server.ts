// src/routes/api/table/[table]/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { tableRegistry, type TableKey } from '$lib/table-config';
import { eq } from 'drizzle-orm';

export const PATCH = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const config = tableRegistry[params.table as TableKey];

    if (!config) return json({ error: 'Table not found' }, { status: 404 });

    // In Drizzle, config.model.id refers to the column definition
    await db.update(config.model)
      .set(updates)
      .where(eq(config.model.id, id));

    return json({ success: true });
  } catch (err: any) {
    return json({ success: false, error: err.message }, { status: 400 });
  }
};

export const DELETE = async ({ params, request }) => {
  try {
    const { id } = await request.json();
    const config = tableRegistry[params.table as TableKey];

    if (!config) return json({ error: 'Table not found' }, { status: 404 });

    // Fix: Using eq(table.id, id)
    await db.delete(config.model)
      .where(eq(config.model.id, id));

    return json({ success: true });
  } catch (err: any) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
};

export const POST = async ({ params, request }) => {
  try {
    const values = await request.json();
    const config = tableRegistry[params.table as TableKey];

    const result = await db.insert(config.model)
      .values(values)
      .returning();

    return json({ success: true, data: result[0] });
  } catch (err: any) {
    return json({ success: false, error: err.message }, { status: 400 });
  }
};

