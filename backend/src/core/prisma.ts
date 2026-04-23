import { PrismaClient } from '@prisma/client';
import { contextStore } from './context.js';
import { redisCache } from './redis.js';
import { ResilienceService } from './resilience.service.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

import { AUDITABLE_MODELS, VERSIONED_MODELS, TABLE_MAP, TENANT_SCOPED_MODELS, getTableName } from './schema.constants.js';

const safeTenant = (id: any): number => {
    const tid = Number(id);
    if (!tid || isNaN(tid)) return 0; // 0 is an invalid tenant ID
    return tid;
};

export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const store = contextStore.getStore();
                const tenantId = safeTenant(store?.tenantId);
                const isAuditable = model && AUDITABLE_MODELS.includes(model);

                // --- MULTI-TENANT ISOLATION ARMOR ---
                const isTenantScoped = model && TENANT_SCOPED_MODELS.includes(model);
                
                // If the model is multi-tenant and we're not in a system context, enforce tenant_id
                if (isTenantScoped && !store?.isSystem) {
                    if (!tenantId) {
                        logger.error({ model, operation, requestId: store?.requestId }, 'CRITICAL: Attempted database operation without tenant context');
                        throw new AppError('Acceso denegado: falta el contexto de organización.', 403);
                    }

                    const anyArgs = args as any;
                    
                    // Inject tenant_id into filter operations
                    if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'].includes(operation)) {
                        anyArgs.where = { ...(anyArgs.where || {}), tenant_id: tenantId };
                    }

                    // Inject tenant_id into unique operations
                    if (['findUnique', 'findUniqueOrThrow', 'update', 'delete'].includes(operation)) {
                        anyArgs.where = { ...(anyArgs.where || {}), tenant_id: tenantId };
                    }

                    // Inject tenant_id into creation
                    if (operation === 'create') {
                        anyArgs.data = { ...(anyArgs.data || {}), tenant_id: tenantId };
                    }
                }

                // --- OPTIMISTIC LOCKING AUTOMATION ---
                if (model && VERSIONED_MODELS.includes(model)) {
                    const anyArgs = args as any;
                    const tableName = getTableName(model);
                    const hasVersion = await ResilienceService.checkColumnExists(tableName, 'version');

                    if (hasVersion) {
                        if (operation === 'update' || operation === 'updateMany') {
                            const anyData = (anyArgs.data || {}) as any;
                            if (typeof anyData === 'object' && !anyData.version) {
                                anyArgs.data = { ...anyData, version: { increment: 1 } };
                            }
                        }

                        if (operation === 'create') {
                            anyArgs.data = { ...(anyArgs.data || {}), version: 1 };
                        }
                    }
                }

                // --- RETRY & SELF-HEALING EXECUTION ---
                const result = await ResilienceService.withRetry(() => query(args));

                // --- STRICT ISOLATION ENFORCEMENT (404) ---
                if (['findUniqueOrThrow', 'update', 'delete'].includes(operation) && !result) {
                    throw new AppError(`Recurso no encontrado en su organización.`, 404);
                }

                // --- AUDIT LOGS ---
                try {
                    const storeData = contextStore.getStore();
                    if (model && isAuditable && ['create', 'update', 'delete'].includes(operation) && storeData?.userId) {
                        const anyArgs = args as any;
                        const resultAny = result as any;
                        
                        const changes = operation === 'update' ? {
                            updatedData: anyArgs.data,
                            finalState: result
                        } : result;

                        const entityId = resultAny?.id ? Number(resultAny.id) : 0;

                        basePrisma.auditLog.create({
                            data: {
                                entity: model,
                                entity_id: entityId,
                                action: operation.toUpperCase(),
                                user_id: Number(storeData.userId),
                                request_id: storeData.requestId || null,
                                tenant_id: tenantId,
                                changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
                            }
                        }).catch(e => logger.error({ err: e.message, model, operation }, 'Failed to write audit log'));
                    }
                } catch (auditErr: unknown) {
                    const errMsg = auditErr instanceof Error ? auditErr.message : 'Unknown audit error';
                    logger.error({ msg: 'Audit log extraction failed', err: errMsg, model, operation });
                }

                // --- CACHE INVALIDATION ---
                if (model && ['create', 'update', 'delete', 'updateMany', 'deleteMany'].includes(operation)) {
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
