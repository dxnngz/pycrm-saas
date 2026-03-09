import { prisma } from '../core/prisma.js';
import { eventBus } from '../core/eventBus.js';
import { auditService } from '../modules/audit/audit.service.js';
import { contextStore } from '../core/context.js';

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
        const result = await this.model.create({ data });
        const ctx = contextStore.getStore();

        // Emit for Workflows
        eventBus.emit(`${this.model.name.toLowerCase()}.created`, {
            tenantId: result.tenant_id,
            userId: ctx?.userId,
            data: result
        });

        // Audit Log
        await auditService.log({
            entity: this.model.name,
            entityId: result.id,
            tenantId: result.tenant_id,
            action: 'CREATE',
            userId: ctx?.userId,
            changes: data
        });

        return result;
    }

    async update(tenantId: number, id: number, data: any) {
        const result = await this.model.update({
            where: { id, tenant_id: tenantId },
            data
        });
        const ctx = contextStore.getStore();

        // Emit for Workflows
        eventBus.emit(`${this.model.name.toLowerCase()}.updated`, {
            tenantId,
            userId: ctx?.userId,
            data: result
        });

        // Audit Log
        await auditService.log({
            entity: this.model.name,
            entityId: id,
            tenantId,
            action: 'UPDATE',
            userId: ctx?.userId,
            changes: data
        });

        return result;
    }

    async delete(tenantId: number, id: number, hardDelete = false) {
        const softDeleteModels = ['client', 'opportunity', 'task', 'product'];
        const modelName = this.model.name?.toLowerCase() || '';
        const ctx = contextStore.getStore();

        let result;
        if (hardDelete || !softDeleteModels.includes(modelName)) {
            result = await this.model.delete({
                where: { id, tenant_id: tenantId }
            });
        } else {
            result = await this.model.update({
                where: { id, tenant_id: tenantId },
                data: { deleted_at: new Date() }
            });
        }

        // Emit for Workflows
        eventBus.emit(`${modelName}.deleted`, {
            tenantId,
            userId: ctx?.userId,
            data: { id }
        });

        // Audit Log
        await auditService.log({
            entity: this.model.name,
            entityId: id,
            tenantId,
            action: 'DELETE',
            userId: ctx?.userId
        });

        return result;
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
