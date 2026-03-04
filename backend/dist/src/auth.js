import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET environment variable is not defined!');
    }
    console.warn('WARNING: JWT_SECRET is not defined, using fallback. Not safe for production.');
}
const JWT_KEY = SECRET || 'fallback_secret_key_123';
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
export const generateToken = (userId, role, tenantId) => {
    return jwt.sign({ userId, role, tenantId }, JWT_KEY, { expiresIn: '1h' });
};
export const generateRefreshToken = (userId, tenantId) => {
    const jti = crypto.randomUUID();
    return jwt.sign({ userId, tenantId, jti }, JWT_KEY, { expiresIn: '7d' });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_KEY);
};
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Token missing' });
    jwt.verify(token, JWT_KEY, (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};
