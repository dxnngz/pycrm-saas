import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Client, PaginatedResponse } from '../types';

export const clientService = {
    getAll: (page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<Client>> =>
        customFetch(`/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
            headers: getHeaders()
        }).then(handleResponse),

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
