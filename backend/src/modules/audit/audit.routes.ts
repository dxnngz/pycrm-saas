import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, auditController.getLogs);

export default router;
