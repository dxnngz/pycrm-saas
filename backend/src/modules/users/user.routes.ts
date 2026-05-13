import { Router } from 'express';
import * as userController from './user.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requirePermission, Permission } from '../../core/middlewares/rbac.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { createUserSchema, updateUserRoleSchema } from './user.schema.js';

const router = Router();

router.use(protect);

router.get('/', requirePermission(Permission.READ_USER), userController.getAllUsers);
router.post('/', validate(createUserSchema), requirePermission(Permission.WRITE_USER), userController.createUser);
router.put('/:id/role', validate(updateUserRoleSchema), requirePermission(Permission.WRITE_USER), userController.updateUserRole);
router.delete('/:id', requirePermission(Permission.DELETE_USER), userController.deleteUser);

export default router;
