import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { building } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { recordHistory } from '$lib/history';

export const GET: RequestHandler = async () => {
	try {
		const buildings = await db.select().from(building);
		return json(buildings);
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to fetch buildings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();
		const [newBuilding] = await db.insert(building).values(body).returning();

		await recordHistory({
			userId,
			action: 'CREATE',
			tableName: 'building',
			rowId: newBuilding.id,
			changes: { after: newBuilding },
			description: `Imóvel '${newBuilding.name}' criado`
		});

		return json(newBuilding, { status: 201 });
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to create building' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();
		const { id, ...data } = body;

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [oldBuilding] = await db.select().from(building).where(eq(building.id, id));
		if (!oldBuilding) {
			return json({ error: 'Building not found' }, { status: 404 });
		}

		const [updated] = await db.update(building).set(data).where(eq(building.id, id)).returning();

		if (!updated) {
			return json({ error: 'Building not found' }, { status: 404 });
		}

		await recordHistory({
			userId,
			action: 'UPDATE',
			tableName: 'building',
			rowId: id,
			changes: { before: oldBuilding, after: updated },
			description: `Imóvel '${updated.name}' atualizado`
		});

		return json(updated);
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to update building' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'ID is required' }, { status: 400 });
		}

		const [oldBuilding] = await db.select().from(building).where(eq(building.id, id));
		if (!oldBuilding) {
			return json({ error: 'Building not found' }, { status: 404 });
		}

		const [deleted] = await db.delete(building).where(eq(building.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Building not found' }, { status: 404 });
		}

		await recordHistory({
			userId,
			action: 'DELETE',
			tableName: 'building',
			rowId: id,
			changes: { before: oldBuilding },
			description: `Imóvel '${oldBuilding.name}' removido`
		});

		return json({ success: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to delete building' }, { status: 500 });
	}
};
