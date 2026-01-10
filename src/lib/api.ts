//src/lib/api.ts
import type {
    TransactionType, Building, Company, Contract, Contact, Transaction
} from '$lib/types/api';

const cache = new Map<string, any>();

async function apiFetch(path: string, method = 'GET', body?: any) {
    // Return cached data for unfiltered GETs
    if (method === 'GET' && !path.includes('?') && cache.has(path)) {
        return cache.get(path);
    }

    const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) throw new Error(await res.text());

    // Some DELETE responses might be empty (204 No Content)
    if (res.status === 204) return null;
    const data = await res.json();

    if (method === 'GET' && !path.includes('?')) {
        cache.set(path, data);
    } else if (method !== 'GET') {
        console.log("Invalidate cache on mutations")
        cache.delete(path.split('?')[0]);
    }

    return data;
}

export const api = {
    transactionTypes: {
        get: (): Promise<TransactionType[]> => apiFetch('/api/transaction-types'),
        post: (data: Omit<TransactionType, 'id'>) => apiFetch('/api/transaction-types', 'POST', data),
        patch: (id: number, data: Partial<Omit<TransactionType, 'id'>>) => apiFetch('/api/transaction-types', 'PATCH', { id, ...data }),
        delete: (id: number) => apiFetch('/api/transaction-types', 'DELETE', { id }),
    },
    buildings: {
        get: (): Promise<Building[]> => apiFetch('/api/buildings'),
        post: (data: Omit<Building, 'id'>) => apiFetch('/api/buildings', 'POST', data),
        patch: (id: number, data: Partial<Omit<Building, 'id'>>) => apiFetch('/api/buildings', 'PATCH', { id, ...data }),
        delete: (id: number) => apiFetch('/api/buildings', 'DELETE', { id })
    },
    companies: {
        get: (filters?: { isSupplier?: boolean, transactionTypeId?: number, search?: string }): Promise<Company[]> => {
            const params = new URLSearchParams(filters as any).toString();
            return apiFetch(`/api/companies${params ? `?${params}` : ''}`);
        },
        post: (data: Omit<Company, 'id'>) => apiFetch('/api/companies', 'POST', data),
        patch: (id: number, data: Partial<Omit<Company, 'id'>>) => apiFetch('/api/companies', 'PATCH', { id, ...data }),
        delete: (id: number) => apiFetch('/api/companies', 'DELETE', { id })
    },
    contacts: {
        get: (filters?: { companyId?: number, search?: string }): Promise<Contact[]> => {
            const params = new URLSearchParams(filters as any).toString();
            return apiFetch(`/api/contacts${params ? `?${params}` : ''}`);
        },
        post: (data: Omit<Contact, 'id'>) => apiFetch('/api/contacts', 'POST', data),
        patch: (id: number, data: Partial<Omit<Contact, 'id'>>) => apiFetch('/api/contacts', 'PATCH', { id, ...data }),
        delete: (id: number) => apiFetch('/api/contacts', 'DELETE', { id })
    },
    contracts: {
        get: (): Promise<Contract[]> => apiFetch('/api/contracts'),
        post: (data: Omit<Contract, 'id'>) => apiFetch('/api/contracts', 'POST', data),
        patch: (id: number, data: Partial<Omit<Contract, 'id'>>) => apiFetch('/api/contracts', 'PATCH', { id, ...data }),
        delete: (id: number) => apiFetch('/api/contracts', 'DELETE', { id })
    },
    transactions: {
        get: (filters?: Partial<Transaction>): Promise<Transaction[]> => {
            const params = new URLSearchParams(filters as any).toString();
            return apiFetch(`/api/transactions${params ? `?${params}` : ''}`);
        },
        post: (data: Omit<Transaction, 'id'>) => apiFetch('/api/transactions', 'POST', data),
        patch: (id: number, data: Partial<Omit<Transaction, 'id'>>) => apiFetch('/api/transactions', 'PATCH', { id, ...data }),
        delete: (id: number) => apiFetch('/api/transactions', 'DELETE', { id })
    }
};