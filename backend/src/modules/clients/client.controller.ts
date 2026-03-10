import { Request, Response } from 'express';
import { clientService } from './client.service.js';
import { tenantService } from '../tenants/tenant.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { events } from '../../core/events.js';

// El tipo AuthenticatedRequest ya no es necesario gracias a src/types/express.d.ts
export const getClients = asyncHandler(async (req: Request, res: Response) => {
    const { limit, search, cursor } = req.query as any;
    const user = req.user!;

    const clients = await clientService.getAllClients(user.tenantId, {
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        cursor: cursor ? parseInt(cursor as string) : undefined
    });
    res.json(clients);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    // Phase 14: Plan-based limits
    const canCreate = await tenantService.checkLimit(user.tenantId, 'clients');
    if (!canCreate) {
        throw new AppError('Límite de clientes alcanzado para su plan actual. Por favor, suba de nivel.', 403);
    }

    // req.body is already validated and sanitized by Zod
    const client = await clientService.createClient(req.body, user.tenantId);

    events.emit('workflow:client_created', { tenantId: user.tenantId, userId: user.userId, data: client });

    res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const id = parseInt(req.params.id as string);
        const client = await clientService.updateClientById(user.tenantId, id, req.body);

        events.emit('workflow:client_updated', { tenantId: user.tenantId, userId: user.userId, data: client });

        res.json(client);
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const id = parseInt(req.params.id as string);
        await clientService.deleteClientById(user.tenantId, id);

        events.emit('workflow:client_deleted', { tenantId: user.tenantId, userId: user.userId, data: { id } });

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});

export const getClientOpportunities = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const id = parseInt(req.params.id as string);
    const opportunities = await clientService.getClientOpportunitiesById(user.tenantId, id);
    res.json(opportunities);
});
