import * as authService from '../services/authService.js';
import { comparePassword, hashPassword, generateToken, generateRefreshToken, verifyToken } from '../auth.js';
import crypto from 'crypto';
export const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }
        const token = generateToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);
        // Guardar refresh token en DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
        await authService.saveRefreshToken(user.id, refreshToken, expiresAt);
        res.json({
            token,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (err) {
        next(err);
    }
};
export const refreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;
    try {
        if (!refreshToken)
            return res.status(400).json({ message: 'Refresh token missing' });
        const storedToken = await authService.findRefreshToken(refreshToken);
        if (!storedToken)
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        const payload = verifyToken(refreshToken);
        const user = await authService.getUserProfileById(payload.userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const newToken = generateToken(user.id, user.role);
        res.json({ token: newToken });
    }
    catch (err) {
        next(err);
    }
};
export const logout = async (req, res, next) => {
    const { refreshToken } = req.body;
    try {
        if (refreshToken) {
            await authService.deleteRefreshToken(refreshToken);
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (err) {
        next(err);
    }
};
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await authService.getUserByEmail(email);
        if (!user)
            return res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación' });
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
        await authService.savePasswordResetToken(user.id, resetToken, expiresAt);
        // Here you would normally send an email. For now, we return it for the user to see (simulation).
        console.log(`Reset link: http://localhost/reset-password?token=${resetToken}`);
        res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación' });
    }
    catch (err) {
        next(err);
    }
};
export const resetPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;
    try {
        const resetData = await authService.findPasswordResetToken(token);
        if (!resetData)
            return res.status(400).json({ message: 'Token inválido o expirado' });
        const passwordHash = await hashPassword(newPassword);
        await authService.updatePassword(resetData.user_id, passwordHash);
        await authService.deletePasswordResetToken(token);
        res.json({ message: 'Contraseña actualizada con éxito' });
    }
    catch (err) {
        next(err);
    }
};
export const register = async (req, res, next) => {
    if (process.env.ALLOW_OPEN_REGISTRATION === 'false') {
        return res.status(403).json({ message: 'Open registration is disabled' });
    }
    const { name, email, password, role } = req.body;
    try {
        const passwordHash = await hashPassword(password);
        const user = await authService.createUser({ name, email, passwordHash, role });
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
};
export const getProfile = async (req, res, next) => {
    const userId = req.user.userId;
    try {
        const user = await authService.getUserProfileById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    }
    catch (err) {
        next(err);
    }
};
