import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../auth.js';
const router = Router();
router.use(authenticateToken);
router.get('/metrics', dashboardController.getMetrics);
export default router;
