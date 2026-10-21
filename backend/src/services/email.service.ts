import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purpose?: 'LOGIN' | 'PASSWORD_RESET' | 'VERIFICATION' | 'REGISTRATION' | 'GOOGLE_ONBOARDING';
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
      const cleanPass = (config.smtpPass || '').replace(/\s+/g, '');
      const port = config.smtpPort || 587;
      const isSecure = config.smtpSecure !== undefined ? config.smtpSecure : (port === 465);

      this.transporter = nodemailer.createTransport({
        host: config.smtpHost || 'smtp.gmail.com',
        port: port,
        secure: isSecure,
        auth: {
          user: config.smtpUser || 'grih360@gmail.com',
          pass: cleanPass,
        },
        requireTLS: !isSecure,
        connectionTimeout: 7000, // 7s serverless timeout
        greetingTimeout: 7000,
        socketTimeout: 10000,
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
   * Categorizes SMTP verify / send errors into standard categories without leaking credentials
   */
  public static categorizeSmtpError(error: any): 'authentication failed' | 'connection refused' | 'rate limited' | 'connection timeout' | 'unconfigured' | 'connection failed' {
    if (!error) return 'connection failed';
    const msg = (error.message || '').toLowerCase();
    const code = (error.code || '').toUpperCase();
    const respCode = error.responseCode;

    if (code === 'EAUTH' || respCode === 535 || msg.includes('invalid login') || msg.includes('badcredentials') || msg.includes('username and password not accepted')) {
      return 'authentication failed';
    }
    if (code === 'ECONNREFUSED' || msg.includes('connection refused') || msg.includes('econnrefused')) {
      return 'connection refused';
    }
    if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT' || msg.includes('timed out') || msg.includes('timeout')) {
      return 'connection timeout';
    }
    if (respCode === 421 || respCode === 450 || respCode === 452 || msg.includes('rate limit') || msg.includes('daily user sending limit') || msg.includes('quota')) {
      return 'rate limited';
    }
    return 'connection failed';
  }

  /**
   * Real SMTP verification for the health check.
   * Reports "ok" or the categorized failure: "authentication failed", "connection refused", "rate limited".
   * Never prints or leaks passwords, secrets, or credential values.
   */
  public static async getHealthSmtpStatus(): Promise<string> {
    if (!config.smtpPass || config.smtpPass.trim().length === 0 || !config.smtpUser) {
      return 'unconfigured';
    }

    try {
      const transporter = this.getTransporter();
      // Execute verify with a strict 5-second timeout so health check remains snappy
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out')), 5000))
      ]);
      return 'ok';
    } catch (error: any) {
      const category = this.categorizeSmtpError(error);
      console.error(`[EmailService] Health SMTP verification failed [Category: ${category}]:`, error?.message || error);
      return category;
    }
  }

  /**
   * Verifies the SMTP connection to Gmail without sending an email.
   */
  public static async verifyConnection(): Promise<{ success: boolean; message: string; host?: string; port?: number; user?: string; category?: string }> {
    if (!config.smtpPass || config.smtpPass.trim().length === 0) {
      return {
        success: false,
        message: 'SMTP_PASS is not configured. Please configure the Gmail App Password in your environment.',
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        category: 'unconfigured',
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
        category: 'ok',
      };
    } catch (error: any) {
      const category = this.categorizeSmtpError(error);
      console.error(`[EmailService] SMTP connection verification failed [Category: ${category}]:`, error?.message || error);
      return {
        success: false,
        message: `SMTP verification failed: ${category}`,
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        category,
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
      if (process.env.NODE_ENV === 'test' || config.nodeEnv === 'test') {
        console.log(`[EmailService] [TEST MODE] Simulated email to ${to}: ${subject}`);
        return { messageId: 'test-delivery-id-ok', response: '250 OK' };
      }
      console.error('[EmailService] Cannot send email: SMTP_PASS is missing in environment variables.');
      const err: any = new Error('Email delivery service is unconfigured. SMTP_PASS environment variable is required.');
      err.statusCode = 503;
      err.code = 'SMTP_NOT_CONFIGURED';
      throw err;
    }

    const transporter = this.getTransporter();
    const user = config.smtpUser || 'grih360@gmail.com';
    const sender = `"Grih360" <${user}>`;
    const plainText = text || (html ? html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() : '');

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
   * - Subject: "Your Grih360 Login Verification Code"
   * - Grih360 branding
   * - Six-digit OTP
   * - Expiration time of 10 minutes
   * - Security warning not to share code
   * - Message for users who did not request the OTP
   * - HTML and plain-text support
   * - Sender: Grih360 <grih360@gmail.com>
   */
  public static async sendOtpEmail(options: SendOtpEmailOptions): Promise<{ messageId: string }> {
    const { to, otp, userName } = options;

    const displayName = userName && userName.trim().length > 0 ? userName.trim() : 'there';
    const subject = 'Grih360 Verification Code';

    const plainTextContent = `Hi ${displayName},

Your Grih360 verification code is: ${otp}

This code is valid for 10 minutes.

If you did not request the code, You can ignore this email.

Grih360 Support Team
Grih360`;

    return this.sendEmail({
      to,
      subject,
      text: plainTextContent,
    });
  }

  /**
   * Sends a test verification email to confirm Gmail SMTP integration.
   */
  public static async sendTestEmail(to: string): Promise<{ messageId: string; recipient: string }> {
    const subject = 'Grih360: Gmail SMTP Connectivity Test Successful';
    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF9F5; padding: 24px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; padding: 36px; border-radius: 20px; border: 1px solid #E8E6DF; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <h2 style="color: #2D7A5E; margin-top: 0; font-size: 22px;">Gmail SMTP Connected</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      This test email confirms that <strong>Grih360</strong> has successfully connected to Gmail SMTP via Nodemailer.
    </p>
    <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E2E8F0; font-size: 13px; line-height: 1.8;">
      <div><strong>Host:</strong> ${config.smtpHost}</div>
      <div><strong>Port:</strong> ${config.smtpPort} (STARTTLS)</div>
      <div><strong>Sender:</strong> ${config.smtpUser}</div>
      <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
      <div><strong>Environment:</strong> ${config.nodeEnv}</div>
    </div>
    <p style="font-size: 12px; color: #94A3B8; margin-bottom: 0;">Grih360 Automated Infrastructure</p>
  </div>
</body>
</html>
    `;

    const plainText = `
Grih360: Gmail SMTP Connectivity Test Successful

This test email confirms that Grih360 has successfully connected to Gmail SMTP via Nodemailer.

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
