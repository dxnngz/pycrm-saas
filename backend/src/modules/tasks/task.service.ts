import { taskRepository } from '../../repositories/task.repository.js';
import { Task } from '@prisma/client';

export class TaskService {

    async getTasksByUserId(tenantId: number, userId: number, options: { limit?: number; search?: string; cursor?: number } = {}) {
        const { limit = 10, search = '', cursor } = options;

        const [items, total] = await Promise.all([
            taskRepository.findManyPaged(tenantId, { cursor, limit, search }),
            taskRepository.countSearch(tenantId, search)
        ]);

        const mappedData = items.map((task: any) => ({
            ...task,
            client_name: (task as any).client?.name || 'Individual',
            user_name: (task as any).user?.name || 'Unassigned'
        }));

        const hasMore = items.length > limit;
        const resultItems = hasMore ? mappedData.slice(0, limit) : mappedData;
        const lastItem = resultItems[resultItems.length - 1];
        const nextCursor = hasMore ? lastItem?.id : null;

        return {
            data: resultItems,
            total,
            limit,
            nextCursor,
            hasMore
        };
    }

    async createTask(data: any, tenantId: number) {
        return await taskRepository.create({
            tenant_id: tenantId,
            user_id: data.userId,
            client_id: data.client_id ? parseInt(data.client_id) : null,
            title: data.title,
            deadline: data.due_date ? new Date(data.due_date) : new Date(),
            priority: data.priority || 'media',
            completed: false
        });
    }

    async toggleTaskCompletionStatus(tenantId: number, id: number, userId: number) {
        const task = await taskRepository.findUnique(tenantId, id);
        if (!task || task.user_id !== userId) return null;

        return await taskRepository.update(tenantId, id, {
            completed: !task.completed
        });
    }

    async deleteTaskById(tenantId: number, id: number, userId: number) {
        const task = await taskRepository.findUnique(tenantId, id);
        if (!task || task.user_id !== userId) return false;

        await taskRepository.delete(tenantId, id);
        return true;
    }
}

export const taskService = new TaskService();
