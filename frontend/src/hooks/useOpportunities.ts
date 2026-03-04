import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Opportunity } from '../types';

export const useOpportunities = (page: number = 1, limit: number = 10, search: string = '') => {
    const queryClient = useQueryClient();

    const { data: qData, isLoading: loading, refetch } = useQuery({
        queryKey: ['opportunities', page, limit, search],
        queryFn: async () => {
            const response = await api.opportunities.getAll(page, limit, search);

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
        staleTime: 1000 * 60 * 5,
        placeholderData: (previousData) => previousData
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Opportunity>) => api.opportunities.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'pendiente' | 'ganado' | 'perdido' }) => api.opportunities.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    return {
        opportunities: qData?.opportunities || [],
        loading,
        pagination: qData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
        loadOpportunities: (_p?: number, _l?: number, _s?: string) => refetch(),
        createOpportunity: createMutation.mutateAsync,
        updateOpportunityStatus: (id: number, status: 'pendiente' | 'ganado' | 'perdido') => updateStatusMutation.mutateAsync({ id, status }),
    };
};
