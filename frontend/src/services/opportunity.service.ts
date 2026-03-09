import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Opportunity, PaginatedResponse } from '../types';

export const opportunityService = {
    getAll: (page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<Opportunity>> =>
        customFetch(`/opportunities?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
            headers: getHeaders()
        }).then(handleResponse),

    create: (opportunity: Partial<Opportunity>): Promise<Opportunity> =>
        customFetch('/opportunities', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(opportunity),
        }).then(handleResponse),

    updateStatus: (id: number, status: string): Promise<Opportunity> =>
        customFetch(`/opportunities/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }).then(handleResponse),

    getLeadScore: (opportunityId: number): Promise<{ score: number; classification: 'HIGH' | 'MEDIUM' | 'LOW'; recommendation: string; factors: Record<string, unknown> }> =>
        customFetch(`/opportunities/${opportunityId}/score`, { headers: getHeaders() }).then(handleResponse),
};
