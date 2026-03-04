import { Request, Response } from 'express';
import { contactService } from './contact.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listByClient = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const clientId = parseInt(req.params.clientId as string);
    const items = await contactService.getContactsByClientId(tenantId, clientId);
    res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const created = await contactService.createContact(req.body, tenantId);
    res.status(201).json(created);
});
