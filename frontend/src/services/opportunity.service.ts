import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Opportunity, PaginatedResponse, PipelineStage } from '../types';

export interface OpportunitySummary {
    total: number;
    byStatus: Record<string, number>;
    amountByStatus: Record<string, number>;
    stages: PipelineStage[];
}

export const opportunityService = {
    getAll: (options: {
        limit?: number;
        search?: string;
        cursor?: number;
        status?: string;
        assigned_to?: number;
        amount_min?: number;
        amount_max?: number;
        overdue?: boolean;
    } = {}): Promise<PaginatedResponse<Opportunity> & { nextCursor?: number | null; hasMore?: boolean }> => {
        const limit = options.limit ?? 10;
        const search = options.search ?? '';
        const cursor = options.cursor;
        const cursorParam = cursor ? `&cursor=${cursor}` : '';
        const statusParam = options.status ? `&status=${encodeURIComponent(options.status)}` : '';
        const assignedToParam = typeof options.assigned_to === 'number' ? `&assigned_to=${options.assigned_to}` : '';
        const amountMinParam = typeof options.amount_min === 'number' ? `&amount_min=${options.amount_min}` : '';
        const amountMaxParam = typeof options.amount_max === 'number' ? `&amount_max=${options.amount_max}` : '';
        const overdueParam = options.overdue ? `&overdue=1` : '';

        return customFetch(
            `/opportunities?limit=${limit}&search=${encodeURIComponent(search)}${cursorParam}${statusParam}${assignedToParam}${amountMinParam}${amountMaxParam}${overdueParam}`,
            {
            headers: getHeaders()
            }
        ).then(handleResponse);
    },

    getSummary: (options: {
        search?: string;
        status?: string;
        assigned_to?: number;
        amount_min?: number;
        amount_max?: number;
        overdue?: boolean;
    } = {}): Promise<OpportunitySummary> => {
        const search = options.search ?? '';
        const statusParam = options.status ? `&status=${encodeURIComponent(options.status)}` : '';
        const assignedToParam = typeof options.assigned_to === 'number' ? `&assigned_to=${options.assigned_to}` : '';
        const amountMinParam = typeof options.amount_min === 'number' ? `&amount_min=${options.amount_min}` : '';
        const amountMaxParam = typeof options.amount_max === 'number' ? `&amount_max=${options.amount_max}` : '';
        const overdueParam = options.overdue ? `&overdue=1` : '';

        return customFetch(
            `/opportunities/summary?search=${encodeURIComponent(search)}${statusParam}${assignedToParam}${amountMinParam}${amountMaxParam}${overdueParam}`,
            { headers: getHeaders() }
        ).then(handleResponse);
    },

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
