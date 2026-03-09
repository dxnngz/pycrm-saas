import { clientService } from './client.service.js';
import { tenantService } from '../tenants/tenant.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { eventBus } from '../../core/eventBus.js';
export const getClients = asyncHandler(async (req, res) => {
    const { limit, search, cursor } = req.query;
    const { user } = req;
    const clients = await clientService.getAllClients(user.tenantId, {
        limit: limit ? parseInt(limit) : 10,
        search: search,
        cursor: cursor ? parseInt(cursor) : undefined
    });
    res.json(clients);
});
export const createClient = asyncHandler(async (req, res) => {
    const { user } = req;
    // Phase 14: Plan-based limits
    const canCreate = await tenantService.checkLimit(user.tenantId, 'clients');
    if (!canCreate) {
        throw new AppError('Límite de clientes alcanzado para su plan actual. Por favor, suba de nivel.', 403);
    }
    // req.body is already validated and sanitized by Zod
    const client = await clientService.createClient(req.body, user.tenantId);
    eventBus.emit('client.created', { tenantId: user.tenantId, userId: user.userId, data: client });
    res.status(201).json(client);
});
export const updateClient = asyncHandler(async (req, res) => {
    try {
        const { user } = req;
        const id = parseInt(req.params.id);
        const client = await clientService.updateClientById(user.tenantId, id, req.body);
        eventBus.emit('client.updated', { tenantId: user.tenantId, userId: user.userId, data: client });
        res.json(client);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});
export const deleteClient = asyncHandler(async (req, res) => {
    try {
        const { user } = req;
        const id = parseInt(req.params.id);
        await clientService.deleteClientById(user.tenantId, id);
        eventBus.emit('client.deleted', { tenantId: user.tenantId, userId: user.userId, data: { id } });
        res.json({ message: 'Cliente eliminado correctamente' });
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});
export const getClientOpportunities = asyncHandler(async (req, res) => {
    const { user } = req;
    const id = parseInt(req.params.id);
    const opportunities = await clientService.getClientOpportunitiesById(user.tenantId, id);
    res.json(opportunities);
});
