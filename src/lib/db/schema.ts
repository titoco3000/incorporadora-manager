// src/lib/db/schema.ts
import { pgTable, serial, text, boolean } from 'drizzle-orm/pg-core';

export const transactionType = pgTable('transaction_type', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  isExpense: boolean('is_expense').default(true).notNull(),
});