import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import * as dashboardController from '../controllers/dashboardController.js';
const router = Router();
router.get('/metrics', authenticateToken, dashboardController.getMetrics);
export default router;
