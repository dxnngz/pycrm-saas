import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError.js';
import { contextStore } from '../context.js';
const JWT_KEY = process.env.JWT_SECRET || 'fallback_secret_key_123';
export const protect = (req, res, next) => {
    // 1. Obtiene el token de manera ultra-segura desde la cookie (Blindaje XSS)
    const token = req.cookies.jwt;
    if (!token) {
        return next(new AppError('No estás autenticado. Por favor, inicia sesión.', 401));
    }
    jwt.verify(token, JWT_KEY, (err, decoded) => {
        if (err) {
            return next(new AppError('Token inválido o expirado.', 401));
        }
        // 2. Adjuntar usuario a la request para uso futuro (Ej. Role based access)
        req.user = decoded;
        // 3. Montar el Contexto de Ejecución Asíncrona para Prisma Audit Logs y Multi-Tenant
        contextStore.run({ userId: decoded.userId, tenantId: decoded.tenantId, requestId: req.id }, () => {
            next();
        });
    });
};
