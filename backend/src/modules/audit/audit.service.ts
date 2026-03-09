import { prisma } from '../../core/prisma.js';
import { Prisma } from '@prisma/client';

export class AuditService {
    async log(data: {
        entity: string;
        entityId: number;
        tenantId: number;
        action: 'CREATE' | 'UPDATE' | 'DELETE';
        userId?: number;
        changes?: any;
    }) {
        try {
            return await prisma.auditLog.create({
                data: {
                    entity: data.entity,
                    entity_id: data.entityId,
                    tenant_id: data.tenantId,
                    action: data.action,
                    user_id: data.userId,
                    changes: data.changes ? data.changes : Prisma.JsonNull,
                }
            });
        } catch (error) {
            console.error('[AuditService] Failed to persist audit log:', error);
        }
    }
}

export const auditService = new AuditService();
