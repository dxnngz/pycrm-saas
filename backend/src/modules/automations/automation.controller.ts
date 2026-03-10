import { Request, Response } from 'express';
import { prisma } from '../../core/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { tenantService } from '../tenants/tenant.service.js';
import { AppError } from '../../utils/AppError.js';

export const getAutomations = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const automations = await prisma.automation.findMany({
        where: { tenant_id: tenantId },
        include: { triggers: { include: { conditions: true } }, actions: true }
    });
    res.json(automations);
});

export const createAutomation = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;

    // Feature gating
    const isEnabled = await tenantService.isFeatureEnabled(tenantId, 'workflows');
    if (!isEnabled) {
        throw new AppError('Las automatizaciones de flujo de trabajo requieren un plan superior (PRO/Enterprise).', 403);
    }

    const { name, description, active, triggers, actions } = req.body;

    const automation = await prisma.automation.create({
        data: {
            tenant_id: tenantId,
            name,
            description,
            active: active ?? true,
            triggers: {
                create: triggers.map((t: any) => ({
                    event_name: t.event_name,
                    conditions: {
                        create: t.conditions || []
                    }
                }))
            },
            actions: {
                create: actions.map((a: any, i: number) => ({
                    type: a.type,
                    payload: a.payload || {},
                    order: a.order || i
                }))
            }
        },
        include: { triggers: { include: { conditions: true } }, actions: true }
    });

    res.status(201).json(automation);
});

export const toggleAutomation = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);
    const { active } = req.body;

    const automation = await prisma.automation.findFirst({ where: { id, tenant_id: tenantId } });
    if (!automation) throw new Error('Automation found');

    const updated = await prisma.automation.update({
        where: { id },
        data: { active }
    });

    res.json(updated);
});
