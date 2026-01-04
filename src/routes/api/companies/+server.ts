// src/routes/api/companies/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { company } from '$lib/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const search = url.searchParams.get('search');
    const isSupplier = url.searchParams.get('isSupplier');
    const transactionTypeId = url.searchParams.get('transactionTypeId');

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(company.name, `%${search}%`),
          like(company.cnpj, `%${search}%`)
        )
      );
    }

    if (isSupplier !== null) {
      conditions.push(eq(company.isSupplier, isSupplier === 'true'));
    }

    if (transactionTypeId) {
      conditions.push(eq(company.transactionTypeId, parseInt(transactionTypeId)));
    }

    const companies = conditions.length > 0
      ? await db.select().from(company).where(and(...conditions))
      : await db.select().from(company);

    return json(companies);
  } catch (error) {
    return json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const [newCompany] = await db.insert(company).values(body).returning();
    return json(newCompany, { status: 201 });
  } catch (error) {
    return json({ error: 'Failed to create company' }, { status: 500 });
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
      .update(company)
      .set(data)
      .where(eq(company.id, id))
      .returning();

    if (!updated) {
      return json({ error: 'Company not found' }, { status: 404 });
    }

    return json(updated);
  } catch (error) {
    return json({ error: 'Failed to update company' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(company)
      .where(eq(company.id, id))
      .returning();

    if (!deleted) {
      return json({ error: 'Company not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete company' }, { status: 500 });
  }
};