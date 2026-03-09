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
import authRoutes from './modules/auth/auth.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import opportunityRoutes from './modules/opportunities/opportunity.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import webhookRoutes from './modules/webhooks/webhook.routes.js';
import userRoutes from './modules/users/user.routes.js';
// Cleaned up unused legacy routes below these line
import contactRoutes from './modules/contacts/contact.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import tenantRoutes from './modules/tenants/tenant.routes.js';
import telemetryRoutes from './modules/telemetry/telemetry.routes.js';
import { globalErrorHandler } from './core/middlewares/error.middleware.js';
import { csrfProtection } from './core/middlewares/csrf.middleware.js';
import { startWorkers } from './jobs/worker.js';
import { requestIdMiddleware } from './core/middlewares/requestId.middleware.js';
import { prisma } from './core/prisma.js';
import { redisCache } from './core/redis.js';
import { getMetrics, getContentType, httpRequestDurationMicroseconds } from './core/metrics.js';
import { env } from './env.js';
import { hashPassword } from './auth.js';
import { commercialIntelligenceJob } from './jobs/commercialIntelligence.js';
import { protect } from './core/middlewares/auth.middleware.js';
import { requirePermission, Permission, SystemRole, requireRole } from './core/middlewares/rbac.middleware.js';
import { emailQueue, reportQueue, systemQueue } from './jobs/queue.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/dist/queueAdapters/bullMQ.js';
import { ExpressAdapter } from '@bull-board/express';

const app = express();
const port = env.PORT || 3001;

// --- CONFIGURACIÓN DE SEGURIDAD PROFESIONAL (Arquitectura Senior) ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:3001", "http://127.0.0.1:3001", "ws://localhost:5173", "https://pycrm-backend-m22i.onrender.com", "https://pycrm-saas.vercel.app"]
        }
    }
}));

app.use(compression());
app.use(cookieParser());

// Configuración de CORS estricta y segura
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        const isVercel = origin && origin.endsWith('.vercel.app');
        const isDev = !origin || origin.includes('localhost') || origin.includes('127.0.0.1');
        const isAllowed = isDev || allowedOrigins.includes(origin) || isVercel;

        if (isAllowed) {
            callback(null, true);
        } else {
            logger.warn(`[CORS Blocked] Origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-csrf-token', 'x-request-id']
}));

// ---------------------------------------------------------------------

// Request ID Injection
app.use(requestIdMiddleware);

// Logging estructurado con Pino
app.use(pinoHttp({
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    autoLogging: false, // Evitamos ruido excesivo en logs de producción
    genReqId: (req, res) => {
        return (req as any).id || res.getHeader('X-Request-Id');
    },
    customProps: (req, res) => {
        // Obtenemos el contexto desde el req si está disponible (inyectado por auth.middleware)
        return {
            tenantId: (req as any).user?.tenantId || 'anonymous',
            userId: (req as any).user?.userId || 'anonymous',
            trace_id: (req as any).id
        };
    }
}));
// ---------------------------------------------------------------------


// Global IP Rate Limiter (For public endpoints like Auth/Registration)
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

app.use(express.json());

// Metrics Middleware
app.use((req, res, next) => {
    // Only track latency for /api routes to avoid noise
    if (!req.path.startsWith('/api') || req.path === '/api/health') {
        return next();
    }

    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        // Tenant ID is injected later in auth, so we fetch it safely if it exists
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

// Swagger definition (Re-agregado por arquitectura senior)
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PyCRM API Documentation',
            version: '1.0.0',
            description: 'Interactive documentation for the PyCRM backend services. Developed for TFG Excellence.',
        },
        servers: [{ url: `http://localhost:${port}`, description: 'Development Server' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- BullBoard Dashboard (Queue Monitoring) ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(reportQueue),
        new BullMQAdapter(systemQueue),
    ],
    serverAdapter: serverAdapter,
});

// Protected route for BullBoard
app.use('/admin/queues', protect, requireRole([SystemRole.ADMIN]), serverAdapter.getRouter());
// ----------------------------------------------

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', getContentType());
    res.end(await getMetrics());
});


import productRoutes from './modules/products/product.routes.js';
import eventRoutes from './modules/events/event.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import automationRoutes from './modules/automations/automation.routes.js';
import { workflowService } from './modules/workflows/workflow.service.js';

// Routes
app.use('/api/auth', authRoutes);

// Apply CSRF protection globally for state mutating endpoints
app.use(csrfProtection);

// Authn-aware Tenant Rate Limiter (Protects internal endpoints against noisy neighbors)
const tenantLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes window
    max: 300, // Strict limit per Tenant per pod
    keyGenerator: (req, res) => {
        if ((req as any).user?.tenantId) {
            return `tenant_${(req as any).user.tenantId}`;
        }
        return ipKeyGenerator(req.ip || 'unknown');
    },
    message: 'Too many requests from your Organization (Tenant). Please try again later.'
});
app.use('/api', tenantLimiter);

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
app.use('/api/telemetry', telemetryRoutes);

app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await prisma.$queryRaw`SELECT 1`;
        let redisStatus = 'disconnected';
        let cacheStats: any = null;
        try {
            await redisCache.ping();
            redisStatus = 'connected';
            cacheStats = await redisCache.getTelemetry();
        } catch (e) {
            redisStatus = 'error';
        }

        res.json({
            status: 'ok',
            message: 'PyCRM API is running',
            database: dbStatus ? 'connected' : 'error',
            redis: redisStatus,
            cache_telemetry: cacheStats,
            memory: {
                rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
            },
            uptime: `${Math.round(process.uptime())}s`,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        req.log.error(err, 'Healthcheck failed');
        res.status(500).json({ status: 'error', message: 'Core dependencies failed' });
    }
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
