import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { demoService } from './demo.service.js';
import { sendEmail } from '../../core/mailer.js';

export const seedDemoData = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId) throw new AppError('No autenticado', 401);

    const before = await demoService.getTenantSnapshot(tenantId);
    const result = await demoService.seedTenantDemoData(tenantId, userId);
    const after = await demoService.getTenantSnapshot(tenantId);

    res.status(200).json({
        success: true,
        message: (result.created.clients + result.created.products + result.created.opportunities + result.created.tasks + result.created.events + result.created.documents + result.created.contacts) > 0
            ? 'Datos de demostración creados'
            : 'Ya existen datos. No se han creado duplicados.',
        before,
        created: result.created,
        after,
    });
});

export const sendTestEmail = asyncHandler(async (req: Request, res: Response) => {
    const to = String(req.body?.to || '').trim();
    if (!to) throw new AppError('El campo "to" es obligatorio', 400);

    await sendEmail({
        to,
        subject: 'PyCRM - Email de prueba',
        text: 'Si has recibido este email, la configuración SMTP está funcionando correctamente.',
        html: '<p>Si has recibido este email, la configuración SMTP está funcionando correctamente.</p>',
    });

    res.status(200).json({ success: true, message: 'Email de prueba enviado' });
});

