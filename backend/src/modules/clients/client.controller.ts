import { Request, Response } from 'express';
import { clientService } from './client.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { eventBus } from '../../core/eventBus.js';

// Typed extension for requests authenticated by the JWT middleware
interface AuthenticatedRequest extends Request {
    user: {
        userId: number;
        tenantId: number;
        role: string;
    };
}

export const getClients = asyncHandler(async (req: Request, res: Response) => {
    const { limit, search, cursor } = req.query as any;
    const { user } = req as AuthenticatedRequest;

    const clients = await clientService.getAllClients(user.tenantId, {
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        cursor: cursor ? parseInt(cursor as string) : undefined
    });
    res.json(clients);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    // req.body is already validated and sanitized by Zod
    const client = await clientService.createClient(req.body, user.tenantId);

    eventBus.emit('client.created', { tenantId: user.tenantId, userId: user.userId, data: client });

    res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { user } = req as AuthenticatedRequest;
        const id = parseInt(req.params.id as string);
        const client = await clientService.updateClientById(user.tenantId, id, req.body);

        eventBus.emit('client.updated', { tenantId: user.tenantId, userId: user.userId, data: client });

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
        const { user } = req as AuthenticatedRequest;
        const id = parseInt(req.params.id as string);
        await clientService.deleteClientById(user.tenantId, id);

        eventBus.emit('client.deleted', { tenantId: user.tenantId, userId: user.userId, data: { id } });

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});

export const getClientOpportunities = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const id = parseInt(req.params.id as string);
    const opportunities = await clientService.getClientOpportunitiesById(user.tenantId, id);
    res.json(opportunities);
});
