import { db } from '$lib/db';
import { transactionType } from '$lib/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const types = await db.query.transactionType.findMany();
  return { types };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const isExpense = data.get('isExpense') === 'on';

    await db.insert(transactionType).values({ name, isExpense });
    return { success: true };
  }
};