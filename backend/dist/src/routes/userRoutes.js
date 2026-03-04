import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../auth.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
const router = Router();
// Only admins can manage users
router.use(authenticateToken);
router.use(roleMiddleware(['admin']));
router.get('/', userController.getAllUsers);
router.put('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);
export default router;
