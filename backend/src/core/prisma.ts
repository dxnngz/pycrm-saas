import { PrismaClient } from '@prisma/client';
import { contextStore } from './context.js';
import { redisCache } from './redis.js';
import { ResilienceService } from './resilience.service.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const AUDITABLE_MODELS = ['Client', 'Opportunity', 'Contact', 'Task', 'Event', 'Document', 'Product', 'User'];
const safeTenant = (id: any): number => Number(id) || 1;

export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const store = contextStore.getStore();
                const tenantId = safeTenant(store?.tenantId);

                // --- MULTI-TENANT ISOLATION ARMOR ---
                // We enforce tenant_id FILTERING on all standard operations
                if (AUDITABLE_MODELS.includes(model) && !store?.isSystem && store?.tenantId) {
                    const anyArgs = args as any;
                    if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'].includes(operation)) {
                        anyArgs.where = { ...(anyArgs.where || {}), tenant_id: tenantId };
                    }

                    if (['findUnique', 'findUniqueOrThrow', 'update', 'delete'].includes(operation)) {
                        // For unique operations, we MUST include tenant_id in the where clause
                        // to ensure a user from Tenant B cannot guess an ID from Tenant A.
                        if (anyArgs.where?.id) {
                            anyArgs.where = { id: anyArgs.where.id, tenant_id: tenantId };
                        } else if (anyArgs.where) {
                            anyArgs.where = { ...anyArgs.where, tenant_id: tenantId };
                        }
                    }

                    if (operation === 'update' || operation === 'updateMany') {
                        const anyData = (anyArgs.data || {}) as any;
                        if (typeof anyData === 'object' && !anyData.version) {
                            anyArgs.data = { ...anyData, version: { increment: 1 } };
                        }
                    }

                    if (operation === 'create') {
                        if (model !== 'User' && model !== 'Tenant') {
                            anyArgs.data = { ...(anyArgs.data || {}), tenant_id: tenantId, version: 1 };
                        } else if (model === 'User') {
                            anyArgs.data = { ...(anyArgs.data || {}), version: 1 };
                        }
                    }
                }

                // --- RETRY & SELF-HEALING EXECUTION ---
                const result = await ResilienceService.withRetry(() => query(args));

                // --- STRICT ISOLATION ENFORCEMENT (404) ---
                // If a unique/throw operation returns null even if the ID exists (but in another tenant),
                // we throw 404 to prevent data discovery.
                if (['findUniqueOrThrow', 'update', 'delete'].includes(operation) && !result) {
                    throw new AppError(`Recurso no encontrado en su organización.`, 404);
                }

                // --- AUDIT LOGS ---
                if (AUDITABLE_MODELS.includes(model) && ['create', 'update', 'delete'].includes(operation) && store?.userId) {
                    const changes = operation === 'update' ? {
                        updatedData: JSON.parse(JSON.stringify((args as any).data)),
                        finalState: JSON.parse(JSON.stringify(result))
                    } : JSON.parse(JSON.stringify(result));

                    basePrisma.auditLog.create({
                        data: {
                            entity: model,
                            entity_id: (result as any)?.id ? Number((result as any).id) : 0,
                            action: operation.toUpperCase(),
                            user_id: Number(store.userId),
                            request_id: store.requestId || null,
                            tenant_id: tenantId,
                            changes: changes as any,
                        }
                    }).catch(e => logger.error({ err: e.message }, 'Failed to write audit log'));
                }

                // --- CACHE INVALIDATION ---
                if (['create', 'update', 'delete', 'updateMany', 'deleteMany'].includes(operation)) {
                    const namespace = model.toLowerCase();
                    redisCache.invalidateTenantCache(tenantId, namespace);
                    if (model === 'Opportunity') {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },
        }
    }
});
