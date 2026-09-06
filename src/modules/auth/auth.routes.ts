import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/register', (req, res, next) => authController.registerPatient(req, res, next));
router.post('/request-reset-otp', (req, res, next) => authController.requestPasswordResetOtp(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.getCurrentUser(req, res, next));

export default router;
