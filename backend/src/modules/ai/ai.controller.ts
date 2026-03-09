import { Request, Response } from 'express';
import { aiService } from './ai.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const askCopilot = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const { query } = req.body;

    if (!query) {
        throw new AppError('La consulta (query) es requerida', 400);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await aiService.copilotQueryStream(tenantId, query, res);
});

export const scoreOpportunity = asyncHandler(async (req: Request, res: Response) => {
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

export const getClientBrief = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;

    try {
        const briefData = await aiService.getClientSummary(parseInt(id as string), tenantId);
        res.json(briefData);
    } catch (err: any) {
        if (err.message === 'Cliente no encontrado') {
            throw new AppError(err.message, 404);
        }
        throw err;
    }
});
