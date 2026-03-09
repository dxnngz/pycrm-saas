import { prisma } from '../core/prisma.js';
import { Task, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

export class TaskRepository extends BaseRepository<Task> {
    constructor() {
        super(prisma.task);
    }

    async findManyPaged(tenantId: number, options: { cursor?: number; limit?: number; search?: string }) {
        const { cursor, limit = 10, search = '' } = options;

        const where: Prisma.TaskWhereInput = {
            tenant_id: tenantId,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        return await this.findMany(tenantId, {
            where,
            take: limit + 1,
            cursor,
            orderBy: { id: 'asc' },
            include: {
                client: {
                    select: { name: true }
                }
            }
        });
    }

    async countSearch(tenantId: number, search = '') {
        const where: Prisma.TaskWhereInput = {
            tenant_id: tenantId,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        return await this.count(tenantId, where);
    }
}

export const taskRepository = new TaskRepository();
