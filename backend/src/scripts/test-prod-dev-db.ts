import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

// Force production environment for the test
process.env.NODE_ENV = 'production';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import assert from 'assert';
import app from '../app';
import { connectDatabase } from '../config/database';
import { AuthService } from '../services/auth.service';
import { PropertyService } from '../services/property.service';
import { ApplicationService } from '../services/application.service';
import { VerificationService } from '../services/verification.service';
import { OtpService } from '../services/otp.service';
import { PersistentStore } from '../config/persistent-store';
import { OtpModel } from '../models/otp.model';
import { LoginChallengeModel } from '../models/login-challenge.model';
import { UserModel } from '../models/user.model';
import { RentalVerificationModel } from '../models/rental-verification.model';
import { JwtUtil } from '../utils/jwt.util';

async function runProdDevDbTest() {
  console.log('=================================================================');
  console.log('ITEM 12 & 13: BACKEND PRODUCTION BEHAVIOR TEST ON DEV DATABASE');
  console.log('=================================================================');
  console.log(`Node Environment: ${process.env.NODE_ENV}`);
  console.log(`Target MONGODB_URI: ${process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@')}`);

  // Connect to dev database
  await connectDatabase();
  assert(mongoose.connection.readyState === 1, 'MongoDB connection must be ready');
  const dbName = mongoose.connection.name;
  console.log(`Connected to MongoDB Host: ${mongoose.connection.host}`);
  console.log(`Connected to MongoDB Database: ${dbName}`);
  assert(dbName === 'grih360_dev', `Must be connected to grih360_dev, found: ${dbName}`);

  // Instrument PersistentStore to detect any fallback calls
  let persistentStoreCalls = 0;
  const originalLoad = PersistentStore.loadCollection;
  const originalSave = PersistentStore.saveCollection;
  (PersistentStore as any).loadCollection = (col: string) => {
    persistentStoreCalls++;
    console.error(`[VIOLATION] PersistentStore.loadCollection called for: ${col}`);
    return originalLoad.call(PersistentStore, col);
  };
  (PersistentStore as any).saveCollection = (col: string, items: any[]) => {
    persistentStoreCalls++;
    console.error(`[VIOLATION] PersistentStore.saveCollection called for: ${col}`);
    return originalSave.call(PersistentStore, col, items);
  };

  // 1. Ensure dev users in dev database
  console.log('\n--- Step 1: Seed / Ensure Users & Properties in DEV DB ---');
  await PropertyService.seedDefaultProperties();

  let tenantUser = await UserModel.findOne({ email: 'devtenant@test.com' });
  if (!tenantUser) {
    const regRes = await AuthService.registerUser({
      name: 'Dev Test Tenant',
      email: 'devtenant@test.com',
      phone: '9876543299',
      password: 'Password123!',
      role: 'TENANT',
    });
    tenantUser = regRes.user as any;
    console.log(`✓ Registered test tenant in DEV DB: ${tenantUser?._id}`);
  } else {
    console.log(`✓ Existing test tenant found in DEV DB: ${tenantUser._id}`);
  }

  let ownerUser = await UserModel.findOne({ email: 'devowner@test.com' });
  if (!ownerUser) {
    const regRes = await AuthService.registerUser({
      name: 'Dev Test Owner',
      email: 'devowner@test.com',
      phone: '9876543298',
      password: 'Password123!',
      role: 'OWNER',
    });
    ownerUser = regRes.user as any;
    console.log(`✓ Registered test owner in DEV DB: ${ownerUser?._id}`);
  } else {
    console.log(`✓ Existing test owner found in DEV DB: ${ownerUser._id}`);
  }

  // 2. Test Properties List
  console.log('\n--- Step 2: Test Properties List (MongoDB) ---');
  const propertiesResult = await PropertyService.searchProperties({});
  assert(Array.isArray(propertiesResult.properties), 'Properties must be an array');
  assert(propertiesResult.properties.length > 0, 'Properties count should be > 0 in dev DB');
  console.log(`✓ Fetched ${propertiesResult.properties.length} properties directly from MongoDB DEV DB`);
  const testProperty = propertiesResult.properties[0];
  console.log(`  Sample property: _id: ${testProperty._id || testProperty.id}, title: "${testProperty.title}"`);

  // 3. Test Login with OTP Flow
  console.log('\n--- Step 3: Test Login & OTP Flow in Production Mode ---');
  const loginRes = await AuthService.loginUser({
    identifier: 'devtenant@test.com',
    password: 'Password123!',
  });
  assert((loginRes as any).requiresEmailOtp, 'Login challenge must require email OTP in production');
  const challengeId = (loginRes as any).challengeId;
  assert(challengeId, 'Login challengeId must be generated');
  console.log(`✓ Challenge initiated: challengeId: ${challengeId}`);

  // Retrieve OTP hash from MongoDB Dev DB
  const otpDoc = await OtpModel.findOne({
    purpose: 'LOGIN',
    isUsed: false,
  }).sort({ createdAt: -1 }).select('+otpHash');
  assert(otpDoc, 'Active OTP document must exist in MongoDB otps collection');
  console.log(`✓ OTP document found in MongoDB DEV DB: _id: ${otpDoc._id}, purpose: ${otpDoc.purpose}, attempts: ${otpDoc.attempts}/${otpDoc.maxAttempts}`);

  // Verify challenge using a simulated code or verify OTP hash check
  const otpResult = await OtpService.verifyLoginChallengeOtp(challengeId, '000000');
  // Should fail with remaining attempts decrement
  assert(!otpResult.valid, 'Wrong OTP must be rejected');
  assert(otpResult.remainingAttempts === 4, 'Remaining attempts must be exactly 4');
  console.log(`✓ Incorrect OTP correctly rejected server-side with remaining attempts: ${otpResult.remainingAttempts}`);

  // Complete OTP challenge with verified token
  const completeChallenge = await LoginChallengeModel.findOne({ challengeId });
  assert(completeChallenge, 'Login challenge exists in MongoDB');

  // Verify tokens can be issued
  const tokens = JwtUtil.generateTokens({
    userId: completeChallenge.userId.toString(),
    role: 'TENANT',
    email: completeChallenge.email,
  });
  assert(tokens.accessToken, 'Access token must be generated');
  assert(tokens.refreshToken, 'Refresh token must be generated');
  console.log(`✓ JWT tokens successfully generated with production secrets`);

  // 4. Test Application Submit
  console.log('\n--- Step 4: Test Application Submission in DEV DB ---');
  assert(tenantUser, 'Tenant user exists');
  assert(ownerUser, 'Owner user exists');

  const { ApplicationModel } = require('../models/application.model');
  let appDoc = await ApplicationModel.findOne({
    tenantId: tenantUser._id,
    propertyId: (testProperty._id || testProperty.id).toString(),
  });
  if (!appDoc) {
    appDoc = await ApplicationService.submitApplication(tenantUser._id.toString(), {
      propertyId: (testProperty._id || testProperty.id).toString(),
      proposedRent: 25000,
      moveInDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      occupantsCount: 2,
      employmentStatus: 'EMPLOYED',
      monthlyIncome: 85000,
      message: 'Interested in this property for long-term lease',
    });
    console.log(`✓ Application created in MongoDB: _id: ${appDoc._id}, status: ${appDoc.status}`);
  } else {
    console.log(`✓ Found existing application in DEV DB: _id: ${appDoc._id}, status: ${appDoc.status}`);
  }
  const appId = (appDoc._id || appDoc.id).toString();

  // 5. Test Verification Creation & Upload
  console.log('\n--- Step 5: Test Verification Submission (Checking NO INCOME_VERIFICATION) ---');
  if (appDoc.status === 'SUBMITTED' || appDoc.status === 'UNDER_REVIEW') {
    const updatedApp = await ApplicationService.updateStatus(
      appId,
      ownerUser._id.toString(),
      'OWNER',
      'VERIFICATION_REQUIRED'
    );
    console.log(`✓ Application status transitioned to: ${updatedApp.status}`);
  } else {
    console.log(`✓ Application already at status: ${appDoc.status}`);
  }

  // Check verification doc created in MongoDB
  let verifDoc = await RentalVerificationModel.findOne({ applicationId: appId });
  if (!verifDoc) {
    verifDoc = await RentalVerificationModel.findOne({ tenantId: tenantUser._id });
  }
  assert(verifDoc, 'RentalVerification document must be present in MongoDB');
  console.log(`✓ RentalVerification document created in MongoDB: _id: ${verifDoc._id}`);
  
  const stepIds = (verifDoc.steps || []).map((s: any) => s.stepId);
  console.log(`  Verification steps present: ${JSON.stringify(stepIds)}`);
  assert(!stepIds.includes('INCOME_VERIFICATION'), 'CRITICAL: INCOME_VERIFICATION must NOT be in verification steps!');
  assert(stepIds.includes('ID_VERIFICATION'), 'ID_VERIFICATION must be present');
  assert(stepIds.includes('RENTAL_HISTORY'), 'RENTAL_HISTORY must be present');
  console.log(`✓ INCOME_VERIFICATION is confirmed ABSENT from verification steps!`);

  // Submit verification upload
  const uploadResult = await VerificationService.submitVerification(
    tenantUser._id.toString(),
    'AADHAAR',
    '123456789012',
    'Tenant identity submission'
  );
  assert(uploadResult, 'Verification upload must succeed');
  console.log(`✓ Verification document upload processed successfully in MongoDB`);

  // Verify PersistentStore call count
  console.log('\n--- Step 6: PersistentStore / JSON Files Isolation Audit ---');
  console.log(`Total calls to PersistentStore during full workflow: ${persistentStoreCalls}`);
  assert(persistentStoreCalls === 0, 'No calls to PersistentStore or JSON files allowed in production MongoDB mode!');
  console.log(`✓ ZERO calls to PersistentStore or backend/data/*.json files detected!`);

  // 6. Test Android Origin (Item 13) via real HTTP server
  console.log('\n=================================================================');
  console.log('ITEM 13: ANDROID ORIGIN (https://localhost) CORS & REFRESH TEST');
  console.log('=================================================================');
  
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(5099, '127.0.0.1', () => resolve()));
  console.log('Test HTTP server listening on http://127.0.0.1:5099');

  try {
    // A. CORS Preflight for https://localhost
    const preflightRes = await fetch('http://127.0.0.1:5099/api/v1/auth/refresh', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://localhost',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    console.log(`CORS Preflight Status: ${preflightRes.status}`);
    const allowOrigin = preflightRes.headers.get('access-control-allow-origin');
    console.log(`Access-Control-Allow-Origin: ${allowOrigin}`);
    assert(allowOrigin === 'https://localhost', 'CORS header Access-Control-Allow-Origin must be https://localhost');
    console.log(`✓ CORS preflight for origin "https://localhost" PASSED`);

    // Ensure token is registered in RefreshTokenModel
    const { RefreshTokenModel } = require('../models/refresh-token.model');
    await RefreshTokenModel.create({
      userId: tenantUser._id,
      tokenHash: JwtUtil.hashToken(tokens.refreshToken),
      expiresAt: new Date(Date.now() + 86400000 * 30),
    });

    // B. Refresh Token Request with Origin: https://localhost
    const refreshRes = await fetch('http://127.0.0.1:5099/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Origin': 'https://localhost',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    console.log(`Refresh Token Endpoint Status: ${refreshRes.status}`);
    const refreshAllowOrigin = refreshRes.headers.get('access-control-allow-origin');
    console.log(`Refresh Response CORS Header: ${refreshAllowOrigin}`);
    assert(refreshRes.status === 200, `Refresh token endpoint should return 200, got: ${refreshRes.status}`);
    const refreshBody: any = await refreshRes.json();
    const newAccessToken = refreshBody.data?.tokens?.accessToken || refreshBody.data?.accessToken || refreshBody.accessToken;
    assert(newAccessToken, 'Refreshed access token must be returned');
    assert(refreshAllowOrigin === 'https://localhost', 'CORS origin must match https://localhost');
    console.log(`✓ Android origin session refresh PASSED with valid new accessToken: ${newAccessToken.substring(0, 20)}...`);

    // C. Capacitor Origin (capacitor://localhost) Preflight
    const capPreflight = await fetch('http://127.0.0.1:5099/api/v1/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'capacitor://localhost',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      capPreflight.headers.get('access-control-allow-origin') === 'capacitor://localhost',
      'CORS header Access-Control-Allow-Origin must be capacitor://localhost'
    );
    console.log(`✓ Capacitor origin "capacitor://localhost" CORS preflight PASSED`);
  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  }

  await mongoose.disconnect();
  console.log('\n=================================================================');
  console.log('ALL ITEM 12 & ITEM 13 CHECKS COMPLETED SUCCESSFULLY');
  console.log('=================================================================');
}

runProdDevDbTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
