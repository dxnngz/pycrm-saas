import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { Task } from '../types';

export const taskService = {
    getAll: (): Promise<Task[]> =>
        customFetch('/tasks', { headers: getHeaders() }).then(handleResponse),

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
