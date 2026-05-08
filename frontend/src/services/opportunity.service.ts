import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Opportunity, PaginatedResponse } from '../types';

export interface OpportunitySummary {
    total: number;
    byStatus: { pendiente: number; ganado: number; perdido: number };
    amountByStatus: { pendiente: number; ganado: number; perdido: number };
}

export const opportunityService = {
    getAll: (options: { limit?: number; search?: string; cursor?: number } = {}): Promise<PaginatedResponse<Opportunity> & { nextCursor?: number | null; hasMore?: boolean }> => {
        const limit = options.limit ?? 10;
        const search = options.search ?? '';
        const cursor = options.cursor;
        const cursorParam = cursor ? `&cursor=${cursor}` : '';

        return customFetch(`/opportunities?limit=${limit}&search=${encodeURIComponent(search)}${cursorParam}`, {
            headers: getHeaders()
        }).then(handleResponse);
    },

    getSummary: (search: string = ''): Promise<OpportunitySummary> =>
        customFetch(`/opportunities/summary?search=${encodeURIComponent(search)}`, { headers: getHeaders() })
            .then(handleResponse),

    create: (opportunity: Partial<Opportunity>): Promise<Opportunity> =>
        customFetch('/opportunities', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(opportunity),
        }).then(handleResponse),

    update: (id: number, opportunity: Partial<Opportunity> & { version?: number }): Promise<Opportunity> =>
        customFetch(`/opportunities/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(opportunity),
        }).then(handleResponse),

    updateStatus: (
        id: number,
        payload: { status: string; lost_reason?: string; lost_reason_detail?: string }
    ): Promise<Opportunity> =>
        customFetch(`/opportunities/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        }).then(handleResponse),

    getLeadScore: (opportunityId: number): Promise<{ score: number; classification: 'HIGH' | 'MEDIUM' | 'LOW'; recommendation: string; factors: Record<string, unknown> }> =>
        customFetch(`/opportunities/${opportunityId}/score`, { headers: getHeaders() }).then(handleResponse),
};
