import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { comparePassword, hashPassword, generateToken, generateRefreshToken, verifyToken } from '../../auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import crypto from 'crypto';

// Utilidad para establecer las cookies JWT seguras
const sendTokenResponse = async (user: any, statusCode: number, res: Response) => {
    const token = generateToken(user.id, user.role, user.tenant_id);
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await authService.saveRefreshToken(user.id, refreshToken, expiresAt);

    const isProduction = process.env.NODE_ENV === 'production';

    // Cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
        path: '/'
    };

    // Access Token
    res.cookie('jwt', token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
    });

    // Refresh Token
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // CSRF Token
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', csrfToken, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(statusCode).json({
        success: true,
        token,
        refreshToken,
        csrfToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id }
    });
};

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await authService.getUserByEmail(email);
    if (!user) {
        throw new AppError('Email o contraseña incorrectos', 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new AppError('Email o contraseña incorrectos', 401);
    }

    await sendTokenResponse(user, 200, res);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role, companyName } = req.body;

    if (!companyName) {
        throw new AppError('El nombre de la empresa (Tenant) es obligatorio para un SaaS B2B.', 400);
    }

    const passwordHash = await hashPassword(password);

    const { user, tenant } = await authService.registerTenantWithUser({
        name,
        email,
        passwordHash,
        role: role || 'admin',
        companyName
    });

    await sendTokenResponse(user, 201, res);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await authService.deleteRefreshToken(refreshToken);
    }

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const
    });
    res.cookie('refreshToken', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const
    });
    res.cookie('csrfToken', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: false,
        secure: true,
        sameSite: 'none' as const
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) {
        throw new AppError('Refresh token missing', 400);
    }

    const storedToken = await authService.findRefreshToken(rfToken);

    // REUSE DETECTION: If we receive a token that is NOT in the DB but is valid (not expired),
    // it might have been stolen and already rotated.
    if (!storedToken) {
        try {
            const payload = verifyToken(rfToken) as any;
            // High alert: revoke everything for this user
            console.warn(`[SECURITY] Refresh token reuse detected for user ${payload.userId}. Revoking all tokens.`);
            await authService.revokeAllUserTokens(payload.userId);
            // Optionally: add user to a temporary lockout in Redis
        } catch (err) {
            // Token was truly invalid/expired, no action needed
        }
        throw new AppError('Security violation: Session compromised. Please login again.', 401);
    }

    // ROTATION: Delete the used token immediately
    await authService.deleteRefreshToken(rfToken);

    const payload = verifyToken(rfToken) as any;
    const user = await authService.getUserProfileById(payload.userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Issue new pair
    res.setHeader('X-Refresh-Rotation', 'true');
    await sendTokenResponse(user, 200, res);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
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

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
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

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const user = await authService.getUserProfileById(userId);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    res.status(200).json(user);
});
