import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
const router = Router();
router.use(protect);
router.post('/copilot', aiController.askCopilot);
export default router;
