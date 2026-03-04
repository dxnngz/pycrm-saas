import * as clientService from '../services/clientService.js';
export const getClients = async (req, res, next) => {
    try {
        const clients = await clientService.getAllClients();
        res.json(clients);
    }
    catch (err) {
        next(err);
    }
};
export const createClient = async (req, res, next) => {
    try {
        const client = await clientService.createClient(req.body);
        res.status(201).json(client);
    }
    catch (err) {
        next(err);
    }
};
export const updateClient = async (req, res, next) => {
    try {
        const client = await clientService.updateClientById(req.params.id, req.body);
        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(client);
    }
    catch (err) {
        next(err);
    }
};
export const deleteClient = async (req, res, next) => {
    try {
        const deleted = await clientService.deleteClientById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente eliminado correctamente' });
    }
    catch (err) {
        next(err);
    }
};
export const getClientOpportunities = async (req, res, next) => {
    try {
        const opportunities = await clientService.getClientOpportunitiesById(req.params.id);
        res.json(opportunities);
    }
    catch (err) {
        next(err);
    }
};
