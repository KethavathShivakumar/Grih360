import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purpose?: 'LOGIN' | 'PASSWORD_RESET' | 'VERIFICATION' | 'REGISTRATION';
  userName?: string;
  expiryMinutes?: number;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Returns or initializes the Nodemailer SMTP transporter for Gmail.
   * Host: smtp.gmail.com
   * Port: 587
   * Secure: false (STARTTLS)
   * Auth: SMTP_USER + SMTP_PASS (Gmail App Password)
   */
  public static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost || 'smtp.gmail.com',
        port: config.smtpPort || 587,
        secure: config.smtpSecure || false, // false for port 587 with STARTTLS
        auth: {
          user: config.smtpUser || 'grih360@gmail.com',
          pass: config.smtpPass || '',
        },
        requireTLS: true,
        connectionTimeout: 10000, // 10s connection timeout
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2',
        },
      });
    }
    return this.transporter;
  }

  /**
   * Resets the cached transporter instance (useful if credentials or env change).
   */
  public static resetTransporter(): void {
    if (this.transporter) {
      try {
        this.transporter.close();
      } catch {
        // Safe close
      }
      this.transporter = null;
    }
  }

  /**
   * Verifies the SMTP connection to Gmail without sending an email.
   */
  public static async verifyConnection(): Promise<{ success: boolean; message: string; host?: string; port?: number; user?: string }> {
    if (!config.smtpPass || config.smtpPass.trim().length === 0) {
      return {
        success: false,
        message: 'SMTP_PASS is not configured. Please configure the Gmail App Password in your environment.',
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
      };
    }

    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return {
        success: true,
        message: `SMTP connection established successfully with ${config.smtpHost}:${config.smtpPort}`,
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
      };
    } catch (error: any) {
      console.error('[EmailService] SMTP connection verification failed:', error?.message || error);
      return {
        success: false,
        message: `SMTP verification failed: ${error?.message || 'Unknown SMTP error'}`,
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
      };
    }
  }

  /**
   * Dispatches an email via Gmail SMTP using Nodemailer.
   * Real delivery only — never mocks or fakes success!
   */
  public static async sendEmail(options: SendEmailOptions): Promise<{ messageId: string; response?: string }> {
    const { to, subject, html, text, from } = options;

    if (!config.smtpPass || config.smtpPass.trim().length === 0) {
      console.error('[EmailService] Cannot send email: SMTP_PASS is missing in environment variables.');
      const err: any = new Error('Email delivery service is unconfigured. SMTP_PASS environment variable is required.');
      err.statusCode = 503;
      err.code = 'SMTP_NOT_CONFIGURED';
      throw err;
    }

    const transporter = this.getTransporter();
    const sender = from || config.emailFrom || `"Nivas360" <${config.smtpUser || 'grih360@gmail.com'}>`;
    const plainText = text || html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

    try {
      const info = await transporter.sendMail({
        from: sender,
        to,
        subject,
        text: plainText,
        html,
      });

      console.log(`[EmailService] Email successfully sent via Gmail SMTP. ID: ${info.messageId}, Recipient: ${to}`);
      return {
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error: any) {
      // Security rule: Log technical error on backend without logging passwords, secrets, or OTP tokens
      console.error(`[EmailService] Gmail SMTP delivery failed to recipient [${to}]:`, error?.message || error);
      const deliveryError: any = new Error(`Gmail SMTP delivery failed: ${error?.message || 'SMTP transmission error'}`);
      deliveryError.statusCode = 503;
      deliveryError.code = 'EMAIL_DELIVERY_FAILED';
      throw deliveryError;
    }
  }

  /**
   * Sends a branded, secure OTP verification email via Gmail SMTP.
   * Adheres strictly to Phase 4 email template requirements:
   * - Subject: "Your Nivas360 Login Verification Code"
   * - Nivas360 branding
   * - Six-digit OTP
   * - Expiration time of 5 minutes
   * - Security warning not to share code
   * - Message for users who did not request the OTP
   * - HTML and plain-text support
   * - Sender: Nivas360 <grih360@gmail.com>
   */
  public static async sendOtpEmail(options: SendOtpEmailOptions): Promise<{ messageId: string }> {
    const { to, otp, purpose = 'LOGIN', userName, expiryMinutes = config.emailOtpExpiryMinutes || 5 } = options;

    let subject = 'Your Nivas360 Login Verification Code';
    let purposeTitle = 'Login Verification Code';
    let actionDescription = 'sign in to your Nivas360 account';

    if (purpose === 'PASSWORD_RESET') {
      subject = 'Your Nivas360 Password Reset Verification Code';
      purposeTitle = 'Password Reset Code';
      actionDescription = 'reset your Nivas360 account password';
    } else if (purpose === 'REGISTRATION') {
      subject = 'Your Nivas360 Registration Verification Code';
      purposeTitle = 'Account Activation Code';
      actionDescription = 'activate and verify your new Nivas360 account';
    } else if (purpose === 'VERIFICATION') {
      subject = 'Your Nivas360 Identity Verification Code';
      purposeTitle = 'Identity Verification Code';
      actionDescription = 'complete your tenancy identity verification';
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 32px 16px; box-sizing: border-box; }
    .card { background-color: #ffffff; border-radius: 24px; border: 1px solid #E8E6DF; padding: 40px; box-shadow: 0 4px 20px rgba(15, 41, 55, 0.05); }
    .header { text-align: center; margin-bottom: 28px; }
    .badge { display: inline-block; background-color: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; border: 1px solid #A7F3D0; text-transform: uppercase; letter-spacing: 0.05em; }
    .logo { font-size: 28px; font-weight: 900; color: #0F2937; margin: 16px 0 4px 0; letter-spacing: -0.5px; }
    .logo span { color: #2D7A5E; }
    .title { font-size: 22px; font-weight: 800; color: #0F2937; margin: 0 0 12px 0; text-align: center; }
    .greeting { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; text-align: center; }
    .otp-container { background-color: #0F2937; border-radius: 18px; padding: 26px 20px; text-align: center; margin: 28px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; color: #FACC15; letter-spacing: 12px; margin: 0; padding-left: 12px; }
    .otp-expiry { font-size: 12px; color: #94A3B8; margin-top: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .security-notice { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 8px; margin: 24px 0; }
    .security-notice p { margin: 0; font-size: 12px; color: #92400E; font-weight: 600; line-height: 1.5; }
    .unsolicited-notice { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-size: 12px; color: #64748B; line-height: 1.5; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94A3B8; line-height: 1.6; border-top: 1px solid #F1F5F9; padding-top: 24px; }
    .footer strong { color: #64748B; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <span class="badge">🔒 Secure Identity Verification</span>
        <div class="logo">Nivas<span>360</span></div>
      </div>

      <h1 class="title">${purposeTitle}</h1>
      <p class="greeting">
        Hello${userName ? ' ' + userName : ''},<br>
        Please use the 6-digit one-time verification code below to ${actionDescription}.
      </p>

      <div class="otp-container">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱️ Valid for ${expiryMinutes} minutes only</div>
      </div>

      <div class="security-notice">
        <p>⚠️ <strong>Security Warning:</strong> Never share this code with anyone. Nivas360 employees, support staff, or property owners will NEVER ask you for your verification PIN.</p>
      </div>

      <div class="unsolicited-notice">
        If you did not request this verification code, please ignore this email or contact Nivas360 support immediately to secure your account.
      </div>

      <div class="footer">
        <strong>Nivas360 Technologies Pvt Ltd</strong><br>
        Unified Residential Rental Ecosystem • Telangana Model Tenancy Act Compliant<br>
        Dispatched securely via Nivas360 SMTP Delivery System
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const plainTextContent = `
Nivas360 — ${purposeTitle}

Hello${userName ? ' ' + userName : ''},

Your verification code is: ${otp}

This code is valid for ${expiryMinutes} minutes only.

SECURITY WARNING:
Never share this verification code with anyone. Nivas360 representatives or property owners will NEVER ask you for your code.

If you did not request this verification code, please ignore this email or contact support immediately.

---
Nivas360 Technologies Pvt Ltd
Unified Residential Rental Ecosystem
    `.trim();

    return this.sendEmail({
      to,
      subject,
      html: htmlContent,
      text: plainTextContent,
    });
  }

  /**
   * Sends a test verification email to confirm Gmail SMTP integration.
   */
  public static async sendTestEmail(to: string): Promise<{ messageId: string; recipient: string }> {
    const subject = 'Nivas360 — Gmail SMTP Connectivity Test Successful';
    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF9F5; padding: 24px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; padding: 36px; border-radius: 20px; border: 1px solid #E8E6DF; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <h2 style="color: #2D7A5E; margin-top: 0; font-size: 22px;">✅ Gmail SMTP Connected!</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      This test email confirms that <strong>Nivas360</strong> has successfully connected to Gmail SMTP via Nodemailer.
    </p>
    <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E2E8F0; font-size: 13px; line-height: 1.8;">
      <div><strong>Host:</strong> ${config.smtpHost}</div>
      <div><strong>Port:</strong> ${config.smtpPort} (STARTTLS)</div>
      <div><strong>Sender:</strong> ${config.smtpUser}</div>
      <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
      <div><strong>Environment:</strong> ${config.nodeEnv}</div>
    </div>
    <p style="font-size: 12px; color: #94A3B8; margin-bottom: 0;">Nivas360 Automated Infrastructure</p>
  </div>
</body>
</html>
    `;

    const plainText = `
Nivas360 — Gmail SMTP Connectivity Test Successful

This test email confirms that Nivas360 has successfully connected to Gmail SMTP via Nodemailer.

Host: ${config.smtpHost}
Port: ${config.smtpPort}
Sender: ${config.smtpUser}
Timestamp: ${new Date().toISOString()}
Environment: ${config.nodeEnv}
    `.trim();

    const result = await this.sendEmail({
      to,
      subject,
      html: htmlContent,
      text: plainText,
    });

    return {
      messageId: result.messageId,
      recipient: to,
    };
  }
}
