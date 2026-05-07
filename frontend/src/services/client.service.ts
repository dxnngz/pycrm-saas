import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Client, PaginatedResponse } from '../types';

export const clientService = {
    getAll: (options: { limit?: number; search?: string; cursor?: number } = {}): Promise<PaginatedResponse<Client> & { nextCursor?: number | null; hasMore?: boolean }> => {
        const limit = options.limit ?? 10;
        const search = options.search ?? '';
        const cursor = options.cursor;
        const cursorParam = cursor ? `&cursor=${cursor}` : '';
        return customFetch(`/clients?limit=${limit}&search=${encodeURIComponent(search)}${cursorParam}`, {
            headers: getHeaders()
        }).then(handleResponse);
    },

    create: (client: Partial<Client>): Promise<Client> =>
        customFetch('/clients', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(client),
        }).then(handleResponse),

    update: (id: number, client: Partial<Client>): Promise<Client> =>
        customFetch(`/clients/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(client),
        }).then(handleResponse),

    delete: (id: number): Promise<void> =>
        customFetch(`/clients/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),
};
