import { documentService } from './document.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const getDocuments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const tenantId = req.user?.tenantId;
    const result = await documentService.getAllDocuments(tenantId, page, limit, search);
    res.json(result);
});
export const createDocument = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    // Basic casting mapping from JSON
    const data = {
        ...req.body,
        client_id: req.body.client_id ? parseInt(req.body.client_id) : null,
        opportunity_id: req.body.opportunity_id ? parseInt(req.body.opportunity_id) : null,
        amount: req.body.amount ? parseFloat(req.body.amount) : null
    };
    const doc = await documentService.createDocument(data, tenantId);
    res.status(201).json(doc);
});
export const updateDocument = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const data = {
        ...req.body,
        client_id: req.body.client_id ? parseInt(req.body.client_id) : null,
        opportunity_id: req.body.opportunity_id ? parseInt(req.body.opportunity_id) : null,
        amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : null
    };
    try {
        const tenantId = req.user?.tenantId;
        const doc = await documentService.updateDocumentById(tenantId, id, data, req.body.version);
        res.json(doc);
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Documento no encontrado o modificado por otro usuario de forma concurrente', 409);
        }
        throw error;
    }
});
export const deleteDocument = asyncHandler(async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        await documentService.deleteDocumentById(tenantId, parseInt(req.params.id));
        res.json({ message: 'Documento eliminado correctamente' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Documento no encontrado', 404);
        }
        throw error;
    }
});
