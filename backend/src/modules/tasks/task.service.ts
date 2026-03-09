import { taskRepository } from '../../repositories/task.repository.js';

export class TaskService {

    async getTasksByUserId(tenantId: number, userId: number, options: { limit?: number; search?: string; cursor?: number } = {}) {
        const { limit = 10, search = '', cursor } = options;

        const [tasks, total] = await Promise.all([
            taskRepository.findManyPaged(tenantId, { cursor, limit, search }),
            taskRepository.countSearch(tenantId, search)
        ]);

        const hasMore = tasks.length > limit;
        const items = hasMore ? tasks.slice(0, limit) : tasks;

        const mappedData = items.map((task: any) => ({
            ...task,
            client_name: task.client?.name || null
        }));

        const lastItem = items[items.length - 1];
        const nextCursor = hasMore ? lastItem?.id : null;

        return {
            data: mappedData,
            total,
            limit,
            nextCursor,
            hasMore
        };
    }

    async createTask(data: { userId: number; title: string; due_date?: Date; priority?: string; client_id?: string }, tenantId: number) {
        return await taskRepository.create({
            user_id: data.userId,
            tenant_id: tenantId,
            client_id: data.client_id ? parseInt(data.client_id) : null,
            title: data.title,
            deadline: data.due_date ? data.due_date : new Date(),
            priority: data.priority || 'medium',
            completed: false
        });
    }

    async toggleTaskCompletionStatus(tenantId: number, id: number, userId: number) {
        const task = await taskRepository.findUnique(tenantId, id);
        if (!task || task.user_id !== userId) return null;

        return await taskRepository.update(tenantId, id, { completed: !task.completed });
    }

    async deleteTaskById(tenantId: number, id: number, userId: number) {
        const task = await taskRepository.findUnique(tenantId, id);
        if (!task || task.user_id !== userId) return false;

        await taskRepository.delete(tenantId, id);
        return true;
    }
}

export const taskService = new TaskService();
