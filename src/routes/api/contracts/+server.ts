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
		function ParseDateBR(value: string): string {
			const [day, month, year] = value.split('/').map(Number);
			const date = new Date(year, month - 1, day);

			if (date.toString() === 'Invalid Date') throw new Error('invalid date');

			return date.toISOString().slice(0, 10).toString();
		}

		// Make convertions
		const startDate = ParseDateBR(body.startDate);
		const expirationDate = ParseDateBR(body.startDate);
		const payload = {
			buildingId: Number(body.buildingId),
      companyId: Number(body.companyId),
			expirationDate,
      startDate,
			obs: body.obs ?? null,
			startValue: body.startValue.toString(),
		};
    const [newContract] = await db.insert(contract).values(payload).returning();
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