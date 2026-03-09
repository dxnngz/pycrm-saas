import { prisma } from '../core/prisma.js';

export abstract class BaseRepository<T extends { id: number; tenant_id: number }> {
    constructor(protected model: any) { }

    async findMany(tenantId: number, options: { where?: any; take?: number; skip?: number; cursor?: number; orderBy?: any; include?: any; includeDeleted?: boolean } = {}) {
        const { where = {}, take, skip, cursor, orderBy, include, includeDeleted = false } = options;

        const finalWhere = {
            ...where,
            tenant_id: tenantId,
        };

        // SAFETY: Only apply soft-delete filter if the model supports it
        // In this schema: Client, Opportunity, Task, Product have deleted_at
        const softDeleteModels = ['client', 'opportunity', 'task', 'product'];
        const modelName = this.model.name?.toLowerCase() || '';

        if (!includeDeleted && softDeleteModels.includes(modelName)) {
            finalWhere.deleted_at = null;
        }

        return await this.model.findMany({
            where: finalWhere,
            take,
            skip,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy,
            include
        });
    }

    async findUnique(tenantId: number, id: number, includeDeleted = false) {
        const where: any = { id, tenant_id: tenantId };

        const softDeleteModels = ['client', 'opportunity', 'task', 'product'];
        const modelName = this.model.name?.toLowerCase() || '';

        if (!includeDeleted && softDeleteModels.includes(modelName)) {
            where.deleted_at = null;
        }
        return await this.model.findFirst({ where });
    }

    async create(data: any) {
        return await this.model.create({ data });
    }

    async update(tenantId: number, id: number, data: any) {
        // Enforce tenant isolation on update
        return await this.model.update({
            where: { id, tenant_id: tenantId },
            data
        });
    }

    async delete(tenantId: number, id: number, hardDelete = false) {
        const softDeleteModels = ['client', 'opportunity', 'task', 'product'];
        const modelName = this.model.name?.toLowerCase() || '';

        if (hardDelete || !softDeleteModels.includes(modelName)) {
            return await this.model.delete({
                where: { id, tenant_id: tenantId }
            });
        }

        return await this.model.update({
            where: { id, tenant_id: tenantId },
            data: { deleted_at: new Date() }
        });
    }

    async count(tenantId: number, options: { where?: any; includeDeleted?: boolean } = {}) {
        const { where = {}, includeDeleted = false } = options;
        const finalWhere = {
            ...where,
            tenant_id: tenantId,
        };

        const softDeleteModels = ['client', 'opportunity', 'task', 'product'];
        const modelName = this.model.name?.toLowerCase() || '';

        if (!includeDeleted && softDeleteModels.includes(modelName)) {
            finalWhere.deleted_at = null;
        }

        return await this.model.count({
            where: finalWhere
        });
    }
}
