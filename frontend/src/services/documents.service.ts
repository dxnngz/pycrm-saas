// Service for Documents API
import { customFetch, getHeaders, handleResponse } from './apiClient';

export const documentsService = {
    // Fetch documents with pagination and optional search
    getAll: async (page: number = 1, limit: number = 20, search?: string) => {
        const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (search) query.append('search', search);
        return customFetch(`/documents?${query.toString()}`, { headers: getHeaders() }).then(handleResponse);
    },

    // Delete a document by ID
    delete: async (id: number) =>
        customFetch(`/documents/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};
