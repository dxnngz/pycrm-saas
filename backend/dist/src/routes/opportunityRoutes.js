import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { validate } from '../middleware/validate.js';
import { opportunitySchema, statusUpdateSchema } from '../schemas/apiSchemas.js';
import { getOpportunities, createOpportunity, updateOpportunityStatus, getLeadScore } from '../controllers/opportunityController.js';
const router = Router();
/**
 * @openapi
 * /api/opportunities:
 *   get:
 *     summary: Listar todas las oportunidades de negocio
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getOpportunities);
router.get('/:id/score', authenticateToken, getLeadScore);
/**
 * @openapi
 * /api/opportunities:
 *   post:
 *     summary: Abrir una nueva oportunidad comercial
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, validate(opportunitySchema), createOpportunity);
/**
 * @openapi
 * /api/opportunities/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de una oportunidad
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', authenticateToken, validate(statusUpdateSchema), updateOpportunityStatus);
export default router;
