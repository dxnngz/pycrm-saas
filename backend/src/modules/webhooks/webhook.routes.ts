import { Router } from 'express';
import { handleStripeWebhook, handleGenericWebhook } from './webhook.controller.js';

const router = Router();

// Endpoint for Stripe (requires raw body, assumes middleware configured globally or here)
router.post('/stripe', handleStripeWebhook);

// Generic endpoint for other integrations
router.post('/generic', handleGenericWebhook);

export default router;
