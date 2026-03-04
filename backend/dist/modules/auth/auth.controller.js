import { authService } from './auth.service.js';
import { comparePassword, hashPassword, generateToken, generateRefreshToken, verifyToken } from '../../auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import crypto from 'crypto';
// Utilidad para establecer las cookies JWT seguras
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user.id, user.role, user.tenant_id);
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);
    // Cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora para el AT
        httpOnly: true, // Accesible sólo por la red, no JS
        secure: process.env.NODE_ENV === 'production', // Requiere HTTPS en prod
        sameSite: 'strict'
    };
    const refreshCookieOptions = {
        ...cookieOptions,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    };
    // Double Submit CSRF Token - NO HttpOnly para ser leído por JS
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const csrfCookieOptions = {
        ...cookieOptions,
        httpOnly: false // CRÍTICO: Frontend necesita leerlo
    };
    res.cookie('jwt', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('csrfToken', csrfToken, csrfCookieOptions);
    res.status(statusCode).json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id }
    });
};
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.getUserByEmail(email);
    if (!user) {
        throw new AppError('Email o contraseña incorrectos', 401);
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new AppError('Email o contraseña incorrectos', 401);
    }
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await authService.saveRefreshToken(user.id, refreshToken, expiresAt);
    sendTokenResponse(user, 200, res);
});
export const register = asyncHandler(async (req, res) => {
    if (process.env.ALLOW_OPEN_REGISTRATION === 'false') {
        throw new AppError('Open registration is disabled', 403);
    }
    const { name, email, password, role, companyName } = req.body;
    if (!companyName) {
        throw new AppError('El nombre de la empresa (Tenant) es obligatorio para un SaaS B2B.', 400);
    }
    const passwordHash = await hashPassword(password);
    // Ejecuta transacción atómica: Crea Tenant + Crea Usuario B2B vinculado a dicho Tenant
    const { user, tenant } = await authService.registerTenantWithUser({
        name,
        email,
        passwordHash,
        role: role || 'admin',
        companyName
    });
    const refreshTokenString = generateRefreshToken(user.id, user.tenant_id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await authService.saveRefreshToken(user.id, refreshTokenString, expiresAt);
    sendTokenResponse(user, 201, res);
});
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await authService.deleteRefreshToken(refreshToken);
    }
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.cookie('refreshToken', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.cookie('csrfToken', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: false
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});
export const refreshToken = asyncHandler(async (req, res) => {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) {
        throw new AppError('Refresh token missing', 400);
    }
    const storedToken = await authService.findRefreshToken(rfToken);
    if (!storedToken) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
    const payload = verifyToken(rfToken);
    const user = await authService.getUserProfileById(payload.userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    sendTokenResponse(user, 200, res); // Resets both cookies
});
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await authService.getUserByEmail(email);
    if (!user) {
        return res.status(200).json({ message: 'Si el correo existe, se enviará un enlace de recuperación' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await authService.savePasswordResetToken(user.id, resetToken, expiresAt);
    console.log(`Reset link: http://localhost/reset-password?token=${resetToken}`);
    res.status(200).json({ message: 'Si el correo existe, se enviará un enlace de recuperación' });
});
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const resetData = await authService.findPasswordResetToken(token);
    if (!resetData) {
        throw new AppError('Token inválido o expirado', 400);
    }
    const passwordHash = await hashPassword(newPassword);
    if (resetData.user_id) {
        // Enforce type because user_id string int constraint might complain
        await authService.updatePassword(resetData.user_id, passwordHash);
    }
    await authService.deletePasswordResetToken(token);
    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
});
export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const user = await authService.getUserProfileById(userId);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    res.status(200).json(user);
});
