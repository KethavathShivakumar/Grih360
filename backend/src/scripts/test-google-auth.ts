import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

// DEV database only
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import app from '../app';
import { connectDatabase } from '../config/database';
import { config } from '../config/env';
import { UserModel } from '../models/user.model';
import { TenantProfileModel } from '../models/tenant-profile.model';

// Store original verifyIdToken
const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;

let server: http.Server;
let baseUrl: string;

function makeRequest(
  urlPath: string,
  method: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const postData = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData).toString() } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runGoogleAuthTests() {
  console.log('=================================================================');
  console.log('TEST SUITE: GOOGLE AUTHENTICATION ON DEV DATABASE');
  console.log('=================================================================');

  // 1. Verify DB connection to DEV DB ONLY
  await connectDatabase();
  assert(mongoose.connection.readyState === 1, 'MongoDB connection must be ready');
  const dbName = mongoose.connection.name;
  console.log(`Connected to MongoDB Database: ${dbName}`);
  assert(dbName === 'grih360_dev', `ABORT: Must be connected to grih360_dev ONLY! Found: ${dbName}`);

  // 2. Start Test HTTP Server
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  // Mock OAuth2Client.prototype.verifyIdToken
  (OAuth2Client.prototype as any).verifyIdToken = async function (options: any) {
    const token = options.idToken;

    if (token === 'TOKEN_WRONG_AUDIENCE') {
      throw new Error('Wrong recipient, payload audience != requiredAudience');
    }
    if (token === 'TOKEN_EXPIRED') {
      throw new Error('Token used too late, 123456 < 234567');
    }

    const basePayload = {
      aud: config.googleWebClientId,
      iss: 'accounts.google.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    if (token === 'TOKEN_UNVERIFIED_EMAIL') {
      return {
        getPayload: () => ({
          ...basePayload,
          sub: 'google-sub-unverified-1',
          email: 'google.unverified@example.com',
          email_verified: false,
          name: 'Unverified Google User',
        }),
      };
    }
    if (token === 'TOKEN_ADMIN_USER') {
      return {
        getPayload: () => ({
          ...basePayload,
          sub: 'google-sub-admin-1',
          email: 'testadmin_google@example.com',
          email_verified: true,
          name: 'Admin Google User',
        }),
      };
    }
    if (token === 'TOKEN_INACTIVE_USER') {
      return {
        getPayload: () => ({
          ...basePayload,
          sub: 'google-sub-inactive-1',
          email: 'testinactive_google@example.com',
          email_verified: true,
          name: 'Inactive Google User',
        }),
      };
    }
    if (token === 'TOKEN_NEW_USER') {
      return {
        getPayload: () => ({
          ...basePayload,
          sub: 'google-sub-newuser-999',
          email: 'google.newuser.dev@example.com',
          email_verified: true,
          name: 'Aarav Sharma',
          picture: 'https://lh3.googleusercontent.com/a/test-photo-url',
        }),
      };
    }
    if (token === 'TOKEN_EXISTING_USER_LINK') {
      return {
        getPayload: () => ({
          ...basePayload,
          sub: 'google-sub-link-101',
          email: 'existing_verified_user@example.com',
          email_verified: true,
          name: 'Existing Verified User',
        }),
      };
    }
    if (token === 'TOKEN_UNVERIFIED_EXISTING_ACCOUNT') {
      return {
        getPayload: () => ({
          ...basePayload,
          sub: 'google-sub-unverified-account-link-202',
          email: 'existing_unverified_user@example.com',
          email_verified: true,
          name: 'Takeover Protected User',
        }),
      };
    }

    throw new Error('Unknown mock token');
  };

  // Clean up any test users from prior runs
  await UserModel.deleteMany({
    email: {
      $in: [
        'testadmin_google@example.com',
        'testinactive_google@example.com',
        'google.newuser.dev@example.com',
        'existing_verified_user@example.com',
        'existing_unverified_user@example.com',
      ],
    },
  });

  const salt = await bcrypt.genSalt(10);
  const dummyPasswordHash = await bcrypt.hash('Secret123!', salt);

  // Seed Admin user
  await UserModel.create({
    name: 'Dev Admin User',
    email: 'testadmin_google@example.com',
    phone: '9848011001',
    passwordHash: dummyPasswordHash,
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
  });

  // Seed Inactive user
  await UserModel.create({
    name: 'Dev Inactive User',
    email: 'testinactive_google@example.com',
    phone: '9848011002',
    passwordHash: dummyPasswordHash,
    role: 'TENANT',
    isActive: false,
    isEmailVerified: true,
  });

  // Seed Existing Verified user
  const existingVerified = await UserModel.create({
    name: 'Existing Verified User',
    email: 'existing_verified_user@example.com',
    phone: '9848011003',
    passwordHash: dummyPasswordHash,
    role: 'TENANT',
    isActive: true,
    isEmailVerified: true,
    authProviders: ['LOCAL'],
  });

  // Seed Existing Unverified user
  const existingUnverified = await UserModel.create({
    name: 'Existing Unverified User',
    email: 'existing_unverified_user@example.com',
    phone: '9848011004',
    passwordHash: dummyPasswordHash,
    role: 'TENANT',
    isActive: true,
    isEmailVerified: false,
    authProviders: ['LOCAL'],
  });

  const testResults: { name: string; pass: boolean; details: string }[] = [];

  // TEST 1: Wrong audience -> rejected (401)
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_WRONG_AUDIENCE',
    });
    assert.strictEqual(res.status, 401, `Status must be 401, got ${res.status}`);
    assert.strictEqual(res.body.success, false);
    testResults.push({ name: 'Wrong Audience Rejected', pass: true, details: `HTTP ${res.status}: ${res.body.code}` });
    console.log('[PASS] Test 1: Wrong Audience rejected with 401');
  } catch (err: any) {
    testResults.push({ name: 'Wrong Audience Rejected', pass: false, details: err.message });
    console.error('[FAIL] Test 1:', err);
  }

  // TEST 2: Expired token -> rejected (401)
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_EXPIRED',
    });
    assert.strictEqual(res.status, 401, `Status must be 401, got ${res.status}`);
    assert.strictEqual(res.body.success, false);
    testResults.push({ name: 'Expired Token Rejected', pass: true, details: `HTTP ${res.status}: ${res.body.code}` });
    console.log('[PASS] Test 2: Expired Token rejected with 401');
  } catch (err: any) {
    testResults.push({ name: 'Expired Token Rejected', pass: false, details: err.message });
    console.error('[FAIL] Test 2:', err);
  }

  // TEST 3: Unverified email -> rejected (401)
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_UNVERIFIED_EMAIL',
    });
    assert.strictEqual(res.status, 401, `Status must be 401, got ${res.status}`);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'UNVERIFIED_EMAIL');
    testResults.push({ name: 'Unverified Email Rejected', pass: true, details: `HTTP ${res.status}: ${res.body.code}` });
    console.log('[PASS] Test 3: Unverified email rejected with 401 UNVERIFIED_EMAIL');
  } catch (err: any) {
    testResults.push({ name: 'Unverified Email Rejected', pass: false, details: err.message });
    console.error('[FAIL] Test 3:', err);
  }

  // TEST 4: Admin account attempt -> rejected (403)
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_ADMIN_USER',
    });
    assert.strictEqual(res.status, 403, `Status must be 403, got ${res.status}`);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'ADMIN_GOOGLE_LOGIN_FORBIDDEN');
    testResults.push({ name: 'Admin Account Google Login Forbidden', pass: true, details: `HTTP ${res.status}: ${res.body.code}` });
    console.log('[PASS] Test 4: Admin account rejected with 403 ADMIN_GOOGLE_LOGIN_FORBIDDEN');
  } catch (err: any) {
    testResults.push({ name: 'Admin Account Google Login Forbidden', pass: false, details: err.message });
    console.error('[FAIL] Test 4:', err);
  }

  // TEST 5: Inactive user -> rejected (403)
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_INACTIVE_USER',
    });
    assert.strictEqual(res.status, 403, `Status must be 403, got ${res.status}`);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'ACCOUNT_SUSPENDED');
    testResults.push({ name: 'Inactive User Rejected', pass: true, details: `HTTP ${res.status}: ${res.body.code}` });
    console.log('[PASS] Test 5: Inactive user rejected with 403 ACCOUNT_SUSPENDED');
  } catch (err: any) {
    testResults.push({ name: 'Inactive User Rejected', pass: false, details: err.message });
    console.error('[FAIL] Test 5:', err);
  }

  // TEST 6: New user without phone -> returns needsProfile: true
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_NEW_USER',
    });
    assert.strictEqual(res.status, 200, `Status must be 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data?.needsProfile, true);
    assert.strictEqual(res.body.data?.email, 'google.newuser.dev@example.com');
    assert.strictEqual(res.body.data?.name, 'Aarav Sharma');
    testResults.push({ name: 'New User Needs Profile Check', pass: true, details: 'needsProfile: true returned with Google profile data' });
    console.log('[PASS] Test 6: New user without phone returns needsProfile: true');
  } catch (err: any) {
    testResults.push({ name: 'New User Needs Profile Check', pass: false, details: err.message });
    console.error('[FAIL] Test 6:', err);
  }

  // TEST 7: New user with phone and role -> creates user, profile, returns tokens
  let newUserRefreshToken = '';
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_NEW_USER',
      role: 'TENANT',
      phone: '9848099887',
    });
    assert.strictEqual(res.status, 200, `Status must be 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data?.tokens?.accessToken, 'Access token must be present');
    assert(res.body.data?.tokens?.refreshToken, 'Refresh token must be present');
    newUserRefreshToken = res.body.data.tokens.refreshToken;

    const user = res.body.data.user;
    assert.strictEqual(user.email, 'google.newuser.dev@example.com');
    assert.strictEqual(user.phone, '9848099887');
    assert.strictEqual(user.role, 'TENANT');
    assert.strictEqual(user.hasPassword, false, 'Google-only user hasPassword must be false');
    assert(user.authProviders.includes('GOOGLE'), 'authProviders must include GOOGLE');

    // Verify DB records
    const dbUser = await UserModel.findOne({ email: 'google.newuser.dev@example.com' });
    assert(dbUser, 'User must exist in DB');
    assert.strictEqual(dbUser.googleId, 'google-sub-newuser-999');
    assert.strictEqual(dbUser.isEmailVerified, true);

    const profile = await TenantProfileModel.findOne({ userId: dbUser._id });
    assert(profile, 'TenantProfile must be created');
    assert.strictEqual(
      profile.identityVerificationStatus,
      'NOT_STARTED',
      'Google sign-in must not mark identityVerificationStatus as verified'
    );

    testResults.push({
      name: 'New User Account Creation',
      pass: true,
      details: `Created user ${dbUser._id}, googleId=${dbUser.googleId}, identityStatus=${profile.identityVerificationStatus}`,
    });
    console.log('[PASS] Test 7: New user created with TENANT profile and NOT_STARTED identityVerificationStatus');
  } catch (err: any) {
    testResults.push({ name: 'New User Account Creation', pass: false, details: err.message });
    console.error('[FAIL] Test 7:', err);
  }

  // TEST 8: Existing user link -> links googleId, updates authProviders, preserves password
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_EXISTING_USER_LINK',
    });
    assert.strictEqual(res.status, 200, `Status must be 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data?.user?.hasPassword, true, 'hasPassword must be true for linked user');

    const updated = await UserModel.findById(existingVerified._id).select('+passwordHash');
    assert(updated, 'User must exist');
    assert.strictEqual(updated.googleId, 'google-sub-link-101');
    assert((updated.authProviders || []).includes('GOOGLE') && (updated.authProviders || []).includes('LOCAL'));
    assert(updated.passwordHash, 'Password hash must be preserved for verified account link');

    testResults.push({
      name: 'Existing User Link',
      pass: true,
      details: `Linked googleId=${updated.googleId}, authProviders=[${(updated.authProviders || []).join(',')}], password preserved`,
    });
    console.log('[PASS] Test 8: Existing user linked successfully with password preserved');
  } catch (err: any) {
    testResults.push({ name: 'Existing User Link', pass: false, details: err.message });
    console.error('[FAIL] Test 8:', err);
  }

  // TEST 9: Unverified existing account -> sets isEmailVerified, clears passwordHash to prevent takeover
  try {
    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'TOKEN_UNVERIFIED_EXISTING_ACCOUNT',
    });
    assert.strictEqual(res.status, 200, `Status must be 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data?.user?.hasPassword, false, 'hasPassword must be false after clearing hash');

    const updated = await UserModel.findById(existingUnverified._id).select('+passwordHash');
    assert(updated, 'User must exist');
    assert.strictEqual(updated.googleId, 'google-sub-unverified-account-link-202');
    assert.strictEqual(updated.isEmailVerified, true, 'Email must be marked verified');
    assert(!updated.passwordHash, 'Password hash must be CLEARED to prevent account takeover');

    testResults.push({
      name: 'Unverified Existing Account Link & Takeover Protection',
      pass: true,
      details: `googleId linked, isEmailVerified=true, passwordHash cleared (takeover prevented)`,
    });
    console.log('[PASS] Test 9: Unverified existing account linked, email verified, passwordHash cleared');
  } catch (err: any) {
    testResults.push({ name: 'Unverified Existing Account Link & Takeover Protection', pass: false, details: err.message });
    console.error('[FAIL] Test 9:', err);
  }

  // TEST 10: Session survival test -> Refresh token rotation survives app reopen
  try {
    assert(newUserRefreshToken, 'Need refresh token from Test 7');
    const res = await makeRequest('/api/v1/auth/refresh', 'POST', {
      refreshToken: newUserRefreshToken,
    });
    assert.strictEqual(res.status, 200, `Refresh status must be 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data?.tokens?.accessToken || res.body.data?.accessToken, 'New access token must be issued');
    const rotatedRefresh = res.body.data?.tokens?.refreshToken || res.body.data?.refreshToken;
    assert(rotatedRefresh, 'Rotated refresh token must be issued');
    assert.notStrictEqual(rotatedRefresh, newUserRefreshToken, 'Refresh token must be rotated');

    testResults.push({
      name: 'Session Survival (Refresh Token Rotation)',
      pass: true,
      details: `New accessToken issued (15m), refresh token rotated (30d). Google session survives close/reopen.`,
    });
    console.log('[PASS] Test 10: Session survives close and reopen via token refresh rotation');
  } catch (err: any) {
    testResults.push({ name: 'Session Survival (Refresh Token Rotation)', pass: false, details: err.message });
    console.error('[FAIL] Test 10:', err);
  }

  // TEST 11: Missing GOOGLE_WEB_CLIENT_ID -> returns 503, does not crash
  try {
    const savedClientId = config.googleWebClientId;
    (config as any).googleWebClientId = '';

    const res = await makeRequest('/api/v1/auth/google', 'POST', {
      idToken: 'ANY_TOKEN',
    });
    assert.strictEqual(res.status, 503, `Status must be 503 when client ID missing, got ${res.status}`);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'SERVICE_UNAVAILABLE');

    (config as any).googleWebClientId = savedClientId;

    testResults.push({
      name: 'Missing Client ID Returns 503',
      pass: true,
      details: `HTTP 503 SERVICE_UNAVAILABLE returned gracefully without crash`,
    });
    console.log('[PASS] Test 11: Missing GOOGLE_WEB_CLIENT_ID returns 503 gracefully');
  } catch (err: any) {
    testResults.push({ name: 'Missing Client ID Returns 503', pass: false, details: err.message });
    console.error('[FAIL] Test 11:', err);
  }

  // Cleanup test users
  await UserModel.deleteMany({
    email: {
      $in: [
        'testadmin_google@example.com',
        'testinactive_google@example.com',
        'google.newuser.dev@example.com',
        'existing_verified_user@example.com',
        'existing_unverified_user@example.com',
      ],
    },
  });

  // Restore OAuth2Client prototype
  OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;

  // Close HTTP server & Mongo connection
  server.close();
  await mongoose.disconnect();

  console.log('\n=================================================================');
  console.log('SUMMARY OF GOOGLE AUTH TEST SUITE');
  console.log('=================================================================');
  let allPass = true;
  for (const r of testResults) {
    console.log(`${r.pass ? '[PASS]' : '[FAIL]'} ${r.name}: ${r.details}`);
    if (!r.pass) allPass = false;
  }
  console.log('=================================================================');
  if (allPass) {
    console.log('ALL GOOGLE AUTH DEV DATABASE TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

runGoogleAuthTests().catch((err) => {
  console.error('Fatal error in Google auth test:', err);
  process.exit(1);
});
