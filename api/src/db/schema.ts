// Database schema. Shared by the API, the migrations (drizzle-kit generate) and the copy script.
// Aurora DSQL has no `serial`: ids are identity columns, which DSQL requires to be bigint
// (references are bigint too). mode 'number': JS numbers, not strings, like before.
// CACHE 1 keeps ids sequential (DSQL accepts only 1 or >= 65536). BY DEFAULT (not ALWAYS) so undo and the copy
// script can insert rows with their original id.
import {
	pgTable,
	text,
	boolean,
	bigint,
	date,
	numeric,
	unique,
	timestamp,
	jsonb
} from 'drizzle-orm/pg-core';

const int = (name: string) => bigint(name, { mode: 'number' });
const id = () => int('id').primaryKey().generatedByDefaultAsIdentity({ cache: 1 });

export const transactionType = pgTable('transaction_type', {
	id: id(),
	name: text('name').notNull(),
	isExpense: boolean('is_expense').default(true).notNull()
});

export const building = pgTable('building', {
	id: id(),
	name: text('name').notNull().unique(),
	address: text('address').notNull(),
	iptuId: text('iptu_id'),
	insuranceInfo: text('insurance_info'),
	characteristics: text('characteristics'),
	obs: text('obs')
});

export const company = pgTable('company', {
	id: id(),
	name: text('name').notNull().unique(),
	cnpj: text('cnpj'),
	hqAddress: text('hq_address'),
	stateId: text('state_id'),
	municipalityId: text('municipality_id'),
	transactionTypeId: int('transaction_type_id').references(() => transactionType.id),
	isSupplier: boolean('is_supplier').default(false).notNull(),
	isClient: boolean('is_client').default(false).notNull(),
	obs: text('obs')
});

export const contract = pgTable('contract', {
	id: id(),
	startDate: date('start_date').notNull(),
	buildingId: int('building_id')
		.references(() => building.id)
		.notNull(),
	companyId: int('company_id')
		.references(() => company.id)
		.notNull(),
	startValue: numeric('start_value', { precision: 12, scale: 2 }),
	expirationDate: date('expiration_date'),
	obs: text('obs')
});

export const contact = pgTable('contact', {
	id: id(),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	role: text('role'),
	companyId: int('company_id')
		.references(() => company.id)
		.notNull(),
	obs: text('obs')
});

export const user = pgTable('user', {
	id: id(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	googleId: text('google_id'),
	name: text('name'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const whitelistEntry = pgTable('whitelist_entry', {
	id: id(),
	email: text('email').notNull().unique(),
	addedById: int('added_by_id').references(() => user.id),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const historyEntry = pgTable('history_entry', {
	id: id(),
	userId: int('user_id')
		.references(() => user.id)
		.notNull(),
	action: text('action').notNull(),
	tableName: text('table_name').notNull(),
	rowId: int('row_id').notNull(),
	changes: jsonb('changes'),
	description: text('description').notNull(),
	undoneByUserId: int('undone_by_user_id').references(() => user.id),
	undoneAt: timestamp('undone_at'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const transaction = pgTable(
	'transaction',
	{
		id: id(),
		transactionTypeId: int('transaction_type_id')
			.references(() => transactionType.id)
			.notNull(),
		value: numeric('value', { precision: 12, scale: 2 }).notNull(),
		companyId: int('company_id')
			.references(() => company.id)
			.notNull(),
		date: date('date').notNull(),
		buildingId: int('building_id').references(() => building.id),
		document: text('document'),
		obs: text('obs')
	},
	(t) => [unique('document_company_unique').on(t.document, t.companyId)]
);
