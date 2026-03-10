import { Router } from 'express';
import * as integrationsController from './integrations.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schema for outgoing messages
const messageSchema = z.object({
    body: z.object({
        channel: z.enum(['whatsapp', 'slack', 'teams', 'email']),
        recipient: z.string().min(1),
        message: z.string().min(1),
        metadata: z.record(z.string(), z.any()).optional()
    })
});

router.use(protect);

router.post('/send', validate(messageSchema), integrationsController.sendMessage);
router.get('/status', integrationsController.getStatus);

export default router;
