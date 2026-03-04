import { Router } from 'express';
import * as automationController from './automation.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', automationController.getAutomations);
router.post('/', automationController.createAutomation);
router.patch('/:id/toggle', automationController.toggleAutomation);

export default router;
