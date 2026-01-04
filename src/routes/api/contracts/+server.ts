// src/routes/api/contracts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { contract } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    const contracts = await db.select().from(contract);
    return json(contracts);
  } catch (error) {
    return json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const [newContract] = await db.insert(contract).values(body).returning();
    return json(newContract, { status: 201 });
  } catch (error) {
    return json({ error: 'Failed to create contract' }, { status: 500 });
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
      .update(contract)
      .set(data)
      .where(eq(contract.id, id))
      .returning();

    if (!updated) {
      return json({ error: 'Contract not found' }, { status: 404 });
    }

    return json(updated);
  } catch (error) {
    return json({ error: 'Failed to update contract' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(contract)
      .where(eq(contract.id, id))
      .returning();

    if (!deleted) {
      return json({ error: 'Contract not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete contract' }, { status: 500 });
  }
};