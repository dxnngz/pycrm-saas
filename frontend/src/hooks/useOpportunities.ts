import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';
import type { Opportunity } from '../types';

export interface OpportunityFilters {
    status?: string;
    assigned_to?: number;
    amount_min?: number;
    amount_max?: number;
    overdue?: boolean;
}

export const useOpportunities = (limit: number = 10, search: string = '', filters: OpportunityFilters = {}) => {
    const queryClient = useQueryClient();
    const normalizeStatus = (status: Opportunity['status']): Opportunity['status'] => {
        if (status === 'ganada') return 'ganado';
        if (status === 'perdida') return 'perdido';
        return status;
    };

    const listQueryKey = [
        'opportunities',
        limit,
        search,
        filters.status ?? '',
        filters.assigned_to ?? 0,
        filters.amount_min ?? '',
        filters.amount_max ?? '',
        filters.overdue ? 1 : 0
    ] as const;

    const { data, isLoading: loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: listQueryKey,
        initialPageParam: undefined as number | undefined,
        queryFn: async ({ pageParam }) => {
            const response = await opportunityService.getAll({ limit, search, cursor: pageParam, ...filters });
            const items = Array.isArray(response?.data) ? response.data : [];
            return {
                ...response,
                data: items.map((o) => ({ ...o, status: normalizeStatus(o.status) }))
            };
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage?.hasMore) return undefined;
            const next = lastPage.nextCursor;
            return typeof next === 'number' ? next : undefined;
        },
    });

    const pages = data?.pages || [];
    const opportunities = pages.flatMap((p) => (Array.isArray(p.data) ? p.data : []));
    const total = Number(pages[0]?.total) || opportunities.length;
    const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;
    const hasMore = !!hasNextPage;

    const createMutation = useMutation({
        mutationFn: (data: Partial<Opportunity>) => opportunityService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            queryClient.invalidateQueries({ queryKey: ['opportunity_summary'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Opportunity> & { version?: number } }) => opportunityService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            queryClient.invalidateQueries({ queryKey: ['opportunity_summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: { status: string; lost_reason?: string; lost_reason_detail?: string } }) =>
            opportunityService.updateStatus(id, payload),
        onMutate: async ({ id, payload }) => {
            const status = payload.status;
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: listQueryKey });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(listQueryKey);

            // Optimistically update to the new value
            queryClient.setQueryData(listQueryKey, (old: unknown) => {
                if (!old) return old;
                const current = old as { pages: Array<{ data: Opportunity[] }> };
                if (!Array.isArray(current.pages)) return old;
                return {
                    ...current,
                    pages: current.pages.map((p) => ({
                        ...p,
                        data: Array.isArray(p.data)
                            ? p.data.map((opp: Opportunity) => (opp.id === id ? { ...opp, status } : opp))
                            : p.data
                    }))
                } as typeof old;
            });

            return { previousData };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(listQueryKey, context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            queryClient.invalidateQueries({ queryKey: ['opportunity_summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    return {
        opportunities,
        loading,
        pagination: { total, limit, nextCursor, hasMore },
        loadMore: () => fetchNextPage(),
        isLoadingMore: isFetchingNextPage,
        createOpportunity: createMutation.mutateAsync,
        updateOpportunity: (id: number, data: Partial<Opportunity> & { version?: number }) => updateMutation.mutateAsync({ id, data }),
        updateOpportunityStatus: (id: number, payload: { status: string; lost_reason?: string; lost_reason_detail?: string }) =>
            updateStatusMutation.mutateAsync({ id, payload }),
    };
};
