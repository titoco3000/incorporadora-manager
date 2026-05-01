// src/lib/api.ts
import type {
	TransactionType,
	Building,
	Company,
	Contract,
	Contact,
	Transaction
} from '$lib/types/api';

const cache = new Map<string, Promise<any>>();

async function apiFetch(path: string, method = 'GET', body?: any) {
	const isCacheableGet = method === 'GET' && !path.includes('?');

	if (isCacheableGet && cache.has(path)) {
		return cache.get(path);
	}

	const requestPromise = (async () => {
		const res = await fetch(path, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: body ? JSON.stringify(body) : undefined
		});

		if (!res.ok) {
			if (isCacheableGet) cache.delete(path);
			const text = await res.text();
			let message = text;
			try {
				const body = JSON.parse(text);
				if (body.error) message = body.error;
			} catch { /* not JSON */ }
			throw new Error(message);
		}

		if (res.status === 204) return null;
		return await res.json();
	})();

	if (isCacheableGet) {
		cache.set(path, requestPromise);
	} else if (method !== 'GET') {
		console.log('Invalidate cache on mutations');
		cache.delete(path.split('?')[0]);
	}

	return requestPromise;
}

export const api = {
	transactionTypes: {
		get: (): Promise<TransactionType[]> => apiFetch('/api/transaction-types'),
		post: (data: Omit<TransactionType, 'id'>) => apiFetch('/api/transaction-types', 'POST', data),
		patch: (id: number, data: Partial<Omit<TransactionType, 'id'>>) =>
			apiFetch('/api/transaction-types', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/transaction-types', 'DELETE', { id })
	},
	buildings: {
		get: (): Promise<Building[]> => apiFetch('/api/buildings'),
		post: (data: Omit<Building, 'id'>) => apiFetch('/api/buildings', 'POST', data),
		patch: (id: number, data: Partial<Omit<Building, 'id'>>) =>
			apiFetch('/api/buildings', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/buildings', 'DELETE', { id })
	},
	companies: {
		get: (filters?: {
			isSupplier?: boolean;
			isClient?: boolean;
			transactionTypeId?: number;
			search?: string;
		}): Promise<Company[]> => {
			const params = new URLSearchParams(filters as any).toString();
			return apiFetch(`/api/companies${params ? `?${params}` : ''}`);
		},
		post: (data: Omit<Company, 'id'>) => apiFetch('/api/companies', 'POST', data),
		patch: (id: number, data: Partial<Omit<Company, 'id'>>) =>
			apiFetch('/api/companies', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/companies', 'DELETE', { id })
	},
	clients: {
		get: (filters?: { transactionTypeId?: number; search?: string }): Promise<Company[]> => {
			const params = new URLSearchParams(filters as any).toString();
			return apiFetch(`/api/clients${params ? `?${params}` : ''}`);
		},
		post: (data: Omit<Company, 'id'>) => apiFetch('/api/clients', 'POST', data),
		patch: (id: number, data: Partial<Omit<Company, 'id'>>) =>
			apiFetch('/api/clients', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/clients', 'DELETE', { id })
	},
	suppliers: {
		get: (filters?: { transactionTypeId?: number; search?: string }): Promise<Company[]> => {
			const params = new URLSearchParams(filters as any).toString();
			return apiFetch(`/api/suppliers${params ? `?${params}` : ''}`);
		},
		post: (data: Omit<Company, 'id'>) => apiFetch('/api/suppliers', 'POST', data),
		patch: (id: number, data: Partial<Omit<Company, 'id'>>) =>
			apiFetch('/api/suppliers', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/suppliers', 'DELETE', { id })
	},
	contacts: {
		get: (filters?: { companyId?: number; search?: string }): Promise<Contact[]> => {
			const params = new URLSearchParams(filters as any).toString();
			return apiFetch(`/api/contacts${params ? `?${params}` : ''}`);
		},
		post: (data: Omit<Contact, 'id'>) => apiFetch('/api/contacts', 'POST', data),
		patch: (id: number, data: Partial<Omit<Contact, 'id'>>) =>
			apiFetch('/api/contacts', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/contacts', 'DELETE', { id })
	},
	contracts: {
		get: (): Promise<Contract[]> => apiFetch('/api/contracts'),
		post: (data: Omit<Contract, 'id'>) => apiFetch('/api/contracts', 'POST', data),
		patch: (id: number, data: Partial<Omit<Contract, 'id'>>) =>
			apiFetch('/api/contracts', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/contracts', 'DELETE', { id })
	},
	transactions: {
		get: (filters?: Partial<Transaction>): Promise<Transaction[]> => {
			const params = new URLSearchParams(filters as any).toString();
			return apiFetch(`/api/transactions${params ? `?${params}` : ''}`);
		},
		post: (data: Omit<Transaction, 'id'>) => apiFetch('/api/transactions', 'POST', data),
		patch: (id: number, data: Partial<Omit<Transaction, 'id'>>) =>
			apiFetch('/api/transactions', 'PATCH', { id, ...data }),
		delete: (id: number) => apiFetch('/api/transactions', 'DELETE', { id })
	}
};
