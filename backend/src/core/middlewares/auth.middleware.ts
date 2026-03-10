import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError.js';
import { contextStore } from '../context.js';
import { logger } from '../../utils/logger.js';
import { redisCache } from '../redis.js';

const JWT_KEY = process.env.JWT_SECRET || 'fallback_secret_key_123';

interface JWTPayload extends jwt.JwtPayload {
    userId: number;
    tenantId: number;
    role: string;
    email: string;
    name: string;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('No estás autenticado. Por favor, inicia sesión.', 401));
    }

    jwt.verify(token, JWT_KEY, async (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err || !decoded) {
            return res.status(401).json({ error: 'Auth failed' });
        }

        const payload = decoded as JWTPayload;
        const currentContext = contextStore.getStore();

        // REDIS REVOCATION CHECK: Elite security
        if (payload.jti) {
            const isBlacklisted = await redisCache.isTokenBlacklisted(payload.jti);
            if (isBlacklisted) {
                return next(new AppError('Sesión invalidada por motivos de seguridad.', 401));
            }
        }

        req.user = {
            id: payload.userId,
            tenantId: payload.tenantId,
            role: payload.role,
            email: payload.email,
            name: payload.name
        } as any;

        // Ensure req.id is set for consistency, even if not used directly in contextStore.run
        // It might be used by other middlewares or logging outside the contextStore.run scope.
        req.id = req.id || payload.jti || `req-${Math.random().toString(36).substr(2, 9)}`;
        const requestId = (currentContext?.requestId || req.id || payload.jti) as string;

        contextStore.run({
            ...currentContext,
            userId: payload.userId,
            tenantId: payload.tenantId,
            requestId
        }, () => {
            logger.info({
                msg: 'Authenticated Request',
                requestId,
                userId: payload.userId,
                tenantId: payload.tenantId,
                path: req.path
            });
            next();
        });
    });
};

export const authMiddleware = protect;
