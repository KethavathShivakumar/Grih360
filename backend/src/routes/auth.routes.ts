import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthValidator } from '../validators/auth.validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';

const router = Router();

// Standard Password & Registration Flow
router.post('/register/send-otp', authRateLimiter, AuthController.registerSendOtp);
router.post('/register/verify-and-create', authRateLimiter, AuthController.registerVerifyAndCreate);
router.post('/register', authRateLimiter, AuthValidator.validateRegister, AuthController.register);

// Google OAuth Authentication (GIS & Android Native)
router.post('/google', authRateLimiter, AuthController.googleLogin);
router.post('/google/set-initial-password', authRateLimiter, AuthController.googleSetInitialPassword);
router.post('/google/resend-otp', authRateLimiter, AuthController.googleResendOtp);

// Existing User Authentication Flow (Method 1: Password direct, Method 2: Email OTP)
router.post('/login', authRateLimiter, AuthValidator.validateLogin, AuthController.login);
router.post('/verify-login-otp', authRateLimiter, AuthController.verifyLoginOtp);
router.post('/resend-login-otp', authRateLimiter, AuthController.resendLoginOtp);
router.post('/login-otp/send', authRateLimiter, AuthController.sendOtp);
router.post('/login-otp/verify', authRateLimiter, AuthController.verifyOtp);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh', authRateLimiter, AuthController.refreshToken);

// Forgot / Set Password Flow
router.post('/forgot-password/send-otp', authRateLimiter, AuthController.forgotPasswordSendOtp);
router.post('/forgot-password/reset', authRateLimiter, AuthController.forgotPasswordReset);

// Direct OTP Authentication (Dispatched via Gmail SMTP)
router.post('/otp/send', authRateLimiter, AuthController.sendOtp);
router.post('/otp/verify', authRateLimiter, AuthController.verifyOtp);

// Gmail SMTP Diagnostics & Connectivity
router.get('/smtp/verify', AuthController.verifySmtp);
router.post('/smtp/test-email', authRateLimiter, AuthController.sendTestSmtpEmail);

export default router;
