// src/routes/api/transaction-types/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { transactionType } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    const types = await db.select().from(transactionType);
    return json(types);
  } catch (error) {
    return json({ error: 'Failed to fetch transaction types' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const [newType] = await db.insert(transactionType).values(body).returning();
    return json(newType, { status: 201 });
  } catch (error) {
    return json({ error: 'Failed to create transaction type' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(transactionType)
      .set(data)
      .where(eq(transactionType.id, id))
      .returning();

    if (!updated) {
      return json({ error: 'Transaction type not found' }, { status: 404 });
    }

    return json(updated);
  } catch (error) {
    return json({ error: 'Failed to update transaction type' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(transactionType)
      .where(eq(transactionType.id, id))
      .returning();

    if (!deleted) {
      return json({ error: 'Transaction type not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete transaction type' }, { status: 500 });
  }
};