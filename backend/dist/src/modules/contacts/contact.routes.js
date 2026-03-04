import { Router } from 'express';
import * as contactController from './contact.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
const router = Router();
router.use(protect);
router.get('/:clientId', contactController.listByClient);
router.post('/', contactController.create);
export default router;
