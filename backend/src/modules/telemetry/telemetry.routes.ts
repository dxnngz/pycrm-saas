import { Router } from 'express';
import * as telemetryController from './telemetry.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/overview', telemetryController.getOverview);
router.get('/usage', telemetryController.getMyUsage);

export default router;
