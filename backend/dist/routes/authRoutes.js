import { Router } from 'express';
import { login, register, getProfile, refreshToken, logout, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticateToken } from '../auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/apiSchemas.js';
const router = Router();
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 */
router.post('/register', validate(registerSchema), register);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Auth]
 */
router.post('/login', validate(loginSchema), login);
/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar el token de acceso
 *     tags: [Auth]
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión (revocar refresh token)
 *     tags: [Auth]
 */
router.post('/logout', logout);
/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authenticateToken, getProfile);
export default router;
