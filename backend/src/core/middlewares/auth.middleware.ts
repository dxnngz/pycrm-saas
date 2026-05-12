import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError.js';
import { contextStore } from '../context.js';
import { logger } from '../../utils/logger.js';
import { redisCache } from '../redis.js';
import { env } from '../../env.js';

const JWT_KEY = env.JWT_SECRET;

interface JWTPayload extends jwt.JwtPayload {
    userId: number;
    tenantId: number | string;
    role: string;
    email: string;
    name: string;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = req.cookies?.jwt;
    const bearerToken = req.headers.authorization?.startsWith('Bearer')
        ? req.headers.authorization.split(' ')[1]
        : undefined;

    const candidates = [bearerToken, cookieToken].filter(Boolean) as string[];
    if (candidates.length === 0) {
        return next(new AppError('No estás autenticado. Por favor, inicia sesión.', 401));
    }

    const verifyCandidate = (candidate: string) =>
        new Promise<JWTPayload>((resolve, reject) => {
            jwt.verify(candidate, JWT_KEY, (err: jwt.VerifyErrors | null, decoded: any) => {
                if (err || !decoded) return reject(err || new Error('Auth failed'));
                resolve(decoded as JWTPayload);
            });
        });

    (async () => {
        let payload: JWTPayload | null = null;
        for (const candidate of candidates) {
            try {
                payload = await verifyCandidate(candidate);
                break;
            } catch {
                continue;
            }
        }

        if (!payload) {
            return next(new AppError('No estás autenticado. Por favor, inicia sesión.', 401));
        }

        const currentContext = contextStore.getStore();

        if ((payload as any).jti) {
            const isBlacklisted = await redisCache.isTokenBlacklisted((payload as any).jti);
            if (isBlacklisted) {
                return next(new AppError('Sesión invalidada por motivos de seguridad.', 401));
            }
        }

        req.user = {
            id: Number(payload.userId),
            userId: Number(payload.userId),
            tenantId: Number(payload.tenantId),
            role: payload.role,
            email: payload.email,
            name: payload.name,
            jti: (payload as any).jti
        };

        req.id = req.id || (payload as any).jti || `req-${Math.random().toString(36).substr(2, 9)}`;
        const requestId = (currentContext?.requestId || req.id || (payload as any).jti) as string;

        contextStore.run({
            ...currentContext,
            userId: Number(payload.userId),
            tenantId: Number(payload.tenantId),
            requestId
        }, () => {
            logger.info({
                msg: 'Authenticated Request',
                requestId,
                userId: Number(payload.userId),
                tenantId: Number(payload.tenantId),
                path: req.path
            });
            next();
        });
    })().catch(next);
};

export const authMiddleware = protect;
