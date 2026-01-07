import { writable, type Writable } from 'svelte/store';

interface CacheEntry<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

type CacheStore = Record<string, CacheEntry<any>>;

const cache: Writable<CacheStore> = writable({});

const pendingRequests = new Map<string, Promise<any>>();

export async function fetchCached<T>(endpoint: string): Promise<T> {
    let currentCache: CacheStore = {};
    const unsubscribe = cache.subscribe(c => currentCache = c);
    unsubscribe();
    
    if (currentCache[endpoint]?.data) {
        return currentCache[endpoint].data as T;
    }
    
    if (pendingRequests.has(endpoint)) {
        return pendingRequests.get(endpoint) as Promise<T>;
    }
    
    cache.update(c => ({
        ...c,
        [endpoint]: { data: null, loading: true, error: null }
    }));
    
    const requestPromise = fetch(endpoint)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then((data: T) => {
            cache.update(c => ({
                ...c,
                [endpoint]: { data, loading: false, error: null }
            }));
            pendingRequests.delete(endpoint);
            return data;
        })
        .catch((error: Error) => {
            cache.update(c => ({
                ...c,
                [endpoint]: { data: null, loading: false, error: error.message }
            }));
            pendingRequests.delete(endpoint);
            throw error;
        });
    
    pendingRequests.set(endpoint, requestPromise);
    return requestPromise as Promise<T>;
}

export function getCacheStore(): Writable<CacheStore> {
    return cache;
}

export function clearCache(endpoint?: string): void {
    if (endpoint) {
        cache.update(c => {
            const newCache = { ...c };
            delete newCache[endpoint];
            return newCache;
        });
    } else {
        cache.set({});
    }
}