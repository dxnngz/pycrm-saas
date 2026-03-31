import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/client.service';
import type { Client } from '../types';

export const useClients = (page: number = 1, limit: number = 10, search: string = '') => {
    const queryClient = useQueryClient();

    const { data: qData, isLoading: loading, refetch } = useQuery({
        queryKey: ['clients', page, limit, search],
        queryFn: async () => {
            const response = await clientService.getAll(page, limit, search);

            if (response && Array.isArray(response.data)) {
                return {
                    clients: response.data,
                    pagination: {
                        total: response.total || 0,
                        page: response.page || 1,
                        limit: response.limit || 10,
                        totalPages: response.totalPages || 0
                    }
                };
            } else if (Array.isArray(response)) {
                return {
                    clients: response as Client[],
                    pagination: { total: response.length, page: 1, limit: 10, totalPages: 1 }
                };
            }
            return { clients: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        },
        placeholderData: (previousData) => previousData // replacing deprecated keepPreviousData in v5
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Client>) => clientService.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) => clientService.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => clientService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
    });

    return {
        clients: qData?.clients || [],
        loading,
        pagination: qData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        loadClients: (_page?: number, _limit?: number, _search?: string) => refetch(), // Fallback for backwards compatibility in older components
        createClient: createMutation.mutateAsync,
        updateClient: (id: number, data: Partial<Client>) => updateMutation.mutateAsync({ id, data }),
        deleteClient: deleteMutation.mutateAsync,
    };
};
