import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET environment variable is not defined!');
    }
    console.warn('WARNING: JWT_SECRET is not defined, using fallback. Not safe for production.');
}
const JWT_KEY = SECRET || 'fallback_secret_key_123';


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

    jwt.verify(token, JWT_KEY, (err: any, user: any) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });

        (req as any).user = user;
        next();
    });
};
