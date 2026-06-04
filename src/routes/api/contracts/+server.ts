import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { contract } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { recordHistory } from '$lib/history';

export const GET: RequestHandler = async () => {
	try {
		const contracts = await db.select().from(contract);
		return json(contracts);
	} catch (error) {
		return json({ error: 'Failed to fetch contracts' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const body = await request.json();
		const [newContract] = await db.insert(contract).values(body).returning();

		await recordHistory({
			userId,
			action: 'CREATE',
			tableName: 'contract',
			rowId: newContract.id,
			changes: { after: newContract },
			description: `Contrato #${newContract.id} criado`
		});

		return json(newContract, { status: 201 });
	} catch (error) {
		return json({ error: 'Failed to create contract' }, { status: 500 });
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

		const [oldContract] = await db.select().from(contract).where(eq(contract.id, id));
		if (!oldContract) {
			return json({ error: 'Contract not found' }, { status: 404 });
		}

		const [updated] = await db.update(contract).set(data).where(eq(contract.id, id)).returning();

		if (!updated) {
			return json({ error: 'Contract not found' }, { status: 404 });
		}

		await recordHistory({
			userId,
			action: 'UPDATE',
			tableName: 'contract',
			rowId: id,
			changes: { before: oldContract, after: updated },
			description: `Contrato #${id} atualizado`
		});

		return json(updated);
	} catch (error) {
		return json({ error: 'Failed to update contract' }, { status: 500 });
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

		const [oldContract] = await db.select().from(contract).where(eq(contract.id, id));
		if (!oldContract) {
			return json({ error: 'Contract not found' }, { status: 404 });
		}

		const [deleted] = await db.delete(contract).where(eq(contract.id, id)).returning();

		if (!deleted) {
			return json({ error: 'Contract not found' }, { status: 404 });
		}

		await recordHistory({
			userId,
			action: 'DELETE',
			tableName: 'contract',
			rowId: id,
			changes: { before: oldContract },
			description: `Contrato #${id} removido`
		});

		return json({ success: true });
	} catch (error) {
		return json({ error: 'Failed to delete contract' }, { status: 500 });
	}
};
