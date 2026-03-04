import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/metrics', dashboardController.getMetrics);

export default router;
