import { contactService } from './contact.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
export const listByClient = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    const clientId = parseInt(req.params.clientId);
    const items = await contactService.getContactsByClientId(tenantId, clientId);
    res.json(items);
});
export const create = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    const created = await contactService.createContact(req.body, tenantId);
    res.status(201).json(created);
});
