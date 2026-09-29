import assert from 'assert';
import http from 'http';
import app from '../app';
import { connectDatabase } from '../config/database';
import { OtpService } from '../services/otp.service';

const PORT = 5105;
const baseUrl = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('===========================================================');
  console.log(' Nivas360 — Two-Step Authentication & Challenge Verification Test');
  console.log('===========================================================');

  try {
    await connectDatabase();
  } catch (err: any) {
    console.log('[TestServer] Using PersistentStore resilient mode');
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`[TestServer] Server listening at ${baseUrl}`);

  try {
    const timestamp = Date.now();
    const testEmail = `tenant_2step_${timestamp}@nivas360.com`;
    const testPassword = 'Password123!';

    // STEP 1: Register Account
    const resReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ravi Kumar',
        email: testEmail,
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        password: testPassword,
        role: 'TENANT',
      }),
    });
    assert(resReg.status === 201, 'POST /auth/register succeeds');
    console.log(' ✅ PASS: User registered successfully');

    // STEP 2: Non-existent account returns generic 401 (Prevent Account Enumeration)
    const resFakeUser = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody_does_not_exist@nivas360.com',
        password: 'SomePassword123!',
      }),
    });
    const fakeData = await resFakeUser.json();
    assert(resFakeUser.status === 401, 'Non-existent account rejected with 401');
    assert(fakeData.message === 'Invalid email or password', 'Generic error message prevents user enumeration');
    console.log(' ✅ PASS: Non-existent account returns generic 401 error message');

    // STEP 3: Wrong password returns generic 401
    const resBadPass = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!',
      }),
    });
    const badPassData = await resBadPass.json();
    assert(resBadPass.status === 401, 'Bad password rejected with 401');
    assert(badPassData.message === 'Invalid email or password', 'Generic error message on bad password');
    console.log(' ✅ PASS: Incorrect password returns generic 401 error message');

    // STEP 4: Step A — Password Verification & Challenge Generation
    const resLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await resLogin.json();
    assert(resLogin.status === 200, 'POST /auth/login returns 200 OK');
    assert(loginData.requiresEmailOtp === true, 'Response specifies requiresEmailOtp: true');
    assert(typeof loginData.challengeId === 'string' && loginData.challengeId.length >= 32, 'Returns opaque random challengeId');
    assert(typeof loginData.maskedEmail === 'string' && loginData.maskedEmail.includes('*'), 'Returns masked email representation');
    assert(!loginData.data?.tokens && !loginData.tokens, 'No JWT tokens issued in Step A');
    console.log(' ✅ PASS: Step A password check issues stateful challenge without leaking JWT tokens');

    const challengeId1 = loginData.challengeId;

    // STEP 5: Verify Login OTP with Missing Input
    const resEmptyOtp = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId1,
        otp: '',
      }),
    });
    assert(resEmptyOtp.status === 400, 'Empty OTP rejected with 400 Bad Request');
    console.log(' ✅ PASS: Empty OTP rejected with 400 Bad Request');

    // STEP 6: Verify Login OTP with Bad Challenge ID
    const resFakeChallenge = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: 'non_existent_fake_challenge_id_12345',
        otp: '123456',
      }),
    });
    assert(resFakeChallenge.status === 400, 'Invalid challenge ID rejected with 400 Bad Request');
    console.log(' ✅ PASS: Invalid challenge ID rejected with 400 Bad Request');

    // STEP 7: Wrong OTP code increments attempts & returns remaining attempts
    const resWrongOtp = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId1,
        otp: '000000',
      }),
    });
    const wrongOtpData = await resWrongOtp.json();
    assert(resWrongOtp.status === 401, 'Wrong OTP rejected with 401 Unauthorized');
    assert(wrongOtpData.remainingAttempts === 4, 'Remaining attempts tracked accurately (expected 4, got ' + wrongOtpData.remainingAttempts + ')');
    assert(wrongOtpData.message.includes('4 attempts remaining'), 'Message indicates remaining attempts');
    console.log(' ✅ PASS: Wrong OTP increments counter and reports remaining attempts');

    // STEP 8: Step C — Resend Rate Limit Cooldown (within 60 seconds)
    const resResendCooldown = await fetch(`${baseUrl}/auth/resend-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId1,
      }),
    });
    const resendCooldownData = await resResendCooldown.json();
    assert(resResendCooldown.status === 429, 'Immediate resend rejected with 429 Too Many Requests');
    assert(resendCooldownData.code === 'RATE_LIMIT_COOLDOWN', 'Rate limit cooldown error code preserved');
    console.log(' ✅ PASS: Resend within 60-second cooldown window rejected with 429 Too Many Requests');

    // STEP 9: Initiate New Login Session & Retrieve Dispatched OTP from Store
    const resLogin2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData2 = await resLogin2.json();
    const challengeId2 = loginData2.challengeId;

    // Check that historical challenge 1 is invalidated by new login
    const resReplayOld = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId1,
        otp: '123456',
      }),
    });
    assert(resReplayOld.status === 400, 'Superseded historical challenge rejected with 400 Bad Request');
    console.log(' ✅ PASS: Initiating new login invalidates prior open challenges');

    // STEP 10: Complete Verification with Correct OTP
    // To obtain the exact code for testing without actual inbox retrieval, we can inspect test storage or test with known code
    let validOtpCode = '';
    const { PersistentStore } = require('../config/persistent-store');
    const otps = PersistentStore.loadCollection('otps');
    const activeRecord = otps.filter((o: any) => o.email === testEmail && !o.isUsed).slice(-1)[0];

    // Compute or test with generated code
    if (activeRecord) {
      // Find matching code in 100000-999999 space
      for (let c = 100000; c <= 999999; c++) {
        if (OtpService.verifyOtpHash(c.toString(), activeRecord.otpHash)) {
          validOtpCode = c.toString();
          break;
        }
      }
    }

    assert(validOtpCode.length === 6, 'Valid OTP discovered from secure HMAC registry');

    const resVerifySuccess = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId2,
        otp: validOtpCode,
      }),
    });
    const verifySuccessData = await resVerifySuccess.json();
    assert(resVerifySuccess.status === 200, 'Correct OTP validation succeeds with 200 OK');
    assert(verifySuccessData.data?.tokens?.accessToken, 'Access token issued upon successful OTP verification');
    assert(verifySuccessData.data?.tokens?.refreshToken, 'Refresh token issued upon successful OTP verification');
    assert(verifySuccessData.data?.user?.email === testEmail, 'User profile returned in authenticated session');
    console.log(' ✅ PASS: Step B code verification succeeds and issues JWT access/refresh tokens');

    const authToken = verifySuccessData.data.tokens.accessToken;

    // STEP 11: Replay of consumed challenge / code rejected
    const resReplayConsumed = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId2,
        otp: validOtpCode,
      }),
    });
    assert(resReplayConsumed.status === 400, 'Replay of completed challenge rejected with 400 Bad Request');
    console.log(' ✅ PASS: Replay attack prevention: already-completed challenge is strictly rejected');

    // STEP 12: Authenticated Session Access (GET /auth/me)
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const meData = await resMe.json();
    assert(resMe.status === 200, 'GET /auth/me returns 200 with Bearer token');
    assert(meData.data?.user?.email === testEmail, 'GET /auth/me verifies active user profile');
    console.log(' ✅ PASS: Authenticated session confirmed via GET /auth/me');

    console.log('===========================================================');
    console.log(' Two-Step Authentication Tests: ALL 12 TESTS PASSED');
    console.log('===========================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
