import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
export const getMetrics = asyncHandler(async (req, res) => {
    const period = req.query.period || 'monthly';
    const tenantId = req.user.tenantId;
    const metrics = await dashboardService.getDashboardMetrics(tenantId, period);
    res.json(metrics);
});
