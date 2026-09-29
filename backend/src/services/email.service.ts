import { google } from 'googleapis';
import mongoose from 'mongoose';
import { config, getEffectiveGoogleRedirectUri } from '../config/env';
import { OAuthCredentialModel } from '../models/oauth-credential.model';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purpose: 'LOGIN' | 'PASSWORD_RESET' | 'VERIFICATION' | 'REGISTRATION';
  userName?: string;
}

export class EmailService {
  private static readonly SCOPE = 'https://www.googleapis.com/auth/gmail.send';

  /**
   * Creates an instance of Google OAuth2 client with current configuration
   */
  public static getOAuth2Client() {
    const redirectUri = getEffectiveGoogleRedirectUri();
    return new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      redirectUri
    );
  }

  /**
   * Generates authorization URL for Google OAuth2 consent screen.
   * Forces offline access and consent prompt to ensure refresh token is returned.
   */
  public static generateAuthUrl(state: string): string {
    if (!config.googleClientId || !config.googleClientSecret) {
      throw new Error(
        'Google OAuth client credentials missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      );
    }

    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [this.SCOPE],
      state,
      include_granted_scopes: true,
    });
  }

  /**
   * Exchanges authorization code for tokens and persists refresh token securely.
   * CRITICAL SECURITY RULE: Tokens are NEVER logged to console or exposed to frontend.
   */
  public static async exchangeCodeForTokens(code: string): Promise<{
    success: boolean;
    senderEmail: string;
    hasRefreshToken: boolean;
    refreshTokenMasked?: string;
  }> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const refreshToken = tokens.refresh_token;
    const accessToken = tokens.access_token || undefined;
    const expiryDate = tokens.expiry_date || undefined;
    const senderEmail = config.gmailSenderEmail || 'grih360@gmail.com';

    if (refreshToken) {
      // 1. Persist to MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        await OAuthCredentialModel.findOneAndUpdate(
          { provider: 'GOOGLE_GMAIL' },
          {
            provider: 'GOOGLE_GMAIL',
            senderEmail,
            refreshToken,
            accessToken,
            expiryDate,
            scope: [this.SCOPE],
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      // 2. Persist to PersistentStore for file fallback / local dev
      try {
        const { PersistentStore } = require('../config/persistent-store');
        PersistentStore.set('oauth_credentials', 'GOOGLE_GMAIL', {
          provider: 'GOOGLE_GMAIL',
          senderEmail,
          refreshToken,
          accessToken,
          expiryDate,
          scope: [this.SCOPE],
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        // Fallback store notice without token leakage
      }
    }

    return {
      success: true,
      senderEmail,
      hasRefreshToken: !!refreshToken,
      refreshTokenMasked: refreshToken
        ? `${refreshToken.substring(0, 6)}...${refreshToken.substring(refreshToken.length - 4)}`
        : undefined,
    };
  }

  /**
   * Retrieves active refresh token from environment or database.
   * Priority:
   * 1. GMAIL_REFRESH_TOKEN env var (best for Vercel Serverless)
   * 2. MongoDB OAuthCredential collection
   * 3. PersistentStore cache
   */
  public static async getStoredRefreshToken(): Promise<string | null> {
    // 1. Environment variable
    if (config.gmailRefreshToken && config.gmailRefreshToken.trim().length > 0) {
      return config.gmailRefreshToken.trim();
    }

    // 2. MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await OAuthCredentialModel.findOne({ provider: 'GOOGLE_GMAIL' }).select('+refreshToken');
        if (doc && doc.refreshToken) {
          return doc.refreshToken;
        }
      } catch (err) {
        // Safe catch
      }
    }

    // 3. PersistentStore
    try {
      const { PersistentStore } = require('../config/persistent-store');
      const doc = PersistentStore.get('oauth_credentials', 'GOOGLE_GMAIL');
      if (doc && doc.refreshToken) {
        return doc.refreshToken;
      }
    } catch (err) {
      // Safe catch
    }

    return null;
  }

  /**
   * Returns current Google OAuth configuration status without leaking secrets.
   */
  public static async getConfigurationStatus(): Promise<{
    configured: boolean;
    senderEmail: string;
    clientIdConfigured: boolean;
    clientSecretConfigured: boolean;
    redirectUri: string;
    hasRefreshToken: boolean;
    refreshTokenSource: 'ENV' | 'DATABASE' | 'STORE' | 'NONE';
  }> {
    const refreshToken = await this.getStoredRefreshToken();
    let refreshTokenSource: 'ENV' | 'DATABASE' | 'STORE' | 'NONE' = 'NONE';

    if (config.gmailRefreshToken && config.gmailRefreshToken.trim().length > 0) {
      refreshTokenSource = 'ENV';
    } else if (refreshToken) {
      refreshTokenSource = mongoose.connection.readyState === 1 ? 'DATABASE' : 'STORE';
    }

    const isFullyConfigured = !!(
      config.googleClientId &&
      config.googleClientSecret &&
      refreshToken
    );

    return {
      configured: isFullyConfigured,
      senderEmail: config.gmailSenderEmail || 'grih360@gmail.com',
      clientIdConfigured: !!config.googleClientId,
      clientSecretConfigured: !!config.googleClientSecret,
      redirectUri: getEffectiveGoogleRedirectUri(),
      hasRefreshToken: !!refreshToken,
      refreshTokenSource,
    };
  }

  /**
   * Sends an email via official Google Gmail API.
   * Real delivery only - never mocks or fakes success!
   */
  public static async sendEmail(options: SendEmailOptions): Promise<{ messageId: string; threadId?: string }> {
    const { to, subject, html, text } = options;

    if (!config.googleClientId || !config.googleClientSecret) {
      throw new Error(
        'Google OAuth2 client credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
      );
    }

    const refreshToken = await this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error(
        'Gmail API OAuth2 is not authorized. Please initiate authorization via /api/v1/auth/google/authorize or configure GMAIL_REFRESH_TOKEN.'
      );
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const senderEmail = config.gmailSenderEmail || 'grih360@gmail.com';
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Construct RFC 2822 Compliant Email Message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "Nivas360" <${senderEmail}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
    ];

    const rawMessage = Buffer.from(messageParts.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
        },
      });

      const messageId = response.data.id || 'delivered';
      console.log(`[EmailService] Real email successfully sent via Gmail API. ID: ${messageId}, Recipient: ${to}`);
      return {
        messageId,
        threadId: response.data.threadId || undefined,
      };
    } catch (error: any) {
      console.error('[EmailService] Gmail API send error:', error?.message || error);
      throw new Error(`Gmail API delivery failed: ${error?.message || 'Unknown Gmail API error'}`);
    }
  }

  /**
   * Sends a branded, secure OTP verification email.
   */
  public static async sendOtpEmail(options: SendOtpEmailOptions): Promise<{ messageId: string }> {
    const { to, otp, purpose, userName } = options;

    let purposeTitle = 'Secure Login Verification';
    let actionDescription = 'sign in to your Nivas360 portal';
    if (purpose === 'PASSWORD_RESET') {
      purposeTitle = 'Password Reset Request';
      actionDescription = 'reset your account password';
    } else if (purpose === 'VERIFICATION') {
      purposeTitle = 'Identity Verification';
      actionDescription = 'complete your tenancy verification';
    }

    const subject = `Nivas360 ${purposeTitle} — Your Code is ${otp}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background-color: #ffffff; border-radius: 24px; border: 1px solid #E8E6DF; padding: 40px; box-shadow: 0 4px 20px rgba(15, 41, 55, 0.04); }
    .header { text-align: center; margin-bottom: 32px; }
    .badge { display: inline-block; background-color: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; border: 1px solid #A7F3D0; text-transform: uppercase; letter-spacing: 0.05em; }
    .logo { font-size: 26px; font-weight: 900; color: #0F2937; margin: 16px 0 4px 0; }
    .logo span { color: #2D7A5E; }
    .title { font-size: 20px; font-weight: 800; color: #0F2937; margin: 0 0 12px 0; text-align: center; }
    .greeting { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; text-align: center; }
    .otp-container { background-color: #0F2937; border-radius: 18px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; color: #FACC15; letter-spacing: 12px; margin: 0; }
    .otp-expiry { font-size: 11px; color: #94A3B8; margin-top: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .security-notice { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 8px; margin: 24px 0; }
    .security-notice p { margin: 0; font-size: 12px; color: #92400E; font-weight: 600; line-height: 1.5; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94A3B8; line-height: 1.6; }
    .footer strong { color: #64748B; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <span class="badge">🔒 Direct Tenancy Verification</span>
        <div class="logo">Nivas<span>360</span></div>
      </div>

      <h1 class="title">${purposeTitle}</h1>
      <p class="greeting">
        Hello${userName ? ' ' + userName : ''},<br>
        Use the single-use verification code below to ${actionDescription}.
      </p>

      <div class="otp-container">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱️ Valid for 10 minutes only</div>
      </div>

      <div class="security-notice">
        <p>⚠️ <strong>Security Advisory:</strong> Never share this one-time code with anyone. Nivas360 support and property owners will never request your verification PIN.</p>
      </div>

      <div class="footer">
        <strong>Nivas360 Technologies Pvt Ltd</strong><br>
        Unified Residential Rental Ecosystem • Telangana Model Tenancy Act Compliant<br>
        This email was dispatched via secure Gmail API OAuth2 from <strong>${config.gmailSenderEmail}</strong>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to,
      subject,
      html: htmlContent,
    });
  }

  /**
   * Sends a test verification email to confirm Gmail OAuth2 integration
   */
  public static async sendTestEmail(to: string): Promise<{ messageId: string; recipient: string }> {
    const subject = 'Nivas360 — Gmail API OAuth2 Connectivity Test Successful';
    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #FAF9F5; padding: 24px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 32px; border-radius: 20px; border: 1px solid #E8E6DF;">
    <h2 style="color: #2D7A5E; margin-top: 0;">✅ Gmail API OAuth2 Connected!</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.5;">
      This test email confirms that <strong>Nivas360</strong> has successfully connected to the Gmail API using secure OAuth2 credentials.
    </p>
    <ul style="font-size: 13px; color: #475569; line-height: 1.8;">
      <li><strong>Sender Account:</strong> ${config.gmailSenderEmail}</li>
      <li><strong>Scope:</strong> ${this.SCOPE}</li>
      <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
      <li><strong>Environment:</strong> ${config.nodeEnv}</li>
    </ul>
    <p style="font-size: 12px; color: #94A3B8; margin-bottom: 0;">Nivas360 Automated Infrastructure</p>
  </div>
</body>
</html>
    `;

    const result = await this.sendEmail({
      to,
      subject,
      html: htmlContent,
    });

    return {
      messageId: result.messageId,
      recipient: to,
    };
  }
}
