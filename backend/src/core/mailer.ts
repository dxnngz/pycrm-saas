import nodemailer from 'nodemailer';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';

// Create generic transporter (SMTP configuration should come from env)
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

export const sendEmail = async ({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) => {
    try {
        const info = await transporter.sendMail({
            from: `"${env.APP_NAME || 'SaaS CRM'}" <${env.SMTP_FROM || env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });
        logger.info(`Message sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(error, 'Error sending email:');
        throw error;
    }
};
