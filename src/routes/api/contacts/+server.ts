// src/routes/api/contacts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { contact } from '$lib/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const search = url.searchParams.get('search');
    const companyId = url.searchParams.get('companyId');

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(contact.name, `%${search}%`),
          like(contact.email, `%${search}%`),
          like(contact.phone, `%${search}%`)
        )
      );
    }

    if (companyId) {
      conditions.push(eq(contact.companyId, parseInt(companyId)));
    }

    const contacts = conditions.length > 0
      ? await db.select().from(contact).where(and(...conditions))
      : await db.select().from(contact);

    return json(contacts);
  } catch (error) {
    return json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const [newContact] = await db.insert(contact).values(body).returning();
    return json(newContact, { status: 201 });
  } catch (error) {
    return json({ error: 'Failed to create contact' }, { status: 500 });
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
      .update(contact)
      .set(data)
      .where(eq(contact.id, id))
      .returning();

    if (!updated) {
      return json({ error: 'Contact not found' }, { status: 404 });
    }

    return json(updated);
  } catch (error) {
    return json({ error: 'Failed to update contact' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(contact)
      .where(eq(contact.id, id))
      .returning();

    if (!deleted) {
      return json({ error: 'Contact not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete contact' }, { status: 500 });
  }
};