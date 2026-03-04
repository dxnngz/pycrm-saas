import { clientService } from './client.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const getClients = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const clients = await clientService.getAllClients(page, limit, search);
    res.json(clients);
});
export const createClient = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const client = await clientService.createClient(req.body, tenantId);
    res.status(201).json(client);
});
export const updateClient = asyncHandler(async (req, res) => {
    try {
        const client = await clientService.updateClientById(parseInt(req.params.id), req.body);
        res.json(client);
    }
    catch (error) {
        if (error.code === 'P2025') { // Code for record not found in Prisma
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});
export const deleteClient = asyncHandler(async (req, res) => {
    try {
        await clientService.deleteClientById(parseInt(req.params.id));
        res.json({ message: 'Cliente eliminado correctamente' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Cliente no encontrado', 404);
        }
        throw error;
    }
});
export const getClientOpportunities = asyncHandler(async (req, res) => {
    const opportunities = await clientService.getClientOpportunitiesById(parseInt(req.params.id));
    res.json(opportunities);
});
