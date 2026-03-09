// Service for Products API
import { customFetch, getHeaders, handleResponse } from './apiClient';

export const productsService = {
    // Fetch products with pagination and optional search
    getAll: async (page: number = 1, limit: number = 20, search?: string) => {
        const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (search) query.append('search', search);
        return customFetch(`/products?${query.toString()}`, { headers: getHeaders() }).then(handleResponse);
    },

    // Delete a product by ID
    delete: async (id: number) =>
        customFetch(`/products/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};
