import { PrismaClient } from '@prisma/client';
import { contextStore } from './context.js';
import { redisCache } from './redis.js';

const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Entidades que queremos auditar
const AUDITABLE_MODELS = ['Client', 'Opportunity', 'Contact', 'Task', 'Event', 'Document', 'Product', 'User'];
const safeTenant = (id: any): number => {
    const n = Number(id);
    return isNaN(n) ? 1 : n;
};

export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            // MULTI-TENANT: CREATE INTERCEPTOR
            async create({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model) && model !== 'User') {
                    const store = contextStore.getStore();
                    const tenantId = safeTenant(store?.tenantId);
                    if (!store?.isSystem && store?.tenantId) {
                        if (args.data) {
                            (args.data as Record<string, unknown>).tenant_id = tenantId;
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
                                tenant_id: safeTenant(store.tenantId) || (result as any).tenant_id || 1,
                                changes: JSON.parse(JSON.stringify(result)),
                            } as any,
                        });
                    }
                }

                // REDIS CACHE INVALIDATION
                if (model === 'Opportunity') {
                    const currentStore = contextStore.getStore();
                    const tenantId = (result as any).tenant_id || safeTenant(currentStore?.tenantId);
                    if (tenantId) {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },

            async createMany({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    const tenantId = safeTenant(store?.tenantId);
                    if (!store?.isSystem && store?.tenantId) {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((item: any) => ({ ...item, tenant_id: tenantId }));
                        }
                    }
                }
                return query(args);
            },

            // MULTI-TENANT: UPDATE INTERCEPTOR
            async update({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) };
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
                                tenant_id: safeTenant(store.tenantId) || (result as any).tenant_id || 1,
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
                    const tenantId = (result as any).tenant_id || safeTenant(currentStore?.tenantId);
                    if (tenantId) {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },

            async updateMany({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) };
                    }
                }
                return query(args);
            },

            // MULTI-TENANT: DELETE INTERCEPTOR
            async delete({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) };
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
                                tenant_id: safeTenant(store.tenantId) || (result as any).tenant_id || 1,
                                changes: JSON.parse(JSON.stringify(result)),
                            } as any,
                        });
                    }
                }

                // REDIS CACHE INVALIDATION
                if (model === 'Opportunity') {
                    const currentStore = contextStore.getStore();
                    const tenantId = (result as any).tenant_id || safeTenant(currentStore?.tenantId);
                    if (tenantId) {
                        redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
                    }
                }

                return result;
            },

            async deleteMany({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) };
                    }
                }
                return query(args);
            },

            // MULTI-TENANT: READ ISOLATION (findMany, findFirst, count)
            async findMany({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) } as any;
                    }
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) } as any;
                    }
                }
                return query(args);
            },

            async findUnique({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        // Transform findUnique(id) into findUnique(id_tenant_id)
                        const tenantId = safeTenant(store.tenantId);
                        if (args.where.id) {
                            args.where = { id: args.where.id, tenant_id: tenantId } as any;
                        } else {
                            args.where = { ...args.where, tenant_id: tenantId } as any;
                        }
                    }
                }
                return query(args);
            },

            async findUniqueOrThrow({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        const tenantId = safeTenant(store.tenantId);
                        if (args.where.id) {
                            args.where = { id: args.where.id, tenant_id: tenantId } as any;
                        } else {
                            args.where = { ...args.where, tenant_id: tenantId } as any;
                        }
                    }
                }
                return query(args);
            },

            async count({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) } as any;
                    }
                }
                return query(args);
            },
            async aggregate({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) } as any;
                    }
                }
                return query(args);
            },
            async groupBy({ model, args, query }) {
                if (AUDITABLE_MODELS.includes(model)) {
                    const store = contextStore.getStore();
                    if (!store?.isSystem && store?.tenantId) {
                        args.where = { ...(args.where || {}), tenant_id: safeTenant(store.tenantId) } as any;
                    }
                }
                return query(args);
            }
        }
    }
});
