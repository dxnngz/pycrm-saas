import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';
import type { Opportunity } from '../types';

export const useOpportunities = (limit: number = 10, search: string = '') => {
    const queryClient = useQueryClient();
    const normalizeStatus = (status: Opportunity['status']): Opportunity['status'] => {
        if (status === 'ganada') return 'ganado';
        if (status === 'perdida') return 'perdido';
        if (status === 'negociacion') return 'pendiente';
        return status;
    };

    const { data, isLoading: loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['opportunities', limit, search],
        initialPageParam: undefined as number | undefined,
        queryFn: async ({ pageParam }) => {
            const response = await opportunityService.getAll({ limit, search, cursor: pageParam });
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

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: { status: 'pendiente' | 'ganado' | 'perdido'; lost_reason?: string; lost_reason_detail?: string } }) =>
            opportunityService.updateStatus(id, payload),
        onMutate: async ({ id, payload }) => {
            const status = payload.status;
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['opportunities', limit, search] });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(['opportunities', limit, search]);

            // Optimistically update to the new value
            queryClient.setQueryData(['opportunities', limit, search], (old: unknown) => {
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
                queryClient.setQueryData(['opportunities', limit, search], context.previousData);
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
        updateOpportunityStatus: (id: number, payload: { status: 'pendiente' | 'ganado' | 'perdido'; lost_reason?: string; lost_reason_detail?: string }) =>
            updateStatusMutation.mutateAsync({ id, payload }),
    };
};
