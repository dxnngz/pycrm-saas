// PyCRM Backend - Deployment Version: 1.2.1
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/dist/queueAdapters/bullMQ.js';
import { ExpressAdapter } from '@bull-board/express';
import authRoutes from './modules/auth/auth.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import contactRoutes from './modules/contacts/contact.routes.js';
import opportunityRoutes from './modules/opportunities/opportunity.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import userRoutes from './modules/users/user.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import tenantRoutes from './modules/tenants/tenant.routes.js';
import telemetryRoutes from './modules/telemetry/telemetry.routes.js';
import integrationRoutes from './modules/integrations/integrations.routes.js';
import healthRoutes from './modules/health/health.controller.js';
import productRoutes from './modules/products/product.routes.js';
import eventRoutes from './modules/events/event.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import automationRoutes from './modules/automations/automation.routes.js';
import webhookRoutes from './modules/webhooks/webhook.routes.js';

import { globalErrorHandler } from './core/middlewares/error.middleware.js';
import { requestIdMiddleware } from './core/middlewares/requestId.middleware.js';
import { protect } from './core/middlewares/auth.middleware.js';
import { requireRole, SystemRole } from './core/middlewares/rbac.middleware.js';

import { tenantService } from './modules/tenants/tenant.service.js';
import { emailQueue, reportQueue, systemQueue } from './jobs/queue.js';
import { getMetrics, getContentType, httpRequestDurationMicroseconds } from './core/metrics.js';
import { env } from './env.js';

const app = express();
const port = env.PORT || 3001;

// Trust proxy for Render/Vercel (needed for secure cookies)
app.set('trust proxy', 1);

// --- SECURITY & CORE MIDDLEWARES ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Temporarily disable CSP to rule out blocked requests
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json());

// Permissive CORS for troubleshooting deployment
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-csrf-token', 'x-request-id'],
    optionsSuccessStatus: 204
}));

app.use(requestIdMiddleware);

// --- DEBUG MIDDLEWARE ---
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Logging with Pino
app.use(pinoHttp({
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    autoLogging: false,
    genReqId: (req: any) => req.id || req.headers['x-request-id'],
    customProps: (req: any) => ({
        tenantId: req.user?.tenantId || 'anonymous',
        userId: req.user?.userId || 'anonymous',
        trace_id: req.id
    })
}));

// Global IP Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => ipKeyGenerator(req.ip || 'unknown'),
    skip: (req) => {
        const ip = req.ip || req.socket.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    },
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(globalLimiter);

// Metrics Middleware
app.use((req, res, next) => {
    if (!req.path.startsWith('/api') || req.path === '/api/health') return next();
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        const tenantId = (req as any).user?.tenantId ? String((req as any).user.tenantId) : 'anonymous';
        end({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode,
            tenant_id: tenantId
        });
    });
    next();
});

// --- API DOCUMENTATION ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PyCRM API Documentation',
            version: '1.0.0',
            description: 'Interactive documentation for the PyCRM backend services.',
        },
        servers: [
            { url: 'https://pycrm-backend-m22i.onrender.com', description: 'Production Server' },
            { url: `http://localhost:${port}`, description: 'Development Server' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
    },
    apis: ['./src/modules/**/*.ts', './dist/modules/**/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- ADMIN DASHBOARDS ---
// BullBoard is only available when Redis is configured
if (env.REDIS_URL) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    const bullQueues = [emailQueue, reportQueue, systemQueue].filter(Boolean) as any[];
    createBullBoard({
        queues: bullQueues.map((queue) => new BullMQAdapter(queue)),
        serverAdapter: serverAdapter,
    });
    app.use('/admin/queues', protect, requireRole([SystemRole.ADMIN]), serverAdapter.getRouter());
} else {
    app.use('/admin/queues', (req, res) => {
        res.status(503).json({ status: 'unavailable', message: 'Queue dashboard requires Redis configuration.' });
    });
}

// Prometheus Metrics
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', getContentType());
    res.end(await getMetrics());
});

// --- API ROUTES ---
app.use('/api/auth', authRoutes);

// Tenant Rate Limiter
const tenantLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: async (req) => {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return 100;
        try {
            const { plan } = await tenantService.getTenantPlan(tenantId);
            switch (plan) {
                case 'enterprise': return 2000;
                case 'pro': return 500;
                default: return 100;
            }
        } catch (error) {
            return 100;
        }
    },
    keyGenerator: (req) => (req as any).user?.tenantId ? `tenant_${(req as any).user.tenantId}` : ipKeyGenerator(req.ip || 'unknown'),
    message: {
        status: 429,
        error: 'Too many requests from your Organization.',
        message: 'Rate limit exceeded for your plan.'
    }
});
app.use('/api', tenantLimiter);

// Module Routes
app.use('/api/clients', clientRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/health', healthRoutes);

// Catch-all 404 for API routes
app.use('/api/*', (req, res) => {
    logger.warn({ path: req.originalUrl, method: req.method }, '404 - API Route Not Found');
    res.status(404).json({
        success: false,
        message: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor.`
    });
});

// Error Handling
app.use(globalErrorHandler);

export default app;
