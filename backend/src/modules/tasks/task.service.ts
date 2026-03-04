import { prisma } from '../../core/prisma.js';

export class TaskService {

    async getTasksByUserId(userId: number) {
        const tasks = await prisma.task.findMany({
            where: { user_id: userId },
            include: {
                client: {
                    select: { name: true }
                }
            },
            orderBy: { deadline: 'asc' }
        });

        // Add client_name to map to frontend expectation
        return tasks.map(task => ({
            ...task,
            client_name: task.client?.name || null
        }));
    }

    async createTask(data: { userId: number; title: string; deadline: string; priority?: string; client_id?: string }, tenantId: number) {
        return await prisma.task.create({
            data: {
                user_id: data.userId,
                tenant_id: tenantId,
                client_id: data.client_id ? parseInt(data.client_id) : null,
                title: data.title,
                deadline: new Date(data.deadline),
                priority: data.priority || 'Media',
                completed: false
            }
        });
    }

    async toggleTaskCompletionStatus(id: number, userId: number) {
        // Prisma doesn't have a direct "NOT column" update atomic operator easily for booleans,
        // so we find it, then update it. Since we do it by userId, we also check ownership.
        const task = await prisma.task.findUnique({
            where: { id }
        });

        if (!task || task.user_id !== userId) return null;

        return await prisma.task.update({
            where: { id },
            data: { completed: !task.completed }
        });
    }

    async deleteTaskById(id: number, userId: number) {
        // Prisma allows deleting by unique ID but doesn't easily let you delete by ID AND user_id atomically
        // without throwing if it doesn't match both.
        // We can do deleteMany which allows non-unique composed conditions and returns count.
        const result = await prisma.task.deleteMany({
            where: {
                id: id,
                user_id: userId
            }
        });

        return result.count > 0;
    }
}

export const taskService = new TaskService();
