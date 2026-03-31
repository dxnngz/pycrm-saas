import { Router } from 'express';
import * as clientController from './client.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requirePermission, Permission } from '../../core/middlewares/rbac.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { createClientSchema, updateClientSchema, getClientsSchema, clientIdSchema } from './client.schema.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management endpoints
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Retrieve a list of clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of clients.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 */
router.get('/', validate(getClientsSchema), requirePermission(Permission.READ_CLIENT), clientController.getClients);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created client
 */
router.post('/', validate(createClientSchema), requirePermission(Permission.WRITE_CLIENT), clientController.createClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated client
 */
router.put('/:id', validate(updateClientSchema), requirePermission(Permission.WRITE_CLIENT), clientController.updateClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete('/:id', validate(clientIdSchema), requirePermission(Permission.DELETE_CLIENT), clientController.deleteClient);

router.get('/:id/opportunities', validate(clientIdSchema), requirePermission(Permission.READ_CLIENT), clientController.getClientOpportunities);

export default router;
