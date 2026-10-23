#!/usr/bin/env node

/**
 * End-to-End Registration Flow Test
 * 
 * Tests the complete 3-step registration flow across all roles:
 * 1. PROFESSIONAL (Service Professional)
 * 2. TENANT
 * 3. OWNER
 * 
 * Verifies:
 * - Step 1: POST /api/v1/auth/check-email
 * - Step 1: POST /api/v1/auth/register/send-otp
 * - Step 2: POST /api/v1/auth/register/verify-code (binds email + role into signed registrationToken)
 * - Step 3: POST /api/v1/auth/register/verify-and-create (sends registrationToken + password, NO code)
 * - State validation: OTP cannot be reused, registration session tokens expire cleanly
 * - Negative test: Calling verify-and-create without token or OTP produces friendly 400 SESSION_EXPIRED
 * - Negative test: Calling verify-and-create with invalid/expired token produces friendly 401 REGISTRATION_SESSION_EXPIRED
 * 
 * NOTE: Passwords, OTP codes, and secrets are NEVER logged or printed.
 */

const http = require('http');
const path = require('path');

// Ensure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_jwt_secret_key_1234567890_min_32';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key_1234567890_min_32';

// Import backend app
const app = require(path.join(__dirname, '../backend/dist/app')).default;

let server;
let baseUrl;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      console.log(`[Test Server] Running at ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function requestJson(endpoint, method = 'GET', body = null) {
  const url = `${baseUrl}${endpoint}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function testRoleRegistration(role, roleDisplayName) {
  console.log(`\n======================================================`);
  console.log(`  TESTING FLOW FOR ROLE: ${roleDisplayName} (${role})`);
  console.log(`======================================================`);

  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const testEmail = `test.${role.toLowerCase()}.${uniqueId}@example.com`;
  const dummyPassword = `TestPass123!`;

  // Step 1: Check Email
  console.log(`\n[Step 1A] POST /auth/check-email`);
  const checkRes = await requestJson('/auth/check-email', 'POST', { email: testEmail });
  console.log(`  -> Status: ${checkRes.status} (Expected: 200)`);
  console.log(`  -> Exists: ${checkRes.data?.data?.exists} (Expected: false)`);
  if (checkRes.status !== 200 || checkRes.data?.data?.exists !== false) {
    throw new Error(`Failed check-email for ${role}`);
  }

  // Step 1B: Send Registration OTP
  console.log(`\n[Step 1B] POST /auth/register/send-otp`);
  const sendRes = await requestJson('/auth/register/send-otp', 'POST', {
    email: testEmail,
    role: role,
    name: `Test ${roleDisplayName}`,
  });
  console.log(`  -> Status: ${sendRes.status} (Expected: 200)`);
  console.log(`  -> Message: ${sendRes.data?.message}`);
  if (sendRes.status !== 200 || !sendRes.data?.data?.rawOtp) {
    throw new Error(`Failed send-otp for ${role}`);
  }
  const rawOtp = sendRes.data.data.rawOtp; // Used internally, NEVER printed

  // Step 2: Verify Registration OTP Code
  console.log(`\n[Step 2] POST /auth/register/verify-code`);
  const verifyRes = await requestJson('/auth/register/verify-code', 'POST', {
    email: testEmail,
    otp: rawOtp,
    role: role,
  });
  console.log(`  -> Status: ${verifyRes.status} (Expected: 200)`);
  console.log(`  -> Success: ${verifyRes.data?.success}`);
  console.log(`  -> Registration Token Present: ${Boolean(verifyRes.data?.data?.registrationToken)}`);
  console.log(`  -> Role in response: ${verifyRes.data?.data?.role}`);
  if (verifyRes.status !== 200 || !verifyRes.data?.data?.registrationToken) {
    throw new Error(`Failed verify-code for ${role}`);
  }
  const registrationToken = verifyRes.data.data.registrationToken;

  // Step 3: Complete Account Creation (Sending registrationToken + password, NO code)
  console.log(`\n[Step 3] POST /auth/register/verify-and-create`);
  const createRes = await requestJson('/auth/register/verify-and-create', 'POST', {
    registrationToken: registrationToken,
    email: testEmail,
    role: role,
    password: dummyPassword,
    name: `Test ${roleDisplayName}`,
  });
  console.log(`  -> Status: ${createRes.status} (Expected: 201)`);
  console.log(`  -> Message: ${createRes.data?.message}`);
  console.log(`  -> User ID Created: ${Boolean(createRes.data?.data?.user?.id || createRes.data?.data?.user?._id)}`);
  console.log(`  -> Assigned Role: ${createRes.data?.data?.user?.role} (Expected: ${role})`);
  console.log(`  -> Tokens Issued: Access Token = ${Boolean(createRes.data?.data?.tokens?.accessToken)}, Refresh Token = ${Boolean(createRes.data?.data?.tokens?.refreshToken)}`);
  if (createRes.status !== 201 || createRes.data?.data?.user?.role !== role) {
    throw new Error(`Failed verify-and-create for ${role}: ${JSON.stringify(createRes.data)}`);
  }

  // Step 4: Verify OTP Consumption (Atomic single-use check)
  console.log(`\n[Post-check] Ensure OTP cannot be verified a second time`);
  const reuseRes = await requestJson('/auth/register/verify-code', 'POST', {
    email: testEmail,
    otp: rawOtp,
    role: role,
  });
  console.log(`  -> Status: ${reuseRes.status} (Expected: 400 or 401, rejected)`);
  console.log(`  -> Rejection Code: ${reuseRes.data?.code}`);
  if (reuseRes.status === 200) {
    throw new Error(`Security violation: OTP was reusable!`);
  }

  console.log(`>>> [PASS] Flow succeeded completely for ${roleDisplayName}! <<<`);
  return { success: true, email: testEmail, role, statusCodes: [checkRes.status, sendRes.status, verifyRes.status, createRes.status] };
}

async function runNegativeTests() {
  console.log(`\n======================================================`);
  console.log(`  TESTING NEGATIVE CASES & FRIENDLY ERROR RECOVERY`);
  console.log(`======================================================`);

  const mockTestPass = ['Mock', 'Pass', '123!'].join('');

  // Case 1: Missing token and missing OTP
  console.log(`\n[Negative 1] Missing registration token & OTP on verify-and-create`);
  const emptyRes = await requestJson('/auth/register/verify-and-create', 'POST', {
    password: mockTestPass,
  });
  console.log(`  -> Status: ${emptyRes.status} (Expected: 400)`);
  console.log(`  -> Code: ${emptyRes.data?.code} (Expected: SESSION_EXPIRED)`);
  console.log(`  -> Message: "${emptyRes.data?.message}"`);
  if (emptyRes.status !== 400 || emptyRes.data?.code !== 'SESSION_EXPIRED') {
    throw new Error(`Unexpected error format for missing registration token`);
  }

  // Case 2: Tampered / expired registration token
  console.log(`\n[Negative 2] Invalid/expired registration token on verify-and-create`);
  const invalidTokenRes = await requestJson('/auth/register/verify-and-create', 'POST', {
    registrationToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    password: mockTestPass,
  });
  console.log(`  -> Status: ${invalidTokenRes.status} (Expected: 401)`);
  console.log(`  -> Code: ${invalidTokenRes.data?.code} (Expected: REGISTRATION_SESSION_EXPIRED)`);
  console.log(`  -> Message: "${invalidTokenRes.data?.message}"`);
  if (invalidTokenRes.status !== 401 || invalidTokenRes.data?.code !== 'REGISTRATION_SESSION_EXPIRED') {
    throw new Error(`Unexpected error format for invalid registration token`);
  }

  console.log(`>>> [PASS] Negative tests verified friendly error behavior! <<<`);
}

async function main() {
  try {
    await startServer();

    // 1. Service Professional
    await testRoleRegistration('PROFESSIONAL', 'Service Professional');

    // 2. Tenant
    await testRoleRegistration('TENANT', 'Tenant');

    // 3. Owner
    await testRoleRegistration('OWNER', 'Owner');

    // 4. Negative tests
    await runNegativeTests();

    console.log(`\n======================================================`);
    console.log(`  ALL REGISTRATION FLOW TESTS PASSED SUCCESSFULLY!    `);
    console.log(`======================================================\n`);
    process.exitCode = 0;
  } catch (err) {
    console.error(`\n[FATAL TEST FAILURE]:`, err.message || err);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

main();
