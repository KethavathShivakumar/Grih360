#!/usr/bin/env node

/**
 * Production Route Verification Script
 * 
 * Executes real calls to every new or changed backend route on production
 * and captures status codes, response payloads, and SMTP delivery results.
 */

const BASE_URL = 'https://grih360.vercel.app/api/v1';
const TEST_EMAIL_NEW = `verify.${Date.now()}@example.com`;
const TEST_EMAIL_OWNER = 'kethavathshiva14@gmail.com';
const TEST_EMAIL_SUPPORT = 'grih360@gmail.com';

const results = [];

async function callApi(name, method, endpoint, body = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  try {
    const opts = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const duration = Date.now() - start;
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }

    const report = {
      name,
      method,
      endpoint,
      status: res.status,
      durationMs: duration,
      success: res.status >= 200 && res.status < 300,
      response: data,
    };
    results.push(report);
    console.log(`[HTTP ${res.status}] ${method} ${endpoint} (${duration}ms) - ${report.name}`);
    return report;
  } catch (err) {
    const report = {
      name,
      method,
      endpoint,
      status: 'FETCH_ERROR',
      durationMs: Date.now() - start,
      success: false,
      error: err.message,
    };
    results.push(report);
    console.error(`[ERR] ${method} ${endpoint} - ${err.message}`);
    return report;
  }
}

async function runTests() {
  console.log('='.repeat(75));
  console.log('  TESTING LIVE PRODUCTION BACKEND (grih360.vercel.app)');
  console.log('='.repeat(75));

  // 1. Health check & Transporter.verify in health
  console.log('\n--- 1. Health & SMTP Diagnostics ---');
  await callApi(
    'Health Check (with transporter.verify & commitHash)',
    'GET',
    '/health'
  );

  await callApi(
    'SMTP Connection Verification',
    'GET',
    '/auth/smtp/verify'
  );

  // 2. check-email for NEW email
  console.log('\n--- 2. Account Discovery (check-email) ---');
  const checkNew = await callApi(
    'Check Email - New Unregistered Address',
    'POST',
    '/auth/check-email',
    { email: TEST_EMAIL_NEW }
  );

  // 3. check-email for EXISTING email
  const checkExisting = await callApi(
    'Check Email - Existing Registered Address',
    'POST',
    '/auth/check-email',
    { email: TEST_EMAIL_SUPPORT }
  );

  // 4. Request Registration OTP (Awaited SMTP Send)
  console.log('\n--- 3. Registration OTP Flow ---');
  const regOtp = await callApi(
    'Request Registration OTP (Dispatched to real inbox)',
    'POST',
    '/auth/register/send-otp',
    {
      email: TEST_EMAIL_OWNER,
      name: 'Shiva Test',
      role: 'TENANT',
    }
  );

  // 5. Verify Registration OTP Code (with test / simulated code)
  await callApi(
    'Verify Registration OTP Code (Intentional invalid code to test validator)',
    'POST',
    '/auth/register/verify-code',
    {
      email: TEST_EMAIL_OWNER,
      otp: '000000',
    }
  );

  // 6. Verify and Create Registration
  await callApi(
    'Verify Registration OTP and Create Account (Missing/Invalid params check)',
    'POST',
    '/auth/register/verify-and-create',
    {
      email: TEST_EMAIL_NEW,
      otp: '123456',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      name: 'Deploy Verify',
      role: 'TENANT',
    }
  );

  // 7. Login with Password
  console.log('\n--- 4. Password Login & Account Access ---');
  await callApi(
    'Login with Password (Testing authentication pipeline)',
    'POST',
    '/auth/login',
    {
      email: TEST_EMAIL_SUPPORT,
      password: 'IncorrectPasswordForSafetyTest123!',
      role: 'TENANT',
    }
  );

  // 8. Forgot Password Send OTP
  console.log('\n--- 5. Forgot Password Flow ---');
  await callApi(
    'Forgot Password - Request OTP (Dispatched via Gmail SMTP)',
    'POST',
    '/auth/forgot-password/send-otp',
    {
      email: TEST_EMAIL_SUPPORT,
    }
  );

  // 9. Forgot Password Reset / Set Password
  await callApi(
    'Forgot Password - Reset / Set Password (Validating code check)',
    'POST',
    '/auth/forgot-password/reset',
    {
      email: TEST_EMAIL_SUPPORT,
      otp: '000000',
      newPassword: 'NewSecurePassword123!',
    }
  );

  // 10. Login OTP Request (Method 2 OTP)
  console.log('\n--- 6. Login OTP Flow ---');
  await callApi(
    'Request Login OTP (Direct OTP dispatch)',
    'POST',
    '/auth/login-otp/send',
    {
      identifier: TEST_EMAIL_SUPPORT,
    }
  );

  // 11. Verify Login OTP
  await callApi(
    'Verify Login OTP (Testing direct OTP verification)',
    'POST',
    '/auth/login-otp/verify',
    {
      identifier: TEST_EMAIL_SUPPORT,
      otp: '000000',
    }
  );

  // 12. Google Set Initial Password
  console.log('\n--- 7. Google Auth Flows ---');
  await callApi(
    'Google Set Initial Password (Validating onboarding token check)',
    'POST',
    '/auth/google/set-initial-password',
    {
      onboardingToken: 'invalid.test.token',
      otp: '000000',
      password: 'TestPassword123!',
    }
  );

  // 13. SMTP Direct Test Delivery (Awaited send with Gmail messageId)
  console.log('\n--- 8. SMTP Delivery Confirmation ---');
  const smtpDirect = await callApi(
    'Direct Test Email Dispatch via Gmail SMTP',
    'POST',
    '/auth/smtp/test-email',
    {
      to: TEST_EMAIL_OWNER,
    }
  );

  console.log('\n' + '='.repeat(75));
  console.log('  TEST EXECUTION COMPLETED');
  console.log('='.repeat(75));
  console.log(JSON.stringify(results, null, 2));
}

runTests();
