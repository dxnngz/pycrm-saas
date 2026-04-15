import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { mfaService } from './mfa.service.js';
import { auditService } from './audit.service.js';
import { comparePassword, hashPassword, generateToken, generateRefreshToken, verifyToken } from '../../auth.js';
import { logger } from '../../utils/logger.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import crypto from 'crypto';

// Utilidad para establecer las cookies JWT seguras
const sendTokenResponse = async (user: { id: number; name: string; email: string; role: string | null; tenant_id: number }, statusCode: number, res: Response, req: Request) => {
    const token = generateToken(user.id, user.role || 'empleado', user.tenant_id);
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);

    // Save refresh token to DB (7 days expiry)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authService.saveRefreshToken(user.id, refreshToken, expiresAt);

    const cookieOptions = {
        expires: expiresAt,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const
    };

    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('jwt', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('x-csrf-token', csrfToken, { ...cookieOptions, httpOnly: false });

    res.status(statusCode).json({
        success: true,
        token,
        refreshToken,
        csrfToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role || 'empleado', tenant_id: user.tenant_id }
    });

    await auditService.logAuth(user.id, user.tenant_id, 'LOGIN', { ip: req.ip, userAgent: req.get('user-agent') });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, companyName } = req.body;

    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
        throw new AppError('El usuario ya existe', 400);
    }

    const passwordHash = await hashPassword(password);
    const { user } = await authService.registerTenantWithUser({
        name,
        email,
        passwordHash,
        role: 'admin',
        companyName
    });

    await auditService.logAuth(user.id, user.tenant_id, 'PASSWORD_RESET', { action: 'REGISTER' });
    await sendTokenResponse(user, 201, res, req);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Por favor, proporciona email y contraseña', 400);
    }

    const user = await authService.getUserByEmail(email);
    if (!user || !(await comparePassword(password, user.password))) {
        throw new AppError('Credenciales incorrectas', 401);
    }

    if ((user as any).mfa_enabled) {
        // Return a temporary "mfa_required" token or session
        const mfaToken = generateToken(user.id, 'mfa_pending', user.tenant_id);
        return res.status(200).json({
            success: true,
            mfa_required: true,
            mfa_token: mfaToken
        });
    }

    await sendTokenResponse(user, 200, res, req);
});

export const setupMFA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) throw new AppError('No autenticado', 401);

    const data = await mfaService.initiateMFA(userId, userEmail);
    res.status(200).json({ success: true, ...data });
});

export const verifyAndEnableMFA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { secret, token } = req.body;

    if (!userId) throw new AppError('No autenticado', 401);

    const recoveryCodes = await mfaService.enableMFA(userId, secret, token);
    if (!recoveryCodes) {
        throw new AppError('Código MFA inválido', 400);
    }

    const user = await authService.getUserProfileById(userId);
    if (user) {
        await auditService.logAuth(userId, user.tenant_id, 'MFA_ENABLED');
    }

    res.status(200).json({
        success: true,
        message: 'MFA habilitado correctamente',
        recoveryCodes
    });
});

export const verifyMFALogin = asyncHandler(async (req: Request, res: Response) => {
    const { mfaToken, token } = req.body;

    if (!mfaToken || !token) {
        throw new AppError('Token MFA o código faltante', 400);
    }

    try {
        const payload = verifyToken(mfaToken) as any;
        if (payload.role !== 'mfa_pending') {
            throw new AppError('Token inválido', 401);
        }

        const isValid = await mfaService.verifyMFAToken(payload.userId, token);
        if (!isValid) {
            throw new AppError('Código MFA o de recuperación inválido', 401);
        }

        const user = await authService.getUserProfileById(payload.userId);
        if (!user) throw new AppError('Usuario no encontrado', 404);

        await sendTokenResponse(user, 200, res, req);
    } catch (err) {
        throw new AppError('Sesión de MFA expirada o inválida', 401);
    }
});

export const disableMFA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('No autenticado', 401);

    await mfaService.disableMFA(userId);
    res.status(200).json({ success: true, message: 'MFA deshabilitado' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const rfToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!rfToken) {
        throw new AppError('Refresh token missing', 401);
    }

    const storedToken = await authService.findRefreshToken(rfToken);

    // SECURITY: Detect Refresh Token Reuse (Stolen tokens)
    if (!storedToken) {
        try {
            const payload = verifyToken(rfToken) as any;
            const uid = payload.userId ?? payload.id;
            logger.warn({ userId: uid }, 'Refresh token reuse detected. Revoking all tokens.');
            await authService.revokeAllUserTokens(uid);
        } catch (err) {
            // Token invalid or expired anyway
        }
        throw new AppError('Seguridad comprometida: Inicia sesión de nuevo', 403);
    }

    // ROTATION: Delete the used token immediately
    await authService.deleteRefreshToken(rfToken);

    const payload = verifyToken(rfToken) as any;
    const uid = payload.userId ?? payload.id;
    const user = await authService.getUserProfileById(uid);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Generate NEW pair
    await sendTokenResponse(user, 200, res, req);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const rfToken = req.cookies.refreshToken || req.body.refreshToken;
    if (rfToken) {
        await authService.deleteRefreshToken(rfToken);
    }

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.cookie('refreshToken', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.status(200).json({ success: true, message: 'Sesión cerrada' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await authService.getUserByEmail(email);

    if (!user) {
        return res.status(200).json({ success: true, message: 'Si el email existe, se ha enviado un enlace de recuperación' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await authService.savePasswordResetToken(user.id, resetToken, expiresAt);

    logger.info(`Password reset link: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);

    res.status(200).json({ success: true, message: 'Email de recuperación enviado' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const token = String(req.params.token || req.body.token || '');
    const { password } = req.body;

    if (!token || !password) {
        throw new AppError('Token y contraseña son obligatorios', 400);
    }

    const resetRecord = await authService.findPasswordResetToken(token);
    if (!resetRecord || resetRecord.expires_at < new Date()) {
        throw new AppError('Token inválido o expirado', 400);
    }

    const hashed = await hashPassword(password);
    await authService.updatePassword(resetRecord.user_id!, hashed);
    await authService.deletePasswordResetToken(token);

    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError('No autenticado', 401);
    }
    const user = await authService.getUserProfileById(userId);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    res.status(200).json(user);
});
