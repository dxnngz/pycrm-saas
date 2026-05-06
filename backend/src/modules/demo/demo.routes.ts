import { Router } from 'express';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { requireRole, SystemRole } from '../../core/middlewares/rbac.middleware.js';
import * as demoController from './demo.controller.js';

const router = Router();

router.use(protect, requireRole([SystemRole.ADMIN]));

router.post('/seed', demoController.seedDemoData);
router.post('/test-email', demoController.sendTestEmail);

export default router;

