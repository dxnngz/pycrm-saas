import { Router } from 'express';
import * as clientController from './client.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requirePermission, Permission } from '../../core/middlewares/rbac.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { createClientSchema, updateClientSchema, getClientsSchema, clientIdSchema } from './client.schema.js';

const router = Router();

router.use(protect);

router.get('/', validate(getClientsSchema), requirePermission(Permission.READ_CLIENT), clientController.getClients);
router.post('/', validate(createClientSchema), requirePermission(Permission.WRITE_CLIENT), clientController.createClient);
router.put('/:id', validate(updateClientSchema), requirePermission(Permission.WRITE_CLIENT), clientController.updateClient);
router.delete('/:id', validate(clientIdSchema), requirePermission(Permission.DELETE_CLIENT), clientController.deleteClient);
router.get('/:id/opportunities', validate(clientIdSchema), requirePermission(Permission.READ_CLIENT), clientController.getClientOpportunities);

export default router;
