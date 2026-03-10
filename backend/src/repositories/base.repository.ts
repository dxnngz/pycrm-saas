import { prisma } from '../core/prisma.js';
import { events } from '../core/events.js';
import { auditService } from '../modules/audit/audit.service.js';
import { contextStore } from '../core/context.js';
import { ResilienceService } from '../core/resilience.service.js';

interface BaseModel {
    id: number;
    tenant_id: number;
    [key: string]: any;
}

interface PrismaModel<T> {
    name?: string;
    findMany(args: { where: any; take?: number; skip?: number; cursor?: any; orderBy?: any; include?: any }): Promise<T[]>;
    findFirst(args: { where: any; include?: any }): Promise<T | null>;
    create(args: { data: any }): Promise<T>;
    update(args: { where: any; data: any }): Promise<T>;
    delete(args: { where: any }): Promise<T>;
    count(args: { where: any }): Promise<number>;
}

export abstract class BaseRepository<T extends BaseModel> {
    protected modelName: string;
    constructor(protected model: any, name: string) {
        this.modelName = name;
    }

    async findMany(tenantId: number, options: { where?: any; take?: number; skip?: number; cursor?: number; orderBy?: any; include?: any; includeDeleted?: boolean } = {}) {
        const { where = {}, take, skip, cursor, orderBy, include, includeDeleted = false } = options;

        const finalWhere: any = {
            ...where,
            tenant_id: tenantId,
        };

        const softDeleteModels = ['user', 'client', 'contact', 'opportunity', 'task', 'product', 'event', 'document', 'automation'];
        const modelName = this.modelName.toLowerCase();
        const TABLE_MAP: Record<string, string> = {
            'opportunity': 'opportunities',
            'user': 'users',
            'client': 'clients',
            'contact': 'contacts',
            'task': 'tasks',
            'product': 'products',
            'event': 'events',
            'document': 'documents',
            'automation': 'automations'
        };
        const tableName = TABLE_MAP[modelName] || `${modelName}s`;

        if (!includeDeleted && softDeleteModels.includes(modelName)) {
            const hasDeletedAt = await ResilienceService.checkColumnExists(tableName, 'deleted_at');
            if (hasDeletedAt) {
                finalWhere.deleted_at = null;
            }
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

        const softDeleteModels = ['user', 'client', 'contact', 'opportunity', 'task', 'product', 'event', 'document', 'automation'];
        const modelName = this.modelName.toLowerCase();
        const TABLE_MAP: Record<string, string> = {
            'opportunity': 'opportunities',
            'user': 'users',
            'client': 'clients',
            'contact': 'contacts',
            'task': 'tasks',
            'product': 'products',
            'event': 'events',
            'document': 'documents',
            'automation': 'automations'
        };
        const tableName = TABLE_MAP[modelName] || `${modelName}s`;

        if (!includeDeleted && softDeleteModels.includes(modelName)) {
            const hasDeletedAt = await ResilienceService.checkColumnExists(tableName, 'deleted_at');
            if (hasDeletedAt) {
                where.deleted_at = null;
            }
        }
        return await this.model.findFirst({ where });
    }

    async create(data: any) {
        const result = await this.model.create({ data });
        const ctx = contextStore.getStore();

        // Emit for Workflows
        events.emit(`workflow:${this.modelName.toLowerCase()}_created`, {
            tenantId: result.tenant_id,
            userId: ctx?.userId,
            data: result
        });

        // Audit Log
        await auditService.log({
            entity: this.modelName,
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
        events.emit(`workflow:${this.modelName.toLowerCase()}_updated`, {
            tenantId,
            userId: ctx?.userId,
            data: result
        });

        // Audit Log
        await auditService.log({
            entity: this.modelName,
            entityId: id,
            tenantId,
            action: 'UPDATE',
            userId: ctx?.userId,
            changes: data
        });

        return result;
    }

    async delete(tenantId: number, id: number, hardDelete = false) {
        const softDeleteModels = ['user', 'client', 'contact', 'opportunity', 'task', 'product', 'event', 'document', 'automation'];
        const modelName = this.modelName.toLowerCase();
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
        events.emit(`workflow:${modelName}_deleted`, {
            tenantId,
            userId: ctx?.userId,
            data: { id }
        });

        // Audit Log
        await auditService.log({
            entity: this.modelName,
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
        const modelName = this.modelName.toLowerCase();
        const TABLE_MAP: Record<string, string> = {
            'opportunity': 'opportunities',
            'client': 'clients',
            'task': 'tasks',
            'product': 'products'
        };
        const tableName = TABLE_MAP[modelName] || `${modelName}s`;

        if (!includeDeleted && softDeleteModels.includes(modelName)) {
            const hasDeletedAt = await ResilienceService.checkColumnExists(tableName, 'deleted_at');
            if (hasDeletedAt) {
                finalWhere.deleted_at = null;
            }
        }

        return await this.model.count({
            where: finalWhere
        });
    }
}
