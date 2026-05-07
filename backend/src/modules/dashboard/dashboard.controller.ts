import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as 'monthly' | 'yearly') || 'monthly';
    const refreshRaw = req.query.refresh;
    const refreshValue = Array.isArray(refreshRaw) ? refreshRaw[0] : refreshRaw;
    const forceRefresh = refreshValue === '1' || refreshValue === 'true';
    const tenantId = req.user!.tenantId;
    const metrics = await dashboardService.getDashboardMetrics(tenantId, period, { forceRefresh });
    res.json(metrics);
});

export const getActivity = asyncHandler(async (req: Request, res: Response) => {
    const limitRaw = req.query.limit;
    const limitValue = Array.isArray(limitRaw) ? limitRaw[0] : limitRaw;
    const limit = limitValue ? Number(limitValue) : 10;
    const tenantId = req.user!.tenantId;
    const activity = await dashboardService.getRecentActivity(tenantId, limit);
    res.json(activity);
});
