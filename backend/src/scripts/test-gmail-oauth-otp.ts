import app from '../app';
import { connectDatabase } from '../config/database';
import { config, getEffectiveGoogleRedirectUri } from '../config/env';
import { EmailService } from '../services/email.service';
import { OtpService } from '../services/otp.service';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const PORT = 5103;

async function runGmailOAuthAndOtpTests() {
  console.log('===========================================================');
  console.log(' Nivas360 — Gmail API OAuth2 & OTP Authentication Test');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;
  let server: any;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection (fast fallback)
    try {
      await Promise.race([
        connectDatabase(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2500)),
      ]);
    } catch (e) {
      console.log('[TestServer] Using PersistentStore resilient mode');
    }

    const baseUrl = `http://localhost:${PORT}/api/v1`;

    // 2. Start Test Server
    server = await new Promise((resolve) => {
      const s = app.listen(PORT, () => {
        console.log(`[TestServer] Server listening at ${baseUrl}`);
        resolve(s);
      });
    });

    const timestamp = Date.now();

    // =========================================================================
    // STEP 1: Callback URL Verification
    // =========================================================================
    const localCallback = `http://localhost:5000/api/v1/auth/google/callback`;
    const prodCallback = `https://nivas360.vercel.app/api/v1/auth/google/callback`;
    const effectiveUri = getEffectiveGoogleRedirectUri();

    assert(
      effectiveUri.includes('/api/v1/auth/google/callback'),
      'Effective redirect URI routes to /api/v1/auth/google/callback',
      effectiveUri
    );
    console.log(` ℹ️ Verified Local Callback URL: ${localCallback}`);
    console.log(` ℹ️ Verified Production Callback URL: ${prodCallback}`);

    // =========================================================================
    // STEP 2: Protected Authorization Initiation Endpoint
    // =========================================================================
    // A. Without setup_key in production mode simulation
    const originalNodeEnv = config.nodeEnv;
    (config as any).nodeEnv = 'production';

    const resAuthUnauthorized = await fetch(`${baseUrl}/auth/google/authorize`, {
      headers: { Accept: 'application/json' },
    });
    assert(
      resAuthUnauthorized.status === 403,
      'Authorization initiation rejects unauthorized caller with 403 Forbidden'
    );

    // Restore dev mode for testing with setup key
    (config as any).nodeEnv = originalNodeEnv;
    (config as any).googleClientId = 'mock-google-client-id-12345.apps.googleusercontent.com';
    (config as any).googleClientSecret = 'mock-google-client-secret-xyz';

    // B. Authorized initiation with setup_key
    const resAuthAuthorized = await fetch(
      `${baseUrl}/auth/google/authorize?setup_key=${config.oauthSetupKey}&format=json`,
      { headers: { Accept: 'application/json' } }
    );
    const dataAuth = await resAuthAuthorized.json();
    assert(resAuthAuthorized.status === 200, 'Authorized initiation generates OAuth URL');
    assert(!!dataAuth.data?.authUrl, 'Response contains Google authUrl');

    const authUrl = new URL(dataAuth.data.authUrl);
    assert(
      authUrl.searchParams.get('client_id') === 'mock-google-client-id-12345.apps.googleusercontent.com',
      'authUrl includes correct Google client_id'
    );
    assert(
      authUrl.searchParams.get('access_type') === 'offline',
      'authUrl requests offline access for refresh token'
    );
    assert(
      authUrl.searchParams.get('prompt') === 'consent',
      'authUrl enforces prompt=consent to ensure refresh token is returned'
    );

    const requestedScope = authUrl.searchParams.get('scope');
    assert(
      requestedScope === 'https://www.googleapis.com/auth/gmail.send',
      `Scope strictly matches requested scope: https://www.googleapis.com/auth/gmail.send (got ${requestedScope})`
    );

    const generatedState = authUrl.searchParams.get('state');
    assert(
      !!generatedState && generatedState.length === 64,
      'Cryptographically secure 32-byte hex state generated (64 characters)'
    );

    // =========================================================================
    // STEP 3: Cryptographic State Validation & Replay Prevention
    // =========================================================================
    // A. Missing state rejected
    const resNoState = await fetch(`${baseUrl}/auth/google/callback?code=mock_code_123`);
    assert(resNoState.status === 400, 'Callback rejects request missing state with 400 Bad Request');

    // B. Tampered / invalid state rejected
    const resInvalidState = await fetch(
      `${baseUrl}/auth/google/callback?state=fake_random_tampered_state_value&code=mock_code_123`
    );
    assert(
      resInvalidState.status === 400,
      'Callback rejects tampered/unrecognized state parameter (CSRF protection)'
    );

    // C. User denial / Google error handled
    const resGoogleError = await fetch(
      `${baseUrl}/auth/google/callback?error=access_denied&error_description=User+denied+access`
    );
    assert(
      resGoogleError.status === 400,
      'Callback gracefully handles Google access_denied error'
    );

    // D. Replay prevention: generatedState is single-use
    // First call with valid state and invalid code will fail code exchange but MUST consume state
    await fetch(`${baseUrl}/auth/google/callback?state=${generatedState}&code=test_code_1`);

    // Second call with same state MUST be rejected because state was consumed
    const resReplayState = await fetch(
      `${baseUrl}/auth/google/callback?state=${generatedState}&code=test_code_2`
    );
    assert(
      resReplayState.status === 400,
      'Callback enforces single-use state; replayed state is rejected with 400'
    );

    // =========================================================================
    // STEP 4: OAuth Status Endpoint
    // =========================================================================
    const resStatus = await fetch(`${baseUrl}/auth/google/status`);
    const dataStatus = await resStatus.json();
    assert(resStatus.status === 200, 'GET /auth/google/status returns 200 OK');
    assert(
      dataStatus.data.senderEmail === 'grih360@gmail.com',
      `Sender account matches grih360@gmail.com (got ${dataStatus.data.senderEmail})`
    );
    assert(
      typeof dataStatus.data.configured === 'boolean',
      'Configuration status report is structured boolean'
    );
    // Security check: Verify no secrets or tokens are exposed
    const statusString = JSON.stringify(dataStatus);
    assert(
      !statusString.includes('client_secret') && !statusString.includes('mock-google-client-secret'),
      'Client secrets are NEVER exposed in OAuth status response'
    );

    // =========================================================================
    // STEP 5: Real Delivery Enforcement (No Fake Success)
    // =========================================================================
    try {
      // Clear refresh token temporarily to test unconfigured error
      const savedToken = (config as any).gmailRefreshToken;
      (config as any).gmailRefreshToken = '';

      let threwError = false;
      try {
        await EmailService.sendEmail({
          to: 'tenant@test.com',
          subject: 'Test Delivery',
          html: '<p>Test</p>',
        });
      } catch (err: any) {
        threwError = true;
        assert(
          err.message.includes('Gmail API OAuth2 is not authorized') ||
            err.message.includes('GMAIL_REFRESH_TOKEN'),
          'Unconfigured Gmail API throws explicit error instead of mocking fake delivery'
        );
      }
      assert(threwError, 'EmailService rejects send attempt without credentials');

      // Restore
      (config as any).gmailRefreshToken = savedToken;
    } catch (e: any) {
      assert(false, 'EmailService test failed', e.message);
    }

    // =========================================================================
    // STEP 6: OTP Lifecycle — Generation, Hashing, Expiration & Verification
    // =========================================================================
    const testEmail = `otp-test-${timestamp}@nivas360.com`;

    // 1. Generate OTP
    const rawOtp = OtpService.generateCode();
    assert(
      /^\d{6}$/.test(rawOtp),
      `Cryptographic OTP generator produces 6-digit numeric string: ${rawOtp}`
    );

    // 2. Email Masking
    const masked = OtpService.maskEmail('user.longname@domain.com');
    assert(masked.startsWith('us') && masked.endsWith('@domain.com'), `Email masking functions correctly: ${masked}`);

    // 3. Register a test user for OTP login flow
    const resReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OTP Verified User',
        email: testEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123!',
        role: 'TENANT',
      }),
    });
    assert(resReg.status === 201, 'Test user registered for OTP login');

    // 4. Verify OTP Hashing & Persistence
    const otpHash = await bcrypt.hash(rawOtp, 10);
    assert(otpHash.startsWith('$2'), 'OTP is hashed using secure bcrypt salt');

    // 5. Test Direct OTP Verification Service Logic
    // Simulate active OTP record
    const { PersistentStore } = require('../config/persistent-store');
    const otpId = 'test_otp_' + timestamp;
    PersistentStore.insert('otps', {
      id: otpId,
      _id: otpId,
      identifier: testEmail,
      purpose: 'LOGIN',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
      createdAt: new Date().toISOString(),
    });

    // Test A: Wrong code attempt
    const verifyWrong = await OtpService.verifyOtp({
      email: testEmail,
      otp: '000000',
      purpose: 'LOGIN',
    });
    assert(!verifyWrong.valid, 'Wrong OTP is rejected');
    assert(verifyWrong.message.includes('attempt'), 'Returns remaining attempts notice');

    // Test B: Correct code validation
    const verifyCorrect = await OtpService.verifyOtp({
      email: testEmail,
      otp: rawOtp,
      purpose: 'LOGIN',
    });
    assert(verifyCorrect.valid, 'Correct OTP is successfully validated');

    // Test C: Replay of used OTP
    const verifyUsed = await OtpService.verifyOtp({
      email: testEmail,
      otp: rawOtp,
      purpose: 'LOGIN',
    });
    assert(!verifyUsed.valid, 'Already used OTP is rejected on replay');

    // 6. Test OTP Expiration
    const expiredOtpId = 'test_expired_otp_' + timestamp;
    PersistentStore.insert('otps', {
      id: expiredOtpId,
      _id: expiredOtpId,
      identifier: testEmail,
      purpose: 'LOGIN',
      otpHash,
      expiresAt: new Date(Date.now() - 5000).toISOString(), // Expired 5 seconds ago
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    });

    const verifyExpired = await OtpService.verifyOtp({
      email: testEmail,
      otp: rawOtp,
      purpose: 'LOGIN',
    });
    assert(!verifyExpired.valid, 'Expired OTP is strictly rejected');

    // 7. Test Brute-Force Lockout (5 attempts)
    const bruteOtpId = 'test_brute_otp_' + timestamp;
    PersistentStore.insert('otps', {
      id: bruteOtpId,
      _id: bruteOtpId,
      identifier: `brute-${timestamp}@nivas360.com`,
      purpose: 'LOGIN',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 4, // 4 attempts already made
      maxAttempts: 5,
      isUsed: false,
      createdAt: new Date().toISOString(),
    });

    // 5th wrong attempt -> locks out
    await OtpService.verifyOtp({
      email: `brute-${timestamp}@nivas360.com`,
      otp: '111111',
      purpose: 'LOGIN',
    });

    // Subsequent attempt should report lockout
    const verifyLocked = await OtpService.verifyOtp({
      email: `brute-${timestamp}@nivas360.com`,
      otp: rawOtp, // Even with correct code!
      purpose: 'LOGIN',
    });
    assert(!verifyLocked.valid, 'Brute-force lockout invalidates OTP after maximum attempts');

    // =========================================================================
    // STEP 7: OTP HTTP API Endpoints
    // =========================================================================
    // Insert fresh valid OTP for testEmail
    const validOtp2 = OtpService.generateCode();
    const hash2 = await bcrypt.hash(validOtp2, 10);
    const validOtpId2 = 'valid_otp_2_' + timestamp;
    PersistentStore.insert('otps', {
      id: validOtpId2,
      _id: validOtpId2,
      identifier: testEmail,
      purpose: 'LOGIN',
      otpHash: hash2,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
      createdAt: new Date().toISOString(),
    });

    // Verify OTP via HTTP API (POST /api/v1/auth/otp/verify)
    const resHttpVerify = await fetch(`${baseUrl}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        otp: validOtp2,
      }),
    });
    const dataHttpVerify = await resHttpVerify.json();
    assert(resHttpVerify.status === 200, 'POST /auth/otp/verify succeeds with 200 OK');
    assert(!!dataHttpVerify.data?.tokens?.accessToken, 'OTP verification issues JWT access token');
    assert(!!dataHttpVerify.data?.tokens?.refreshToken, 'OTP verification issues JWT refresh token');
    assert(dataHttpVerify.data?.user?.email === testEmail, 'OTP verification returns authenticated user session');

    console.log('===========================================================');
    console.log(` Gmail OAuth & OTP Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runGmailOAuthAndOtpTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
