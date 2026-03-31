import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';
import type { Opportunity } from '../types';

export const useOpportunities = (page: number = 1, limit: number = 10, search: string = '') => {
    const queryClient = useQueryClient();

    const { data: qData, isLoading: loading, refetch } = useQuery({
        queryKey: ['opportunities', page, limit, search],
        queryFn: async () => {
            const response = await opportunityService.getAll(page, limit, search);

            if (response && Array.isArray(response.data)) {
                return {
                    opportunities: response.data,
                    pagination: {
                        total: response.total || 0,
                        page: response.page || 1,
                        limit: response.limit || 10,
                        totalPages: response.totalPages || 0
                    }
                };
            } else if (Array.isArray(response)) {
                return {
                    opportunities: response as Opportunity[],
                    pagination: { total: response.length, page: 1, limit: 10, totalPages: 1 }
                };
            }
            return { opportunities: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        },
        placeholderData: (previousData) => previousData
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Opportunity>) => opportunityService.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'pendiente' | 'ganado' | 'perdido' }) => opportunityService.updateStatus(id, status),
        onMutate: async ({ id, status }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['opportunities', page, limit, search] });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(['opportunities', page, limit, search]);

            // Optimistically update to the new value
            queryClient.setQueryData(['opportunities', page, limit, search], (old: unknown) => {
                if (!old) return old;
                const current = old as { opportunities: Opportunity[] };
                return {
                    ...current,
                    opportunities: current.opportunities.map((opp: Opportunity) =>
                        opp.id === id ? { ...opp, status } : opp
                    )
                };
            });

            return { previousData };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['opportunities', page, limit, search], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    return {
        opportunities: qData?.opportunities || [],
        loading,
        pagination: qData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        loadOpportunities: (_p?: number, _l?: number, _s?: string) => refetch(),
        createOpportunity: createMutation.mutateAsync,
        updateOpportunityStatus: (id: number, status: 'pendiente' | 'ganado' | 'perdido') => updateStatusMutation.mutateAsync({ id, status }),
    };
};
