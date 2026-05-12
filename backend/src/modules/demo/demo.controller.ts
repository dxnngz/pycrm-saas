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

    const labelMap: Record<string, string> = {
        clients: 'clientes',
        products: 'productos',
        opportunities: 'oportunidades',
        tasks: 'tareas',
        events: 'eventos',
        documents: 'documentos',
        contacts: 'contactos',
    };
    const createdTotal = Object.values(result.created).reduce((acc, v) => acc + (Number(v) || 0), 0);
    const createdParts = Object.entries(result.created)
        .filter(([, v]) => (Number(v) || 0) > 0)
        .map(([k, v]) => `+${Number(v) || 0} ${(labelMap[k] || k)}`);

    res.status(200).json({
        success: true,
        message: createdTotal > 0
            ? `Datos demo listos (${createdParts.join(', ')})`
            : 'Datos demo listos (sin cambios)',
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
