import { Request, Response } from 'express';
import { integrationService } from './integrations.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const { channel, recipient, message, metadata } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
        throw new AppError('Tenant context missing', 400);
    }

    if (!channel || !recipient || !message) {
        throw new AppError('Channel, recipient, and message are required', 400);
    }

    const result = await integrationService.sendMessage({
        tenantId,
        channel,
        recipient,
        message,
        metadata
    });

    res.json({
        success: true,
        data: result
    });
});

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
    // Audit integration health or list active webhooks
    res.json({
        whatsapp: 'operational',
        slack: 'operational',
        teams: 'operational'
    });
});
