import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthValidator } from '../validators/auth.validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';

const router = Router();

router.post('/register', authRateLimiter, AuthValidator.validateRegister, AuthController.register);
router.post('/login', authRateLimiter, AuthValidator.validateLogin, AuthController.login);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh', authRateLimiter, AuthController.refreshToken);

export default router;
