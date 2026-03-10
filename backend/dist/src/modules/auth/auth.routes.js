import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
const router = Router();
// Endpoints públicos
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/verify-mfa-login', authController.verifyMFALogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
// Endpoints protegidos
router.post('/mfa/setup', protect, authController.setupMFA);
router.post('/mfa/verify', protect, authController.verifyAndEnableMFA);
router.post('/mfa/disable', protect, authController.disableMFA);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getProfile);
router.get('/profile', protect, authController.getProfile);
export default router;
