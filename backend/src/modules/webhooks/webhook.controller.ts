import { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { addReportJob } from '../../jobs/queue.js';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers['stripe-signature'];
        // In a real app we'd verify the signature with Stripe SDK
        logger.info(`Stripe webhook received with signature: ${signature}`);

        const event = req.body;

        switch (event.type) {
            case 'payment_intent.succeeded':
                logger.info('Payment succeeded!');
                // Automatically generate a report for the user (mock user ID 1)
                await addReportJob(1, 'payment_success_analytics');
                break;
            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error(error, 'Error handling Stripe webhook:');
        res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    }
};

export const handleGenericWebhook = async (req: Request, res: Response) => {
    try {
        logger.info({ body: req.body }, 'Generic Webhook received');
        res.status(200).json({ status: 'success', message: 'Webhook processed' });
    } catch (error) {
        logger.error(error, 'Error processing generic webhook:');
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
