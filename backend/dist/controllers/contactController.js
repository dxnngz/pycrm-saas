import * as contactService from '../services/contactService.js';
export const listByClient = async (req, res, next) => {
    try {
        const clientId = parseInt(req.params.clientId);
        const items = await contactService.getContactsByClientId(clientId);
        res.json(items);
    }
    catch (err) {
        next(err);
    }
};
export const create = async (req, res, next) => {
    try {
        const created = await contactService.createContact(req.body);
        res.status(201).json(created);
    }
    catch (err) {
        next(err);
    }
};
