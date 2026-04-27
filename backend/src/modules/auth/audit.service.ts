import { basePrisma } from '../../core/prisma.js';

export class AuditService {
    async log(data: {
        entity: string;
        entityId: number;
        tenantId: number;
        action: string;
        userId?: number;
        requestId?: string;
        changes?: any;
    }) {
        return await basePrisma.auditLog.create({
            data: {
                entity: data.entity,
                entity_id: data.entityId,
                tenant_id: data.tenantId,
                action: data.action,
                user_id: data.userId,
                request_id: data.requestId,
                changes: data.changes || {}
            }
        });
    }

    async logAuth(userId: number, tenantId: number, action: 'LOGIN' | 'LOGOUT' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'PASSWORD_RESET', info?: any) {
        return await this.log({
            entity: 'User',
            entityId: userId,
            tenantId,
            action,
            userId,
            changes: info
        });
    }
}

export const auditService = new AuditService();
