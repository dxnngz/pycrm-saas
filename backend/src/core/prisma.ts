import { PrismaClient } from '@prisma/client';
import { contextStore } from './context.js';
import { redisCache } from './redis.js';

const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Entidades que queremos auditar
const AUDITABLE_MODELS = ['Client', 'Opportunity', 'Contact', 'Task', 'Event', 'Document', 'Product', 'User'];

export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            // MULTI-TENANT: CREATE INTERCEPTOR
            async create({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model) && model !== 'User') { // User handles its own tenant assignment during registration
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        if (args.data) {
                            (args.data as Record<string, unknown>).tenant_id = store.tenantId;
                        }
                    }
                }

                const result = await query(args);

                // AUDIT LOGS
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (store?.userId) {
                        await basePrisma.auditLog.create({
                            data: {
                                entity: model,
                                entity_id: result.id,
                                action: 'CREATE',
                                user_id: Number(store.userId),
                                request_id: store.requestId || null,
                                tenant_id: Number(store.tenantId) || (result as any).tenant_id || 1,
                                changes: JSON.parse(JSON.stringify(result)),
                            } as any,
                        });
                    }
                }

                // REDIS CACHE INVALIDATION
                if (model === 'Opportunity') {
                    const currentStore = contextStore.getStore();
                    const tenantId = (result as any).tenant_id || currentStore?.tenantId;
                    if (tenantId) {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },

            // MULTI-TENANT: UPDATE INTERCEPTOR
            async update({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId };
                    }
                }

                const result = await query(args);

                // AUDIT LOGS
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (store?.userId) {
                        await basePrisma.auditLog.create({
                            data: {
                                entity: model,
                                entity_id: result.id,
                                action: 'UPDATE',
                                user_id: Number(store.userId),
                                request_id: store.requestId || null,
                                tenant_id: Number(store.tenantId) || (result as any).tenant_id || 1,
                                changes: {
                                    updatedData: JSON.parse(JSON.stringify(args.data)),
                                    finalState: JSON.parse(JSON.stringify(result))
                                }
                            } as any,
                        });
                    }
                }

                // REDIS CACHE INVALIDATION
                if (model === 'Opportunity') {
                    const currentStore = contextStore.getStore();
                    const tenantId = (result as any).tenant_id || currentStore?.tenantId;
                    if (tenantId) {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },

            // MULTI-TENANT: DELETE INTERCEPTOR
            async delete({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId };
                    }
                }

                const result = await query(args);

                // AUDIT LOGS
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (store?.userId) {
                        await basePrisma.auditLog.create({
                            data: {
                                entity: model,
                                entity_id: result.id,
                                action: 'DELETE',
                                user_id: Number(store.userId),
                                request_id: store.requestId || null,
                                tenant_id: Number(store.tenantId) || (result as any).tenant_id || 1,
                                changes: JSON.parse(JSON.stringify(result)),
                            } as any,
                        });
                    }
                }

                // REDIS CACHE INVALIDATION
                if (model === 'Opportunity') {
                    const currentStore = contextStore.getStore();
                    const tenantId = (result as any).tenant_id || currentStore?.tenantId;
                    if (tenantId) {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },

            // MULTI-TENANT: READ ISOLATION (findMany, findFirst, count)
            async findMany({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId } as any;
                    }
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId } as any;
                    }
                }
                return query(args);
            },
            async count({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId } as any;
                    }
                }
                return query(args);
            },
            async aggregate({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId } as any;
                    }
                }
                return query(args);
            },
            async groupBy({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...args.where, tenant_id: store.tenantId } as any;
                    }
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId && (args.where as any).id) {
                        // Solo interceptamos si se busca por ID y tenemos tenantId
                        args.where = {
                            id_tenant_id: {
                                id: (args.where as any).id,
                                tenant_id: store.tenantId
                            }
                        } as any;
                    }
                }
                return query(args);
            },
            async findUniqueOrThrow({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId && (args.where as any).id) {
                        args.where = {
                            id_tenant_id: {
                                id: (args.where as any).id,
                                tenant_id: store.tenantId
                            }
                        } as any;
                    }
                }
                return query(args);
            }
        }
    }
});
