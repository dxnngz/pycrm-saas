import { Request, Response } from 'express';
import { opportunityService } from './opportunity.service.js';
import { aiService } from '../ai/ai.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { eventBus } from '../../core/eventBus.js';

export const getOpportunities = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const tenantId = (req as any).user?.tenantId;
    const opportunities = await opportunityService.getAllOpportunities(tenantId, page, limit, search);
    res.json(opportunities);
});

export const createOpportunity = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    // Body from route shouldn't parse string if using JSON but we enforce type:
    const data = {
        ...req.body,
        client_id: parseInt(req.body.client_id),
        amount: parseFloat(req.body.amount)
    };
    const opportunity = await opportunityService.createOpportunity(data, tenantId);

    // Emit event for Automation Engine
    eventBus.emit('opportunity.created', { tenantId, userId: (req as any).user?.userId, data: opportunity });

    res.status(201).json(opportunity);
});

export const updateOpportunityStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        const id = parseInt(req.params.id as string);
        const { status, version } = req.body;
        const opportunity = await opportunityService.updateOpportunityStatusById(tenantId, id, status, version);

        eventBus.emit('opportunity.status_updated', { tenantId, userId: (req as any).user?.userId, data: opportunity });

        res.json(opportunity);
    } catch (error: any) {
        // P2025 is Prisma "Record to update not found."
        // Could be missing or optimistic lock fail.
        if (error.code === 'P2025') {
            throw new AppError('Oportunidad no encontrada o fue modificada por otro usuario (Conflicto de Version). Por favor, recarga y vuelve a intentarlo.', 409);
        }
        throw error;
    }
});

export const getLeadScore = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    try {
        const scoreData = await aiService.calculateLeadScore(parseInt(id as string), tenantId);
        res.json(scoreData);
    } catch (err: any) {
        if (err.message === 'Oportunidad no encontrada') {
            throw new AppError(err.message, 404);
        }
        throw err;
    }
});
