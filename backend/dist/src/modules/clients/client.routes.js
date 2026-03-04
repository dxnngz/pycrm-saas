import { Router } from 'express';
import * as clientController from './client.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requirePermission, Permission } from '../../core/middlewares/rbac.middleware.js';
import { validate } from '../../middleware/validate.js';
import { clientSchema } from '../../schemas/apiSchemas.js';
const router = Router();
router.use(protect); // Todas las rutas de cliente requieren autenticación
router.get('/', requirePermission(Permission.READ_CLIENT), clientController.getClients);
router.post('/', requirePermission(Permission.WRITE_CLIENT), validate(clientSchema), clientController.createClient);
router.put('/:id', requirePermission(Permission.WRITE_CLIENT), validate(clientSchema), clientController.updateClient);
router.delete('/:id', requirePermission(Permission.DELETE_CLIENT), clientController.deleteClient);
// Ruta anidada u orientada a recurso específico
router.get('/:id/opportunities', requirePermission(Permission.READ_CLIENT), clientController.getClientOpportunities);
export default router;
