import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';
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

// Legacy Direct OTP Authentication (Dispatched via Gmail API OAuth2)
router.post('/otp/send', authRateLimiter, AuthController.sendOtp);
router.post('/otp/verify', authRateLimiter, AuthController.verifyOtp);

// Google OAuth2 Server-Side Authorization for Gmail API
router.get('/google/authorize', OAuthController.authorize);
router.get('/google/callback', OAuthController.callback);
router.get('/google/status', OAuthController.getStatus);
router.post('/google/test-email', OAuthController.sendTestEmail);

export default router;
