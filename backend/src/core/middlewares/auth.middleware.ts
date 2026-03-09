import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError.js';
import { contextStore } from '../context.js';

const JWT_KEY = process.env.JWT_SECRET || 'fallback_secret_key_123';

import { redisCache } from '../redis.js';

export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.jwt;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('No estás autenticado. Por favor, inicia sesión.', 401));
    }

    jwt.verify(token, JWT_KEY, async (err: any, decoded: any) => {
        if (err) {
            return next(new AppError('Token inválido o expirado.', 401));
        }

        // REDIS REVOCATION CHECK: Elite security
        if (decoded.jti) {
            const isBlacklisted = await redisCache.isTokenBlacklisted(decoded.jti);
            if (isBlacklisted) {
                return next(new AppError('Sesión invalidada por motivos de seguridad.', 401));
            }
        }

        (req as any).user = decoded;

        contextStore.run({ userId: decoded.userId, tenantId: decoded.tenantId, requestId: (req as any).id }, () => {
            next();
        });
    });
};
