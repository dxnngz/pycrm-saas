import { aiService } from './ai.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const askCopilot = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { query } = req.body;
    if (!query) {
        throw new AppError('La consulta (query) es requerida', 400);
    }
    const response = await aiService.copilotQuery(tenantId, query);
    res.json(response);
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
