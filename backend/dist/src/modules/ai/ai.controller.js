import { aiService } from './ai.service.js';
import { tenantService } from '../tenants/tenant.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const askCopilot = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
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
export const scoreOpportunity = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    try {
        const scoreData = await aiService.calculateLeadScore(parseInt(id), tenantId);
        res.json(scoreData);
    }
    catch (err) {
        if (err.message === 'Oportunidad no encontrada') {
            throw new AppError(err.message, 404);
        }
        throw err;
    }
});
export const getClientBrief = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    // Phase 14: Plan-based feature flags
    const isEnabled = await tenantService.isFeatureEnabled(tenantId, 'aiBriefs');
    if (!isEnabled) {
        throw new AppError('La función AI Briefing requiere un plan superior (PRO/Enterprise).', 403);
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    await aiService.streamClientBriefing(parseInt(id), tenantId, res);
});
export const getSmartAlerts = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const alerts = await aiService.getSmartAlerts(tenantId);
    res.json(alerts);
});
