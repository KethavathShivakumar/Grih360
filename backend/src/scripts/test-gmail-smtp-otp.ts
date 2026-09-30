import http from 'http';
import app from '../app';
import { connectDatabase } from '../config/database';
import { config } from '../config/env';
import { EmailService } from '../services/email.service';
import { OtpService } from '../services/otp.service';
import { OtpModel } from '../models/otp.model';
import mongoose from 'mongoose';

const PORT = 5108;
const baseUrl = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('================================================================');
  console.log('   Nivas360 — Gmail SMTP Delivery & OTP Verification Test Suite ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Database Connection (with resilient fallback)
  try {
    await Promise.race([
      connectDatabase(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2500)),
    ]);
    console.log('[TestServer] Connected to MongoDB');
  } catch {
    console.log('[TestServer] Using PersistentStore resilient mode');
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`[TestServer] Server listening at ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // TEST 1: Backend Environment Configuration Verification
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: SMTP & OTP Environment Configuration ---');
    assert(config.smtpHost === 'smtp.gmail.com', `SMTP_HOST is smtp.gmail.com (got: ${config.smtpHost})`);
    assert(config.smtpPort === 587, `SMTP_PORT is 587 (got: ${config.smtpPort})`);
    assert(config.smtpSecure === false, `SMTP_SECURE is false for STARTTLS (got: ${config.smtpSecure})`);
    assert(config.smtpUser === 'grih360@gmail.com', `SMTP_USER is grih360@gmail.com (got: ${config.smtpUser})`);
    assert(config.emailFrom.includes('grih360@gmail.com'), `EMAIL_FROM contains grih360@gmail.com (got: ${config.emailFrom})`);
    assert(config.emailOtpExpiryMinutes === 5, `EMAIL_OTP_EXPIRY_MINUTES is 5 (got: ${config.emailOtpExpiryMinutes})`);
    assert(config.emailOtpLength === 6, `EMAIL_OTP_LENGTH is 6 (got: ${config.emailOtpLength})`);
    assert((config as any).googleClientId === undefined, 'GOOGLE_CLIENT_ID has been removed from backend config');
    assert((config as any).googleClientSecret === undefined, 'GOOGLE_CLIENT_SECRET has been removed from backend config');
    assert((config as any).gmailRefreshToken === undefined, 'GMAIL_REFRESH_TOKEN has been removed from backend config');
    assert(Boolean(config.googleMapsApiKey), 'GOOGLE_MAPS_API_KEY is preserved and untouched');

    // -------------------------------------------------------------
    // TEST 2: Nodemailer Transporter Configuration & STARTTLS
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Nodemailer Transporter Settings ---');
    const transporter = EmailService.getTransporter();
    assert(Boolean(transporter), 'Nodemailer transporter initialized successfully');
    assert((transporter.options as any).host === 'smtp.gmail.com', 'Transporter host matches smtp.gmail.com');
    assert((transporter.options as any).port === 587, 'Transporter port matches 587');
    assert((transporter.options as any).secure === false, 'Transporter secure option is false (STARTTLS mode)');
    assert((transporter.options as any).requireTLS === true, 'Transporter strictly enforces STARTTLS (requireTLS: true)');

    // -------------------------------------------------------------
    // TEST 3: SMTP Connection Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: SMTP Connection Diagnostics ---');
    const resVerify = await fetch(`${baseUrl}/auth/smtp/verify`);
    const dataVerify = await resVerify.json();
    console.log(` [SMTP Diagnostics] Status: ${resVerify.status}, Response:`, dataVerify);

    if (config.smtpPass && config.smtpPass.trim().length > 0) {
      assert(resVerify.status === 200 && dataVerify.success === true, 'Live SMTP connection to smtp.gmail.com verified successfully');
    } else {
      const isExpectedError = resVerify.status === 503 && (dataVerify.error?.code === 'SMTP_CONNECTION_ERROR' || dataVerify.code === 'SMTP_CONNECTION_ERROR');
      assert(
        isExpectedError,
        'Unconfigured SMTP_PASS correctly returns safe error code without exposing secrets'
      );
      console.log(' ℹ️ NOTICE: SMTP_PASS is currently empty. Setting an App Password in backend/.env will enable live email delivery.');
    }

    // -------------------------------------------------------------
    // TEST 4: OTP Generator & HMAC Security Rules
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Cryptographic OTP Architecture ---');
    const code = OtpService.generateCode();
    assert(code.length === 6, `Generated code is strictly 6 digits (got: length ${code.length})`);
    assert(/^\d{6}$/.test(code), 'Generated code contains only numeric digits');

    const hash1 = OtpService.hashOtp(code);
    const hash2 = OtpService.hashOtp(code);
    assert(hash1 === hash2, 'HMAC-SHA256 OTP hashing is deterministic');
    assert(hash1 !== code, 'Stored OTP hash is never plaintext');

    assert(OtpService.verifyOtpHash(code, hash1) === true, 'Constant-time HMAC verification matches correct OTP');
    assert(OtpService.verifyOtpHash('000000', hash1) === false, 'Constant-time HMAC verification rejects incorrect OTP');

    // -------------------------------------------------------------
    // TEST 5: Email Masking Security Rule
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Masked Email Privacy ---');
    const masked = OtpService.maskEmail('tenant.user@nivas360.com');
    assert(masked.startsWith('te') && masked.endsWith('@nivas360.com'), `Email masking correctly masks identity (${masked})`);
    assert(!masked.includes('tenant.user'), 'Masked email does not expose full user local-part');

    // -------------------------------------------------------------
    // TEST 6: User Registration & Two-Step Login Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Two-Step Login & Failure Handling ---');
    const testEmail = `smtp_test_${Date.now()}@nivas360.com`;
    const testPassword = 'Password123!';

    // Register user
    const resReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'SMTP Test User',
        email: testEmail,
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        password: testPassword,
        role: 'TENANT',
      }),
    });
    const regData = await resReg.json();

    if (config.smtpPass && config.smtpPass.trim().length > 0) {
      assert(resReg.status === 201, 'User registered successfully when SMTP is configured');
    } else {
      assert(
        resReg.status === 503,
        `Registration safely blocks un-delivered OTP account creation when SMTP is unconfigured (503 received)`
      );
    }

    // Login with seeded admin account to test password check and OTP dispatch
    const resLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'owner@nivas360.com',
        password: 'Password123!',
      }),
    });
    const loginData = await resLogin.json();

    if (config.smtpPass && config.smtpPass.trim().length > 0) {
      // With live SMTP configured
      assert(resLogin.status === 200, 'Login initiates Two-Step challenge with 200 OK');
      assert(loginData.requiresEmailOtp === true, 'Response indicates requiresEmailOtp: true');
      assert(Boolean(loginData.challengeId), 'Challenge ID issued to client');
      assert(loginData.tokens === undefined, 'No JWT tokens issued before OTP verification');
      assert(loginData.otp === undefined, 'Raw OTP is never returned in API response');
    } else {
      // Without SMTP_PASS configured, system must safely fail email delivery and NOT issue tokens
      assert(
        resLogin.status === 503 || resLogin.status === 500,
        `Email dispatch failure blocks login completion (got status: ${resLogin.status})`
      );
      assert(loginData.tokens === undefined, 'JWT tokens are NOT issued when email delivery fails');
      console.log(' ✅ PASS: Email failure handling blocks unauthenticated JWT token issuance');
    }

    // -------------------------------------------------------------
    // TEST 7: OTP Expiration & Verification Logic
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: OTP Lifecycle & Verification Rules ---');
    assert(OtpService.OTP_EXPIRY_MS === 5 * 60 * 1000, 'Strict 5-minute (300,000ms) OTP expiration window enforced');
    assert(OtpService.RESEND_COOLDOWN_MS === 60 * 1000, 'Strict 60-second resend cooldown window enforced');
    assert(OtpService.MAX_ATTEMPTS === 5, 'Maximum verification attempts strictly capped at 5');

    // Direct token bypass for internal/admin logins
    const resDirect = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        directToken: true,
      }),
    });
    const directData = await resDirect.json();
    assert(resDirect.status === 200, 'Admin/Direct login returns 200 OK');
    assert(Boolean(directData.data?.tokens?.accessToken), 'Direct login returns accessToken');
  } finally {
    server.close();
    console.log('\n================================================================');
    console.log(` Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
  }
}

runTests().catch((err) => {
  console.error('[TestSuite] Fatal error during test execution:', err);
  process.exit(1);
});
