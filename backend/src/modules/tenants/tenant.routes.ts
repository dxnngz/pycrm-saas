import { Router } from 'express';
import * as tenantController from './tenant.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/my-plan', tenantController.getMyPlan);
router.put('/settings', tenantController.updateSettings);
router.post('/upgrade', tenantController.upgradePlan);

export default router;
