import { Request, Response } from 'express';
import { clientService } from './client.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { eventBus } from '../../core/eventBus.js';

export const getClients = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const tenantId = (req as any).user?.tenantId;
    const clients = await clientService.getAllClients(tenantId, page, limit, search);
    res.json(clients);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const client = await clientService.createClient(req.body, tenantId);

    eventBus.emit('client.created', { tenantId, userId: (req as any).user?.userId, data: client });

    res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        const client = await clientService.updateClientById(tenantId, parseInt(req.params.id as string), req.body);
        res.json(client);
    } catch (error: any) {
        if (error.code === 'P2025') { // Code for record not found in Prisma
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        await clientService.deleteClientById(tenantId, parseInt(req.params.id as string));
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});

export const getClientOpportunities = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const opportunities = await clientService.getClientOpportunitiesById(tenantId, parseInt(req.params.id as string));
    res.json(opportunities);
});
