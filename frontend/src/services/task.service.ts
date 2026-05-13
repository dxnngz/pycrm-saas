import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Task } from '../types';

type TaskListResponse = Task[] | { data?: unknown };

const normalizeTaskList = (value: unknown): Task[] => {
    if (Array.isArray(value)) return value as Task[];
    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
        return (value as { data: Task[] }).data;
    }
    return [];
};

export const taskService = {
    getAll: (): Promise<Task[]> =>
        customFetch('/tasks', { headers: getHeaders() })
            .then(handleResponse)
            .then((r: TaskListResponse) => normalizeTaskList(r)),

    create: (task: Partial<Task>): Promise<Task> =>
        customFetch('/tasks', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(task),
        }).then(handleResponse),

    toggle: (id: number): Promise<Task> =>
        customFetch(`/tasks/${id}/toggle`, {
            method: 'PATCH',
            headers: getHeaders(),
        }).then(handleResponse),

    delete: (id: number): Promise<void> =>
        customFetch(`/tasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),
};
