import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as 'monthly' | 'yearly') || 'monthly';
    const tenantId = req.user!.tenantId;
    const metrics = await dashboardService.getDashboardMetrics(tenantId, period);
    res.json(metrics);
});
