import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
export const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, SECRET, { expiresIn: '24h' });
};
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Token missing' });
    jwt.verify(token, SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};
