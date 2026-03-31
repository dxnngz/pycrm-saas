import { Request, Response } from 'express';
import { documentService } from './document.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';

    const tenantId = req.user!.tenantId;
    const result = await documentService.getAllDocuments(tenantId, page, limit, search);
    res.json(result);
});

export const createDocument = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const clientId = req.body.client_id ? parseInt(req.body.client_id) : null;
    const oppId = req.body.opportunity_id ? parseInt(req.body.opportunity_id) : null;
    const amount = req.body.amount ? parseFloat(req.body.amount) : null;

    const data = {
        ...req.body,
        client_id: isNaN(clientId as number) ? null : clientId,
        opportunity_id: isNaN(oppId as number) ? null : oppId,
        amount: isNaN(amount as number) ? null : amount
    };

    const doc = await documentService.createDocument(data, tenantId);
    res.status(201).json(doc);
});

export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const clientId = req.body.client_id ? parseInt(req.body.client_id) : null;
    const oppId = req.body.opportunity_id ? parseInt(req.body.opportunity_id) : null;
    const amount = req.body.amount !== undefined ? parseFloat(req.body.amount) : null;

    const data = {
        ...req.body,
        client_id: isNaN(clientId as number) ? null : clientId,
        opportunity_id: isNaN(oppId as number) ? null : oppId,
        amount: isNaN(amount as number) ? null : amount
    };

    try {
        const tenantId = req.user!.tenantId;
        const doc = await documentService.updateDocumentById(tenantId, id, data, req.body.version);
        res.json(doc);
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Documento no encontrado o modificado por otro usuario de forma concurrente', 409);
        }
        throw error;
    }
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await documentService.deleteDocumentById(tenantId, parseInt(req.params.id as string));
        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Documento no encontrado', 404);
        }
        throw error;
    }
});
