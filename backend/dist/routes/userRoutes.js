import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../auth.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { roleUpdateSchema } from '../schemas/apiSchemas.js';
const router = Router();
// Only admins can manage users
router.use(authenticateToken);
router.use(roleMiddleware(['admin']));
router.get('/', userController.getAllUsers);
router.put('/:id/role', validate(roleUpdateSchema), userController.updateUserRole);
router.delete('/:id', userController.deleteUser);
export default router;
