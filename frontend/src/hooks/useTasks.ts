import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import type { Task } from '../types';

export const useTasks = () => {
    const queryClient = useQueryClient();

    const { data: qData, isLoading: loading, refetch } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => taskService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Task>) => taskService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => taskService.toggle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => taskService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });

    return {
        tasks: qData || [],
        loading,
        loadTasks: () => refetch(),
        createTask: (data: Partial<Task>) => createMutation.mutateAsync(data),
        toggleTask: (id: number) => toggleMutation.mutateAsync(id),
        deleteTask: (id: number) => deleteMutation.mutateAsync(id),
    };
};
