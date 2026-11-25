// The API: Hono app, run as a Lambda behind CloudFront (/api/*) and locally by api/dev.ts.
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, like, or } from 'drizzle-orm';
import * as schema from './db/schema.ts';
import { verifyToken } from './auth.ts';
import { crud } from './routes/crud.ts';
import auth from './routes/auth.ts';
import transactions from './routes/transactions.ts';
import table from './routes/table.ts';
import history from './routes/history.ts';
import pages from './routes/pages.ts';
import type { Env } from './env.ts';

const { company, contact } = schema;

export const app = new Hono<Env>().basePath('/api');

// Same as the old hooks.server.ts: token from the cookie (or a Bearer header) → user.
// Everything outside /api/auth/* requires a logged-in user.
app.use('*', async (c, next) => {
	const header = c.req.header('authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : getCookie(c, 'token');
	c.set('user', token ? await verifyToken(token) : null);
	if (!c.req.path.startsWith('/api/auth/') && !c.get('user')) {
		return c.json({ error: 'Not authenticated' }, 401);
	}
	await next();
});

const companySearch = (q: (k: string) => string | undefined) => {
	const conditions = [];
	const search = q('search');
	if (search) {
		conditions.push(or(like(company.name, `%${search}%`), like(company.cnpj, `%${search}%`))!);
	}
	if (q('transactionTypeId')) {
		conditions.push(eq(company.transactionTypeId, parseInt(q('transactionTypeId')!)));
	}
	return conditions;
};

app.route('/auth', auth);
app.route('/transactions', transactions);
app.route('/table', table);
app.route('/history', history);
app.route('/', pages);

app.route(
	'/buildings',
	crud({
		table: schema.building,
		tableName: 'building',
		noun: 'building',
		describe: {
			create: (r) => `Imóvel '${r.name}' criado`,
			update: (r) => `Imóvel '${r.name}' atualizado`,
			delete: (r) => `Imóvel '${r.name}' removido`
		}
	})
);
app.route(
	'/transaction-types',
	crud({
		table: schema.transactionType,
		tableName: 'transaction_type',
		noun: 'transaction type',
		describe: {
			create: (r) => `Tipo de transação '${r.name}' criado`,
			update: (r) => `Tipo de transação '${r.name}' atualizado`,
			delete: (r) => `Tipo de transação '${r.name}' removido`
		}
	})
);
app.route(
	'/contracts',
	crud({
		table: schema.contract,
		tableName: 'contract',
		noun: 'contract',
		describe: {
			create: (r) => `Contrato #${r.id} criado`,
			update: (r) => `Contrato #${r.id} atualizado`,
			delete: (r) => `Contrato #${r.id} removido`
		}
	})
);
app.route(
	'/contacts',
	crud({
		table: contact,
		tableName: 'contact',
		noun: 'contact',
		describe: {
			create: (r) => `Contato '${r.name}' criado`,
			update: (r) => `Contato '${r.name}' atualizado`,
			delete: (r) => `Contato '${r.name}' removido`
		},
		filters: (q) => {
			const conditions = [];
			const search = q('search');
			if (search) {
				conditions.push(
					or(
						like(contact.name, `%${search}%`),
						like(contact.email, `%${search}%`),
						like(contact.phone, `%${search}%`)
					)!
				);
			}
			if (q('companyId')) conditions.push(eq(contact.companyId, parseInt(q('companyId')!)));
			return conditions;
		}
	})
);
app.route(
	'/companies',
	crud({
		table: company,
		tableName: 'company',
		noun: 'company',
		describe: {
			create: (r) => `Empresa '${r.name}' criada`,
			update: (r) => `Empresa '${r.name}' atualizada`,
			delete: (r) => `Empresa '${r.name}' removida`
		},
		filters: (q) => {
			const conditions = companySearch(q);
			if (q('isSupplier') !== undefined) {
				conditions.push(eq(company.isSupplier, q('isSupplier') === 'true'));
			}
			if (q('isClient') !== undefined) {
				conditions.push(eq(company.isClient, q('isClient') === 'true'));
			}
			return conditions;
		}
	})
);
app.route(
	'/clients',
	crud({
		table: company,
		tableName: 'company',
		noun: 'company',
		describe: {
			create: (r) => `Cliente '${r.name}' criado`,
			update: (r) => `Cliente '${r.name}' atualizado`,
			delete: (r) => `Cliente '${r.name}' removido`
		},
		filters: (q) => [eq(company.isClient, true), ...companySearch(q)]
	})
);
app.route(
	'/suppliers',
	crud({
		table: company,
		tableName: 'company',
		noun: 'company',
		describe: {
			create: (r) => `Fornecedor '${r.name}' criado`,
			update: (r) => `Fornecedor '${r.name}' atualizado`,
			delete: (r) => `Fornecedor '${r.name}' removido`
		},
		filters: (q) => [eq(company.isSupplier, true), ...companySearch(q)]
	})
);

app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((err, c) => {
	console.error(err);
	return c.json({ error: 'internal error' }, 500);
});
