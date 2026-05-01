//src/lib/db/schema.ts
import {
	pgTable,
	serial,
	text,
	boolean,
	integer,
	date,
	numeric,
	unique
} from 'drizzle-orm/pg-core';

export const transactionType = pgTable('transaction_type', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	isExpense: boolean('is_expense').default(true).notNull()
});

export const building = pgTable('building', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	address: text('address').notNull(),
	iptuId: text('iptu_id'),
	insuranceInfo: text('insurance_info'),
	characteristics: text('characteristics'),
	obs: text('obs')
});

export const company = pgTable('company', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	cnpj: text('cnpj'),
	hqAddress: text('hq_address'),
	stateId: text('state_id'),
	municipalityId: text('municipality_id'),
	transactionTypeId: integer('transaction_type_id').references(() => transactionType.id),
	isSupplier: boolean('is_supplier').default(false).notNull(),
	isClient: boolean('is_client').default(false).notNull(),
	obs: text('obs')
});

export const contract = pgTable('contract', {
	id: serial('id').primaryKey(),
	startDate: date('start_date').notNull(),
	buildingId: integer('building_id')
		.references(() => building.id)
		.notNull(),
	companyId: integer('company_id')
		.references(() => company.id)
		.notNull(),
	startValue: numeric('start_value', { precision: 12, scale: 2 }),
	expirationDate: date('expiration_date'),
	obs: text('obs')
});

export const contact = pgTable('contact', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	role: text('role'),
	companyId: integer('company_id')
		.references(() => company.id)
		.notNull(),
	obs: text('obs')
});

export const transaction = pgTable(
	'transaction',
	{
		id: serial('id').primaryKey(),
		transactionTypeId: integer('transaction_type_id')
			.references(() => transactionType.id)
			.notNull(),
		value: numeric('value', { precision: 12, scale: 2 }).notNull(),
		companyId: integer('company_id')
			.references(() => company.id)
			.notNull(),
		date: date('date').notNull(),
		buildingId: integer('building_id').references(() => building.id),
		document: text('document'),
		obs: text('obs')
	},
	(t) => ({
		// Define the multi-column unique constraint here
		unq: unique('document_company_unique').on(t.document, t.companyId)
	})
);
