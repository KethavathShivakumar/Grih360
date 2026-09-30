import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthValidator } from '../validators/auth.validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';

const router = Router();

// Standard Password Authentication
router.post('/register', authRateLimiter, AuthValidator.validateRegister, AuthController.register);

// Two-Step Authentication Flow
router.post('/login', authRateLimiter, AuthValidator.validateLogin, AuthController.login);
router.post('/verify-login-otp', authRateLimiter, AuthController.verifyLoginOtp);
router.post('/resend-login-otp', authRateLimiter, AuthController.resendLoginOtp);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh', authRateLimiter, AuthController.refreshToken);

// Direct OTP Authentication (Dispatched via Gmail SMTP)
router.post('/otp/send', authRateLimiter, AuthController.sendOtp);
router.post('/otp/verify', authRateLimiter, AuthController.verifyOtp);

// Gmail SMTP Diagnostics & Connectivity
router.get('/smtp/verify', AuthController.verifySmtp);
router.post('/smtp/test-email', authRateLimiter, AuthController.sendTestSmtpEmail);

export default router;
