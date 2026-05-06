import nodemailer from 'nodemailer';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';

const getFromEmail = (): string => {
    const raw = (env.SMTP_FROM || env.SMTP_USER || '').trim();
    if (!raw) return '';

    const match = raw.match(/<([^>]+)>/);
    const candidate = (match?.[1] || raw).trim();
    if (!candidate.includes('@')) return '';
    return candidate;
};

const fromEmail = getFromEmail();
const fromHeader = fromEmail ? `"${env.APP_NAME || 'SaaS CRM'}" <${fromEmail}>` : '';

// Create generic transporter (SMTP configuration should come from env)
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

void transporter.verify().then(() => {
    logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT, fromEmail }, 'SMTP transporter verified');
}).catch((error) => {
    logger.error({ err: error?.message || error, host: env.SMTP_HOST, port: env.SMTP_PORT, fromEmail }, 'SMTP transporter verify failed');
});

export const sendEmail = async ({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) => {
    try {
        if (!fromHeader) {
            throw new Error('SMTP_FROM is missing or invalid (must be a real email address)');
        }
        const info = await transporter.sendMail({
            from: fromHeader,
            to,
            subject,
            text,
            html,
        });
        logger.info({ messageId: info.messageId, to, subject, fromEmail }, 'Email sent');
        return info;
    } catch (error) {
        logger.error({ err: (error as any)?.message || error, to, subject, fromEmail }, 'Error sending email');
        throw error;
    }
};
