import { Router } from 'express';
import * as tenantController from './tenant.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requireRole, SystemRole } from '../../core/middlewares/rbac.middleware.js';

const router = Router();

router.use(protect);

router.get('/my-plan', tenantController.getMyPlan);
router.put('/settings', requireRole([SystemRole.ADMIN, SystemRole.MANAGER]), tenantController.updateSettings);
router.post('/upgrade', tenantController.upgradePlan);

export default router;
