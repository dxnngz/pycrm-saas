import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/client.service';
import type { Client } from '../types';

export const useClients = (limit: number = 10, search: string = '') => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
        queryKey: ['clients', limit, search],
        initialPageParam: undefined as number | undefined,
        queryFn: async ({ pageParam }) => {
            const response = await clientService.getAll({ limit, search, cursor: pageParam });
            const items = Array.isArray(response?.data) ? response.data : [];
            return { ...response, data: items };
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage?.hasMore) return undefined;
            const next = lastPage.nextCursor;
            return typeof next === 'number' ? next : undefined;
        },
        placeholderData: (previousData) => previousData
    });

    const pages = data?.pages || [];
    const clients = pages.flatMap((p) => (Array.isArray(p.data) ? p.data : []));
    const total = Number(pages[0]?.total) || clients.length;
    const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;
    const hasMore = !!hasNextPage;

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
        clients,
        loading,
        pagination: { total, limit, nextCursor, hasMore },
        loadClients: () => refetch(),
        loadMore: () => fetchNextPage(),
        isLoadingMore: isFetchingNextPage,
        createClient: createMutation.mutateAsync,
        updateClient: (id: number, data: Partial<Client>) => updateMutation.mutateAsync({ id, data }),
        deleteClient: deleteMutation.mutateAsync,
    };
};
