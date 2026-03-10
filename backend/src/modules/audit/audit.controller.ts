import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/prisma.js';

export class AuditController {
    async getLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId;
            const { limit = 50, entity } = req.query;

            const logs = await prisma.auditLog.findMany({
                where: {
                    tenant_id: tenantId,
                    ...(entity && { entity: String(entity) })
                },
                take: Number(limit),
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            });

            res.json(logs);
        } catch (error) {
            next(error);
        }
    }
}

export const auditController = new AuditController();
