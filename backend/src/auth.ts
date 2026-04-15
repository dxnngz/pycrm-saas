import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from './env.js';

const JWT_KEY = env.JWT_SECRET;


export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

export const generateToken = (userId: number, role: string, tenantId: number) => {
    const jti = crypto.randomUUID();
    return jwt.sign({ userId, role, tenantId, jti }, JWT_KEY, { expiresIn: '1h' });
};

export const generateRefreshToken = (userId: number, tenantId: number) => {
    const jti = crypto.randomUUID();
    return jwt.sign({ userId, tenantId, jti }, JWT_KEY, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_KEY);
};


export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token missing' });

    jwt.verify(token, JWT_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });

        const payload = decoded as any;
        // JWT is signed with { userId, tenantId, role, jti }
        // Normalize both `id` and `userId` so all controllers work regardless of which they access
        req.user = {
            id: payload.userId ?? payload.id,
            userId: payload.userId ?? payload.id,
            tenantId: payload.tenantId,
            email: payload.email ?? '',
            role: payload.role ?? 'empleado',
            name: payload.name ?? '',
            jti: payload.jti,
        } as Express.UserPayload;
        next();
    });
};
