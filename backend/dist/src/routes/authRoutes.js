import { Router } from 'express';
import { login, register, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/apiSchemas.js';
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
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authenticateToken, getProfile);
export default router;
