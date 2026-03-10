import { opportunityService } from './opportunity.service.js';
import { aiService } from '../ai/ai.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { events } from '../../core/events.js';
import { tenantService } from '../tenants/tenant.service.js';
export const getOpportunities = asyncHandler(async (req, res) => {
    const { limit, search, cursor } = req.query;
    const user = req.user;
    const opportunities = await opportunityService.getAllOpportunities(user.tenantId, {
        limit: limit ? parseInt(limit) : 10,
        search: search,
        cursor: cursor ? parseInt(cursor) : undefined
    });
    res.json(opportunities);
});
export const createOpportunity = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const opportunity = await opportunityService.createOpportunity(req.body, tenantId);
    // Emit event for Automation Engine
    events.emit('workflow:opportunity_created', { tenantId, userId, data: opportunity });
    res.status(201).json(opportunity);
});
export const updateOpportunityStatus = asyncHandler(async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const id = parseInt(req.params.id);
        const { status, version } = req.body;
        const opportunity = await opportunityService.updateOpportunityStatusById(tenantId, id, status, version);
        events.emit('workflow:opportunity_status_updated', { tenantId, userId: req.user?.userId, data: opportunity });
        res.json(opportunity);
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Oportunidad no encontrada o fue modificada por otro usuario (Conflicto de Version). Por favor, recarga y vuelve a intentarlo.', 409);
        }
        throw error;
    }
});
export const getLeadScore = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = parseInt(req.params.id);
    // Feature gating
    const isEnabled = await tenantService.isFeatureEnabled(tenantId, 'aiBriefs');
    if (!isEnabled) {
        throw new AppError('Lead Scoring avanzado requiere un plan superior (PRO/Enterprise).', 403);
    }
    try {
        const scoreData = await aiService.calculateLeadScore(id, tenantId);
        res.json(scoreData);
    }
    catch (err) {
        if (err.message === 'Oportunidad no encontrada') {
            throw new AppError(err.message, 404);
        }
        throw err;
    }
});
