import { Request, Response } from 'express';
import crypto from 'crypto';
import { config, getEffectiveGoogleRedirectUri } from '../config/env';
import { EmailService } from '../services/email.service';
import { ApiResponseUtil } from '../utils/api-response.util';

// In-memory cryptographically secure state store with 15-minute TTL
interface IOAuthState {
  state: string;
  createdAt: number;
  expiresAt: number;
}
const activeStates = new Map<string, IOAuthState>();

// Periodic cleanup of expired states (unref so it doesn't block process exit)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of activeStates.entries()) {
    if (now > val.expiresAt) {
      activeStates.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

export class OAuthController {
  /**
   * Helper to verify if the requester has authorization to initiate or manage OAuth setup
   */
  private static isAuthorizedSetupRequest(req: Request): boolean {
    // 1. Check for valid setup_key in query or headers
    const setupKey = req.query.setup_key || req.headers['x-setup-key'];
    if (setupKey && setupKey === config.oauthSetupKey) {
      return true;
    }

    // 2. Check if authenticated user has ADMIN role
    const user = (req as any).user;
    if (user && user.role === 'ADMIN') {
      return true;
    }

    // 3. In development mode, allow setup
    if (config.nodeEnv !== 'production') {
      return true;
    }

    return false;
  }

  /**
   * Initiates Google OAuth2 authorization flow.
   * GET /api/v1/auth/google/authorize
   */
  static async authorize(req: Request, res: Response): Promise<void> {
    try {
      if (!OAuthController.isAuthorizedSetupRequest(req)) {
        ApiResponseUtil.error(
          res,
          'Unauthorized: Google OAuth setup requires Admin credentials or a valid setup_key',
          403,
          'FORBIDDEN'
        );
        return;
      }

      if (!config.googleClientId || !config.googleClientSecret) {
        ApiResponseUtil.error(
          res,
          'Google OAuth client is unconfigured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
          500,
          'CONFIG_ERROR'
        );
        return;
      }

      // Generate cryptographically secure state parameter (32 bytes = 64 hex chars)
      const state = crypto.randomBytes(32).toString('hex');
      const now = Date.now();
      activeStates.set(state, {
        state,
        createdAt: now,
        expiresAt: now + 15 * 60 * 1000, // 15 minutes TTL
      });

      const authUrl = EmailService.generateAuthUrl(state);
      const redirectUri = getEffectiveGoogleRedirectUri();

      // Return JSON if requested by API client
      if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
        ApiResponseUtil.success(res, 'Google OAuth authorization URL generated', {
          authUrl,
          redirectUri,
          senderEmail: config.gmailSenderEmail,
          scope: 'https://www.googleapis.com/auth/gmail.send',
        });
        return;
      }

      // Otherwise redirect directly to Google consent screen
      res.redirect(authUrl);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to initiate Google authorization', 500);
    }
  }

  /**
   * Handles Google OAuth2 callback.
   * GET /api/v1/auth/google/callback
   */
  static async callback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle user denial / error from Google
      if (error) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Nivas360 — Authorization Error</title></head>
          <body style="font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 24px; background: #FFF5F5;">
            <h2 style="color: #991B1B;">❌ Google Authorization Denied</h2>
            <p style="color: #7F1D1D;">Google reported an error: <strong>${error}</strong></p>
            <p style="color: #7F1D1D;">${error_description || ''}</p>
            <a href="/api/v1/auth/google/authorize" style="display: inline-block; padding: 10px 20px; background: #0F2937; color: white; border-radius: 8px; text-decoration: none;">Try Again</a>
          </body>
          </html>
        `);
        return;
      }

      if (!state || typeof state !== 'string') {
        res.status(400).send('<h3>Error: Missing OAuth state parameter. Possible CSRF attack.</h3>');
        return;
      }

      // Cryptographically validate state
      const savedState = activeStates.get(state);
      if (!savedState || Date.now() > savedState.expiresAt) {
        res.status(400).send('<h3>Error: Invalid or expired OAuth state parameter. Please restart authorization.</h3>');
        return;
      }

      // Immediately invalidate state to prevent replay attacks
      activeStates.delete(state);

      if (!code || typeof code !== 'string') {
        res.status(400).send('<h3>Error: Missing authorization code from Google.</h3>');
        return;
      }

      // Exchange code for tokens on the backend
      const result = await EmailService.exchangeCodeForTokens(code);

      // JSON response if requested
      if (req.headers.accept?.includes('application/json')) {
        ApiResponseUtil.success(res, 'Google OAuth authorization completed successfully', {
          senderEmail: result.senderEmail,
          hasRefreshToken: result.hasRefreshToken,
          scope: 'https://www.googleapis.com/auth/gmail.send',
        });
        return;
      }

      // Render Secure Confirmation HTML Page
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nivas360 — Google OAuth2 Connected</title>
          <style>
            body { background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 16px; color: #1E293B; }
            .card { max-width: 620px; margin: 0 auto; background: white; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E2E8F0; }
            .badge { display: inline-flex; align-items: center; gap: 6px; background: #ECFDF5; color: #047857; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; }
            h1 { font-size: 24px; font-weight: 900; color: #0F2937; margin: 16px 0 8px 0; }
            p { font-size: 14px; color: #475569; line-height: 1.6; }
            .info-box { background: #F8FAFC; border-radius: 14px; padding: 18px; margin: 20px 0; border: 1px solid #E2E8F0; font-size: 13px; }
            .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #EDF2F7; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #64748B; font-weight: 600; }
            .value { color: #0F2937; font-weight: 700; font-family: monospace; }
            .notice { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px; border-radius: 8px; margin: 24px 0; font-size: 13px; color: #92400E; }
            .btn { display: inline-block; background: #0F2937; color: #FACC15; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">✓ Google OAuth2 Connected</span>
            <h1>Gmail API Authorization Completed</h1>
            <p>Your Google account has granted permission to send OTP emails on behalf of Nivas360.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Sender Email</span>
                <span class="value">${result.senderEmail}</span>
              </div>
              <div class="info-row">
                <span class="label">Scope Granted</span>
                <span class="value">https://www.googleapis.com/auth/gmail.send</span>
              </div>
              <div class="info-row">
                <span class="label">Refresh Token Stored</span>
                <span class="value">${result.hasRefreshToken ? '✅ Successfully Captured' : '⚠️ Kept Existing Token'}</span>
              </div>
              <div class="info-row">
                <span class="label">Token Security</span>
                <span class="value">Encrypted / Never Exposed</span>
              </div>
            </div>

            <div class="notice">
              <strong>🚀 Vercel Production Deployment Tip:</strong><br>
              The refresh token has been stored in your connected database. For optimal zero-latency execution across Vercel serverless regions, you can also store your refresh token in Vercel Project Settings as <code>GMAIL_REFRESH_TOKEN</code>.
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="/api/v1/auth/google/status" class="btn">View Integration Status →</a>
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error('[OAuthController] Callback error:', err?.message || err);
      res.status(500).send(`<h3>Google OAuth exchange failed: ${err?.message || 'Server error'}</h3>`);
    }
  }

  /**
   * Retrieves current Gmail API OAuth configuration status.
   * GET /api/v1/auth/google/status
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await EmailService.getConfigurationStatus();
      ApiResponseUtil.success(res, 'Google OAuth status retrieved', status);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to query OAuth status', 500);
    }
  }

  /**
   * Dispatches a test email via the Gmail API to verify production delivery.
   * POST /api/v1/auth/google/test-email
   */
  static async sendTestEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!OAuthController.isAuthorizedSetupRequest(req)) {
        ApiResponseUtil.error(res, 'Unauthorized test email request', 403, 'FORBIDDEN');
        return;
      }

      const { to } = req.body;
      if (!to || typeof to !== 'string' || !to.includes('@')) {
        ApiResponseUtil.error(res, 'Valid recipient email "to" is required in request body', 400);
        return;
      }

      const result = await EmailService.sendTestEmail(to.trim().toLowerCase());
      ApiResponseUtil.success(res, 'Test email delivered successfully via Gmail API', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Test email delivery failed', 500);
    }
  }
}
