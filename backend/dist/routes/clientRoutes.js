import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../schemas/apiSchemas.js';
import { getClients, createClient, updateClient, deleteClient, getClientOpportunities } from '../controllers/clientController.js';
const router = Router();
/**
 * @openapi
 * /api/clients:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getClients);
/**
 * @openapi
 * /api/clients:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, validate(clientSchema), createClient);
/**
 * @openapi
 * /api/clients/{id}:
 *   put:
 *     summary: Actualizar un cliente existente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, validate(clientSchema), updateClient);
/**
 * @openapi
 * /api/clients/{id}:
 *   delete:
 *     summary: Eliminar un cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, deleteClient);
/**
 * @openapi
 * /api/clients/{id}/opportunities:
 *   get:
 *     summary: Obtener oportunidades de un cliente específico
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/opportunities', authenticateToken, getClientOpportunities);
export default router;
