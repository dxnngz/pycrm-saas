import { Request, Response } from 'express';
import { opportunityService } from './opportunity.service.js';
import { aiService } from '../ai/ai.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { eventBus } from '../../core/eventBus.js';

export const getOpportunities = asyncHandler(async (req: Request, res: Response) => {
    const { limit, search, cursor } = req.query as unknown as { limit: number; search: string; cursor?: number };
    const user = (req as any).user;

    const opportunities = await opportunityService.getAllOpportunities(user.tenantId, { limit, search, cursor });
    res.json(opportunities);
});

export const createOpportunity = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.userId;

    const opportunity = await opportunityService.createOpportunity(req.body, tenantId);

    // Emit event for Automation Engine
    eventBus.emit('opportunity.created', { tenantId, userId, data: opportunity });

    res.status(201).json(opportunity);
});

export const updateOpportunityStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        const { id } = req.params as any; // Transformed to number
        const { status, version } = req.body;

        const opportunity = await opportunityService.updateOpportunityStatusById(tenantId, id, status, version);

        eventBus.emit('opportunity.status_updated', { tenantId, userId: (req as any).user?.userId, data: opportunity });

        res.json(opportunity);
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Oportunidad no encontrada o fue modificada por otro usuario (Conflicto de Version). Por favor, recarga y vuelve a intentarlo.', 409);
        }
        throw error;
    }
});

export const getLeadScore = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params as any; // Transformed to number

    try {
        const scoreData = await aiService.calculateLeadScore(id, tenantId);
        res.json(scoreData);
    } catch (err: any) {
        if (err.message === 'Oportunidad no encontrada') {
            throw new AppError(err.message, 404);
        }
        throw err;
    }
});
