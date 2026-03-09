import { Request, Response } from 'express';
import { tenantService } from './tenant.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMyPlan = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const planInfo = await tenantService.getTenantPlan(tenantId);
    res.json(planInfo);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const { settings } = req.body;

    const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: { settings }
    });

    res.json(updated);
});

// Admin only: upgrade a tenant plan
export const upgradePlan = asyncHandler(async (req: Request, res: Response) => {
    if ((req as any).user?.role !== 'admin') {
        throw new AppError('Forbidden: Admin access required', 403);
    }

    const { targetTenantId, newPlan } = req.body;

    const updated = await prisma.tenant.update({
        where: { id: parseInt(targetTenantId) },
        data: { plan: newPlan }
    });

    res.json({ message: `Tenant upgraded to ${newPlan}`, tenant: updated });
});
