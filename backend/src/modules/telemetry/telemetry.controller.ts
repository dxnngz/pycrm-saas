import { Request, Response } from 'express';
import { telemetryService } from './telemetry.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
    // Only admins should access this
    if ((req as any).user?.role !== 'admin') {
        throw new AppError('Forbidden: Admin access required', 403);
    }

    const overview = await telemetryService.getSystemOverview();
    res.json(overview);
});

export const getMyUsage = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const usage = await telemetryService.getTenantUsage(tenantId);
    res.json(usage);
});
