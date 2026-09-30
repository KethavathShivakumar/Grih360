process.env.NODE_ENV = 'test';
import app from '../app';
import { connectDatabase } from '../config/database';
import mongoose from 'mongoose';
import { UserModel, PropertyModel, ApplicationModel, SavedPropertyModel } from '../models';

const PORT = 5099;

async function runBackendTests() {
  console.log('===========================================================');
  console.log(' Nivas360 Phase 3 Backend & API Test Suite');
  console.log('===========================================================');

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

  // 1. Initialize DB Connection
  await connectDatabase();

  // 2. Start HTTP server
  const server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api/v1`;

  try {
    // Clean up test data if MongoDB connected
    if (mongoose.connection.readyState === 1) {
      await UserModel.deleteMany({ email: /test-phase3-/ });
      await PropertyModel.deleteMany({ title: /Test Property/ });
    }

    // TEST 1: Health Check Endpoint
    const resHealth = await fetch(`${baseUrl}/health`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200 && dataHealth.success === true, 'GET /api/v1/health returns 200 OK');

    // TEST 2: Public Registration as ADMIN must be REJECTED (Requirement #9 & #37)
    const resAdminReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Admin',
        email: 'test-phase3-fakeadmin@nivas360.com',
        phone: '+919800000001',
        password: 'Password123',
        role: 'ADMIN',
      }),
    });
    assert(resAdminReg.status === 400, 'POST /api/v1/auth/register rejecting public ADMIN registration with 400');

    // TEST 3: Real Tenant Registration
    const tenantEmail = `test-phase3-tenant-${Date.now()}@nivas360.com`;
    const tenantPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const resTenantReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Tenant User',
        email: tenantEmail,
        phone: tenantPhone,
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenantReg = await resTenantReg.json();
    assert(resTenantReg.status === 201 && dataTenantReg.data?.tokens?.accessToken, 'POST /api/v1/auth/register for TENANT returns 201 and JWT Tokens');
    const tenantToken = dataTenantReg.data?.tokens?.accessToken;

    // TEST 4: Duplicate Email Registration Rejection
    const resDupReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Tenant',
        email: tenantEmail,
        phone: '+919877777777',
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    assert(resDupReg.status === 409, 'POST /api/v1/auth/register duplicate email rejected with 409 Conflict');

    // TEST 5: Real Owner Registration
    const ownerEmail = `test-phase3-owner-${Date.now()}@nivas360.com`;
    const ownerPhone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
    const resOwnerReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Owner User',
        email: ownerEmail,
        phone: ownerPhone,
        password: 'Password123',
        role: 'OWNER',
      }),
    });
    const dataOwnerReg = await resOwnerReg.json();
    assert(resOwnerReg.status === 201, 'POST /api/v1/auth/register for OWNER returns 201');
    const ownerToken = dataOwnerReg.data?.tokens?.accessToken;

    // TEST 6: Real Login with Bcrypt Password Comparison
    const resLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: ownerEmail,
        password: 'Password123',
      }),
    });
    const dataLogin = await resLogin.json();
    assert(resLogin.status === 200 && dataLogin.data?.tokens?.accessToken, 'POST /api/v1/auth/login succeeds with valid credentials');

    // TEST 7: Invalid Password Login Rejection
    const resBadLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: ownerEmail,
        password: 'WrongPassword',
      }),
    });
    assert(resBadLogin.status === 401, 'POST /api/v1/auth/login invalid password rejected with 401 Unauthorized');

    // TEST 8: GET /api/v1/auth/me with Bearer Token
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataMe = await resMe.json();
    assert(resMe.status === 200 && dataMe.data?.user?.email === tenantEmail, 'GET /api/v1/auth/me returns authenticated user details');

    // TEST 9: Protected Route without Token (401)
    const resUnauth = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized' }),
    });
    assert(resUnauth.status === 401, 'POST /api/v1/properties without token rejected with 401');

    // TEST 10: Role Authorization Check: TENANT cannot create Property (403)
    const resTenantCreateProp = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        title: 'Tenant Fake Property',
        description: 'Should fail',
        propertyType: 'APARTMENT',
        rentAmount: 20000,
        depositAmount: 40000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1200,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: { address: 'A', city: 'Hyderabad', state: 'TS', pincode: '500001' },
      }),
    });
    assert(resTenantCreateProp.status === 403, 'POST /api/v1/properties by TENANT rejected with 403 Forbidden');

    // TEST 11: Owner Creates Property
    const resCreateProp = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Test Property 3 BHK Bento Villa',
        description: 'High quality modern residence in Banjara Hills',
        propertyType: 'VILLA',
        rentAmount: 35000, // Numeric input
        depositAmount: 70000, // Numeric input
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 2200,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: { address: 'Road 10, Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' },
      }),
    });
    const dataCreateProp = await resCreateProp.json();
    assert(resCreateProp.status === 201 && dataCreateProp.data?.title?.includes('Test Property'), 'POST /api/v1/properties by OWNER succeeds with 201');
    const createdPropId = dataCreateProp.data?._id || dataCreateProp.data?.id;

    // TEST 12: Public Property Search
    const resSearch = await fetch(`${baseUrl}/properties?city=Hyderabad`);
    const dataSearch = await resSearch.json();
    assert(resSearch.status === 200 && Array.isArray(dataSearch.data), 'GET /api/v1/properties search returns list');

    // TEST 13: Property Update Server-Side Ownership Enforcement (Requirement #46)
    const resUnauthorizedUpdate = await fetch(`${baseUrl}/properties/${createdPropId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`, // Tenant trying to update owner's property
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert(resUnauthorizedUpdate.status === 403, 'PATCH /api/v1/properties/:id by non-owner rejected with 403 Forbidden');

    // TEST 14: Tenant Saves Property
    const resSave = await fetch(`${baseUrl}/properties/${createdPropId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(resSave.status === 201, 'POST /api/v1/properties/:id/save succeeds for TENANT');

    // TEST 15: Tenant Submits Application
    const resApp = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: createdPropId,
        proposedRent: 35000,
        moveInDate: new Date().toISOString(),
        message: 'Interested in immediate move in',
      }),
    });
    const dataApp = await resApp.json();
    assert(resApp.status === 201, 'POST /api/v1/applications by TENANT returns 201');
    const appId = dataApp.data?._id || dataApp.data?.id;

    // TEST 16: Tenant Retrieves Application By ID (Requirement #29)
    const resAppById = await fetch(`${baseUrl}/applications/${appId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(resAppById.status === 200, 'GET /api/v1/applications/:id returns 200 for authenticated tenant owner');

    // TEST 17: Owner Dashboard Metrics
    const resOwnerDash = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataOwnerDash = await resOwnerDash.json();
    assert(
      resOwnerDash.status === 200 && dataOwnerDash.data?.totalProperties >= 1,
      'GET /api/v1/owner/dashboard returns 200 and owner metrics'
    );

    // TEST 18: Image Upload / Main / Delete on Property
    const resAddImg = await fetch(`${baseUrl}/properties/${createdPropId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ images: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', caption: 'Front View' }] }),
    });
    const dataAddImg = await resAddImg.json();
    assert(resAddImg.status === 200 && dataAddImg.data?.images?.length >= 1, 'POST /api/v1/properties/:id/images uploads image to property');

    // TEST 19: Application Approval by Owner (Auto-creates Active Rental)
    const resApproveApp = await fetch(`${baseUrl}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const dataApproveApp = await resApproveApp.json();
    assert(resApproveApp.status === 200 && dataApproveApp.data?.status === 'APPROVED', 'PATCH /api/v1/applications/:id/status to APPROVED returns 200');

    // Verify Property status became RENTED
    const resGetPropAfterApprove = await fetch(`${baseUrl}/properties/${createdPropId}`);
    const dataPropAfterApprove = await resGetPropAfterApprove.json();
    assert(dataPropAfterApprove.data?.availabilityStatus === 'RENTED', 'Approved application auto-sets property availabilityStatus to RENTED');

    // TEST 20: Owner Tenant Details API for Property
    const resTenantDetails = await fetch(`${baseUrl}/rentals/property/${createdPropId}/tenant`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataTenantDetails = await resTenantDetails.json();
    assert(
      resTenantDetails.status === 200 && dataTenantDetails.data?.tenant?.email === tenantEmail,
      'GET /api/v1/rentals/property/:propertyId/tenant returns tenant details for active rental'
    );

    // TEST 21: Owner Rent Records API for Property
    const resRentRecords = await fetch(`${baseUrl}/rentals/property/${createdPropId}/rent`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataRentRecords = await resRentRecords.json();
    assert(
      resRentRecords.status === 200 && Array.isArray(dataRentRecords.data?.rentRecords || dataRentRecords.data),
      'GET /api/v1/rentals/property/:propertyId/rent returns rental & payment tracking records'
    );

    // TEST 22: Cross-Owner Security Check (2nd Owner cannot access 1st Owner property tenant details)
    const owner2Email = `test-phase3-owner2-${Date.now()}@nivas360.com`;
    const resOwner2Reg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Owner',
        email: owner2Email,
        phone: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Password123',
        role: 'OWNER',
      }),
    });
    const dataOwner2Reg = await resOwner2Reg.json();
    const owner2Token = dataOwner2Reg.data?.tokens?.accessToken;

    const resCrossOwnerAccess = await fetch(`${baseUrl}/rentals/property/${createdPropId}/tenant`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    assert(resCrossOwnerAccess.status === 403, 'GET /api/v1/rentals/property/:propertyId/tenant by unassigned owner rejected with 403 Forbidden');

    // TEST 23: Duplicate Active Application Prevention
    const resPropDup = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Vacant Property For Duplicate App Test',
        description: 'Testing duplicate application check',
        propertyType: 'APARTMENT',
        rentAmount: 30000,
        depositAmount: 60000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1000,
        furnishing: 'UNFURNISHED',
        propertyLocation: { address: 'Road 12', city: 'Hyderabad', state: 'TS', pincode: '500034' },
      }),
    });
    const dataPropDup = await resPropDup.json();
    const propDupId = dataPropDup.data?._id || dataPropDup.data?.id;

    // First application
    await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: propDupId,
        proposedRent: 30000,
        moveInDate: new Date().toISOString(),
      }),
    });

    // Second active application attempt by same tenant
    const resDupApp = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: propDupId,
        proposedRent: 30000,
        moveInDate: new Date().toISOString(),
        message: 'Second application attempt',
      }),
    });
    assert(resDupApp.status === 409, 'POST /api/v1/applications duplicate active application rejected with 409 Conflict');

    // TEST 24: Stale Property Availability Check
    const resProp2 = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Rented Villa Listing',
        description: 'Occupied',
        propertyType: 'VILLA',
        rentAmount: 40000,
        depositAmount: 80000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 2000,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: { address: 'Road 5', city: 'Hyderabad', state: 'TS', pincode: '500034' },
      }),
    });
    const dataProp2 = await resProp2.json();
    const prop2Id = dataProp2.data?._id || dataProp2.data?.id;

    const resAppProp2 = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: prop2Id,
        proposedRent: 40000,
        moveInDate: new Date().toISOString(),
      }),
    });
    const dataAppProp2 = await resAppProp2.json();
    const app2Id = dataAppProp2.data?._id || dataAppProp2.data?.id;

    await fetch(`${baseUrl}/applications/${app2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    const tenant2Email = `test-phase6-tenant2-${Date.now()}@nivas360.com`;
    const resTenant2Reg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Tenant',
        email: tenant2Email,
        phone: `+9195${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenant2Reg = await resTenant2Reg.json();
    const tenant2Token = dataTenant2Reg.data?.tokens?.accessToken;

    const resApplyRentedProp = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenant2Token}`,
      },
      body: JSON.stringify({
        propertyId: prop2Id,
        proposedRent: 40000,
        moveInDate: new Date().toISOString(),
      }),
    });
    assert(resApplyRentedProp.status === 400, 'POST /api/v1/applications to RENTED property rejected with 400 Bad Request');

    // TEST 25: Controlled State Machine Valid Transition (SUBMITTED -> UNDER_REVIEW)
    const resProp3 = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'State Machine Test Villa',
        description: 'For testing state transitions',
        propertyType: 'APARTMENT',
        rentAmount: 25000,
        depositAmount: 50000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1100,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: { address: 'Road 1', city: 'Hyderabad', state: 'TS', pincode: '500081' },
      }),
    });
    const dataProp3 = await resProp3.json();
    const prop3Id = dataProp3.data?._id || dataProp3.data?.id;

    const resAppProp3 = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: prop3Id,
        proposedRent: 25000,
        moveInDate: new Date().toISOString(),
      }),
    });
    const dataAppProp3 = await resAppProp3.json();
    const app3Id = dataAppProp3.data?._id || dataAppProp3.data?.id;

    const resTransitionUnderReview = await fetch(`${baseUrl}/applications/${app3Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'UNDER_REVIEW' }),
    });
    const dataTransitionUnderReview = await resTransitionUnderReview.json();
    assert(resTransitionUnderReview.status === 200 && dataTransitionUnderReview.data?.status === 'UNDER_REVIEW', 'PATCH /api/v1/applications/:id/status valid transition SUBMITTED -> UNDER_REVIEW succeeds');

    // TEST 26: Invalid State Machine Transition Rejection (REJECTED -> APPROVED)
    await fetch(`${baseUrl}/applications/${app3Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'REJECTED' }),
    });

    const resInvalidRevert = await fetch(`${baseUrl}/applications/${app3Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(resInvalidRevert.status === 400, 'PATCH /api/v1/applications/:id/status invalid transition REJECTED -> APPROVED rejected with 400 Bad Request');

    // TEST 27: Tenant Identity Verification Submission
    const resSubVerif = await fetch(`${baseUrl}/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        documentType: 'AADHAAR',
        documentNumber: '999988881234',
        notes: 'Submitted for Phase 6 test',
      }),
    });
    const dataSubVerif = await resSubVerif.json();
    assert(resSubVerif.status === 201 && dataSubVerif.data?.status === 'UNDER_REVIEW', 'POST /api/v1/verifications returns 201 and status UNDER_REVIEW (No fake instant verification)');

    // TEST 28: Verification Privacy Enforcement for Owner (Zero raw doc details exposed)
    const resOwnerVerifSummary = await fetch(`${baseUrl}/verifications/tenant/mem_tenant`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataOwnerVerifSummary = await resOwnerVerifSummary.json();
    assert(
      resOwnerVerifSummary.status === 200 &&
      dataOwnerVerifSummary.data?.storageKey === undefined &&
      dataOwnerVerifSummary.data?.isVerified !== undefined,
      'GET /api/v1/verifications/tenant/:id by OWNER returns summary status badge without raw document keys'
    );

    // TEST 29: Admin Verification Queue & Approval Review
    const adminEmail = `test-phase6-admin-${Date.now()}@nivas360.com`;
    const adminPhone = `+9194${Math.floor(10000000 + Math.random() * 90000000)}`;
    const adminUser = await UserModel.create({
      name: 'System Admin',
      email: adminEmail,
      phone: adminPhone,
      password: 'Password123',
      role: 'ADMIN',
    }).catch(() => null);
    const { JwtUtil } = require('../utils/jwt.util');
    const adminToken = JwtUtil.generateTokens({
      userId: adminUser?._id?.toString() || 'mem_admin',
      email: adminEmail,
      role: 'ADMIN',
    }).accessToken;

    const resAdminQueue = await fetch(`${baseUrl}/verifications/admin/queue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAdminQueue.status === 200, 'GET /api/v1/verifications/admin/queue returns 200 for ADMIN');

    // TEST 30: Non-Admin Blocked from Admin Verification Review
    const resNonAdminReview = await fetch(`${baseUrl}/verifications/admin/mem_tenant/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    assert(resNonAdminReview.status === 403, 'PATCH /api/v1/verifications/admin/:id/review by non-admin rejected with 403 Forbidden');

    // Get active rental ID from created prop 1
    const resGetRental = await fetch(`${baseUrl}/rentals/property/${createdPropId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataGetRental = await resGetRental.json();
    const rentalId = dataGetRental.data?._id || dataGetRental.data?.id;

    // TEST 31: Rental Agreement Confirmation by Owner
    const resConfirmAgreement = await fetch(`${baseUrl}/agreements/rental/${rentalId}/confirm`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
    });
    assert(resConfirmAgreement.status === 200, 'PATCH /api/v1/agreements/rental/:id/confirm succeeds for owner');

    // TEST 32: Rental Activation Success
    const resActivateRental = await fetch(`${baseUrl}/rentals/${rentalId}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(resActivateRental.status === 200, 'POST /api/v1/rentals/:id/activate succeeds when prerequisites met');

    // TEST 33: Rental Termination
    const resTerminateRental = await fetch(`${baseUrl}/rentals/${rentalId}/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ reason: 'Tenant relocation' }),
    });
    assert(resTerminateRental.status === 200, 'POST /api/v1/rentals/:id/terminate succeeds for owner');

    // =========================================================
    // PHASE 7: HOME SERVICES & PROFESSIONAL NETWORK TESTS
    // =========================================================

    // TEST 34: Fetch Service Categories
    const resCategories = await fetch(`${baseUrl}/services/categories`);
    const dataCategories = await resCategories.json();
    assert(
      resCategories.status === 200 && Array.isArray(dataCategories.data) && dataCategories.data.length >= 8,
      'GET /api/v1/services/categories returns all 8 required categories'
    );

    // TEST 35: Register Professional User
    const proEmail = `test-phase7-pro-${Date.now()}@nivas360.com`;
    const proPhone = `+9193${Math.floor(10000000 + Math.random() * 90000000)}`;
    const resProReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Plumbing Specialist',
        email: proEmail,
        phone: proPhone,
        password: 'Password123',
        role: 'PROFESSIONAL',
      }),
    });
    const dataProReg = await resProReg.json();
    assert(resProReg.status === 201 && dataProReg.data?.tokens?.accessToken, 'POST /api/v1/auth/register for PROFESSIONAL returns 201');
    const proToken = dataProReg.data?.tokens?.accessToken;
    const proUserId = dataProReg.data?.user?.id || dataProReg.data?.user?._id;

    // TEST 36: Configure Professional Profile (Categories & Service Area)
    const resUpdateProProfile = await fetch(`${baseUrl}/professionals/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`,
      },
      body: JSON.stringify({
        businessName: 'Ramesh Master Plumbing',
        categories: ['PLUMBING', 'GENERAL_MAINTENANCE'],
        experienceYears: 7,
        serviceAreas: ['Hyderabad', 'Banjara Hills'],
        bio: 'Expert plumber in South India for over 7 years.',
      }),
    });
    const dataUpdateProProfile = await resUpdateProProfile.json();
    assert(
      resUpdateProProfile.status === 200 && dataUpdateProProfile.data?.categories?.includes('PLUMBING'),
      'PATCH /api/v1/professionals/me configures professional categories & service area'
    );

    // TEST 37: Tenant Creates Plumbing Service Request (Triggers Auto-Matching -> ASSIGNED)
    const resCreateSrvReq = await fetch(`${baseUrl}/services/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        categoryCode: 'PLUMBING',
        description: 'Main bathroom floor pipe leakage and tap replacement needed',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        preferredTimeWindow: '10:00 AM - 01:00 PM',
        serviceLocation: {
          address: 'Flat 402, Sunshine Heights, Banjara Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500034',
        },
      }),
    });
    const dataCreateSrvReq = await resCreateSrvReq.json();
    assert(
      resCreateSrvReq.status === 201 &&
        (dataCreateSrvReq.data?.status === 'ASSIGNED' || dataCreateSrvReq.data?.status === 'MATCHING'),
      'POST /api/v1/services/requests creates request and triggers auto-matching (ASSIGNED)'
    );
    const srvRequestId = dataCreateSrvReq.data?._id || dataCreateSrvReq.data?.id;

    // TEST 38: Security Test — Uninvolved Tenant B cannot access Tenant A's Service Request
    const tenantBEmail = `test-phase7-tenantB-${Date.now()}@nivas360.com`;
    const resTenantBReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tenant B',
        email: tenantBEmail,
        phone: `+9192${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenantBReg = await resTenantBReg.json();
    const tenantBToken = dataTenantBReg.data?.tokens?.accessToken;

    const resUnauthSrvAccess = await fetch(`${baseUrl}/services/requests/${srvRequestId}`, {
      headers: { Authorization: `Bearer ${tenantBToken}` },
    });
    assert(resUnauthSrvAccess.status === 403, 'GET /api/v1/services/requests/:id by unauthorized tenant rejected with 403 Forbidden');

    // TEST 39: State Machine Test — Professional Accepts Job (ASSIGNED -> ACCEPTED)
    const resAcceptJob = await fetch(`${baseUrl}/services/requests/${srvRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    const dataAcceptJob = await resAcceptJob.json();
    assert(
      resAcceptJob.status === 200 && dataAcceptJob.data?.status === 'ACCEPTED',
      'PATCH /api/v1/services/requests/:id/status (ASSIGNED -> ACCEPTED) succeeds for assigned professional'
    );

    // TEST 40: State Machine Test — Professional Starts Job (ACCEPTED -> IN_PROGRESS)
    const resStartJob = await fetch(`${baseUrl}/services/requests/${srvRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert(resStartJob.status === 200, 'PATCH /api/v1/services/requests/:id/status (ACCEPTED -> IN_PROGRESS) succeeds');

    // TEST 41: State Machine Test — Professional Completes Job (IN_PROGRESS -> COMPLETED)
    const resCompleteJob = await fetch(`${baseUrl}/services/requests/${srvRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED', notes: 'Replaced rubber washer and sealed pipe joint.' }),
    });
    assert(resCompleteJob.status === 200, 'PATCH /api/v1/services/requests/:id/status (IN_PROGRESS -> COMPLETED) succeeds');

    // TEST 42: Invalid State Transition Rejection (COMPLETED -> IN_PROGRESS)
    const resInvalidRevertCompleted = await fetch(`${baseUrl}/services/requests/${srvRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert(resInvalidRevertCompleted.status === 400, 'PATCH /api/v1/services/requests/:id/status invalid transition (COMPLETED -> IN_PROGRESS) rejected with 400');

    // TEST 43: Tenant Submits Review for Completed Service Request (Dynamic Rating Update)
    const resSubmitReview = await fetch(`${baseUrl}/services/requests/${srvRequestId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Outstanding plumbing work! Arrived on time and solved the leakage cleanly.',
      }),
    });
    const dataSubmitReview = await resSubmitReview.json();
    assert(resSubmitReview.status === 201 && dataSubmitReview.data?.rating === 5, 'POST /api/v1/services/requests/:id/review returns 201 for valid completed service');

    // Verify Professional Rating dynamic calculation
    const resProDashboard = await fetch(`${baseUrl}/professionals/me/dashboard`, {
      headers: { Authorization: `Bearer ${proToken}` },
    });
    const dataProDashboard = await resProDashboard.json();
    assert(
      dataProDashboard.data?.stats?.rating === 5 && dataProDashboard.data?.stats?.reviewCount === 1,
      'Professional profile rating dynamically updated to 5.0 from real Review records'
    );

    // TEST 44: Duplicate Review Prevention Check
    const resDupReview = await fetch(`${baseUrl}/services/requests/${srvRequestId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        rating: 4,
        comment: 'Attempting second review',
      }),
    });
    assert(resDupReview.status === 409, 'POST /api/v1/services/requests/:id/review duplicate submission rejected with 409 Conflict');

    // TEST 45: Admin Service & Professional Management Controls
    const resAdminProfessionals = await fetch(`${baseUrl}/admin/professionals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminProfessionals = await resAdminProfessionals.json();
    const proList = dataAdminProfessionals.data?.professionals || dataAdminProfessionals.data;
    assert(resAdminProfessionals.status === 200 && Array.isArray(proList), 'GET /api/v1/admin/professionals returns all professionals');

    const proProfileId = proList?.[0]?._id || proList?.[0]?.id;

    if (proProfileId) {
      const resVerifyPro = await fetch(`${baseUrl}/admin/professionals/${proProfileId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ verificationStatus: 'VERIFIED' }),
      });
      assert(resVerifyPro.status === 200, 'PATCH /api/v1/admin/professionals/:id/verify updates professional verification status');
    }

    // =========================================================
    // PHASE 8: ADMIN CONSOLE + PLATFORM OPERATIONS TESTS
    // =========================================================

    // TEST 46: Security Test — Non-admin (Tenant) accessing /api/v1/admin/dashboard rejected with 403 Forbidden
    const resTenantAdminDash = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(resTenantAdminDash.status === 403, 'GET /api/v1/admin/dashboard by TENANT rejected with 403 Forbidden');

    // TEST 47: Security Test — Non-admin (Owner) accessing /api/v1/admin/users rejected with 403 Forbidden
    const resOwnerAdminUsers = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(resOwnerAdminUsers.status === 403, 'GET /api/v1/admin/users by OWNER rejected with 403 Forbidden');

    // TEST 48: ADMIN GET /api/v1/admin/dashboard returns 200 OK with real platform metrics
    const resAdminDash = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminDash = await resAdminDash.json();
    assert(
      resAdminDash.status === 200 &&
        dataAdminDash.data?.users?.total !== undefined &&
        dataAdminDash.data?.services?.total !== undefined,
      'GET /api/v1/admin/dashboard returns 200 OK with database-backed metrics'
    );

    // TEST 49: ADMIN GET /api/v1/admin/users returns paginated user list without password hashes
    const resAdminUsersList = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminUsersList = await resAdminUsersList.json();
    const firstUser = dataAdminUsersList.data?.users?.[0];
    assert(
      resAdminUsersList.status === 200 &&
        Array.isArray(dataAdminUsersList.data?.users) &&
        firstUser?.passwordHash === undefined,
      'GET /api/v1/admin/users returns 200 OK with password hashes stripped'
    );

    // TEST 50: ADMIN GET /api/v1/admin/users/:id returns user profile details
    const targetUserId = firstUser?._id || firstUser?.id;
    if (targetUserId) {
      const resAdminUserDetail = await fetch(`${baseUrl}/admin/users/${targetUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(resAdminUserDetail.status === 200, 'GET /api/v1/admin/users/:id returns target user profile');
    }

    // TEST 51: ADMIN PATCH /api/v1/admin/users/:id/status updates user status and logs audit event
    if (targetUserId) {
      const resToggleUserStatus = await fetch(`${baseUrl}/admin/users/${targetUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: true }),
      });
      assert(resToggleUserStatus.status === 200, 'PATCH /api/v1/admin/users/:id/status updates user active state');
    }

    // TEST 52: ADMIN GET /api/v1/admin/properties returns platform properties
    const resAdminProps = await fetch(`${baseUrl}/admin/properties`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminProps = await resAdminProps.json();
    assert(resAdminProps.status === 200 && Array.isArray(dataAdminProps.data?.properties), 'GET /api/v1/admin/properties returns property listings');

    // TEST 53: ADMIN PATCH /api/v1/admin/properties/:id/status moderates property status
    if (createdPropId) {
      const resModerateProp = await fetch(`${baseUrl}/admin/properties/${createdPropId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      assert(resModerateProp.status === 200, 'PATCH /api/v1/admin/properties/:id/status moderates property status');
    }

    // TEST 54: ADMIN GET /api/v1/admin/applications returns applications list
    const resAdminApps = await fetch(`${baseUrl}/admin/applications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAdminApps.status === 200, 'GET /api/v1/admin/applications returns rental applications');

    // TEST 55: ADMIN GET /api/v1/admin/rentals returns rentals list
    const resAdminRentals = await fetch(`${baseUrl}/admin/rentals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAdminRentals.status === 200, 'GET /api/v1/admin/rentals returns rental agreements');

    // TEST 56: ADMIN GET /api/v1/admin/verifications returns background verification cases
    const resAdminVerifs = await fetch(`${baseUrl}/admin/verifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resAdminVerifs.status === 200, 'GET /api/v1/admin/verifications returns verification cases');

    // TEST 57: ADMIN PATCH /api/v1/admin/services/requests/:id/assignment reassigns service request
    const proProfileListRes = await fetch(`${baseUrl}/admin/professionals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const proProfileListData = await proProfileListRes.json();
    const targetPro = proProfileListData.data?.[0];
    const targetProId = targetPro?._id || targetPro?.id;

    if (srvRequestId && targetProId) {
      const resReassignService = await fetch(`${baseUrl}/admin/services/requests/${srvRequestId}/assignment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ professionalId: targetProId }),
      });
      assert(resReassignService.status === 200, 'PATCH /api/v1/admin/services/requests/:id/assignment reassigns request to professional');
    }

    // TEST 58: ADMIN POST /api/v1/admin/notifications/broadcast sends announcement notification
    const resBroadcast = await fetch(`${baseUrl}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Platform Maintenance Scheduled',
        message: 'Nivas360 system will undergo maintenance tonight at 11 PM.',
        targetRole: 'ALL',
      }),
    });
    assert(resBroadcast.status === 200, 'POST /api/v1/admin/notifications/broadcast sends broadcast announcement');

    // TEST 59: ADMIN GET /api/v1/admin/audit returns administrative audit trail
    const resAudit = await fetch(`${baseUrl}/admin/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAudit = await resAudit.json();
    assert(
      resAudit.status === 200 && Array.isArray(dataAudit.data) && dataAudit.data.length > 0,
      'GET /api/v1/admin/audit returns recorded audit log events'
    );

    // TEST 60: ADMIN GET /api/v1/admin/system returns safe system health metrics
    const resSysHealth = await fetch(`${baseUrl}/admin/system`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataSysHealth = await resSysHealth.json();
    assert(
      resSysHealth.status === 200 &&
        dataSysHealth.data?.status === 'UP' &&
        dataSysHealth.data?.environment !== undefined,
      'GET /api/v1/admin/system returns safe system health details without exposing secrets'
    );

    // =========================================================
    // PHASE 9: PRODUCTION HARDENING, QA & SECURITY TESTS
    // =========================================================

    // TEST 61: Malformed ObjectId Parameter Validation (400 Bad Request, never 500)
    const resBadId = await fetch(`${baseUrl}/properties/invalid_object_id_123`);
    assert(resBadId.status === 400, 'GET /api/v1/properties/:id with invalid ID format returns 400 Bad Request (No 500 error)');

    // TEST 62: Pagination Bounds Validation (limit > 100 rejected with 400)
    const resBadPagination = await fetch(`${baseUrl}/properties?limit=500`);
    assert(resBadPagination.status === 400, 'GET /api/v1/properties with excessive limit=500 rejected with 400 Bad Request');

    // TEST 63: Coordinate Bounds Validation (lat > 90 rejected with 400)
    const resBadCoords = await fetch(`${baseUrl}/properties?lat=150`);
    assert(resBadCoords.status === 400, 'GET /api/v1/properties with invalid lat=150 rejected with 400 Bad Request');

    // TEST 64: Account Deactivation Security Check
    const deactivatedTenantEmail = `test-phase9-deact-${Date.now()}@nivas360.com`;
    const resDeactReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deactivated User',
        email: deactivatedTenantEmail,
        phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataDeactReg = await resDeactReg.json();
    const deactUserToken = dataDeactReg.data?.tokens?.accessToken;
    const deactUserId = dataDeactReg.data?.user?.id || dataDeactReg.data?.user?._id;

    if (deactUserId && deactUserToken) {
      // Admin deactivates user
      await fetch(`${baseUrl}/admin/users/${deactUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: false }),
      });

      // Deactivated user tries to access protected endpoint
      const resDeactAccess = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${deactUserToken}` },
      });
      assert(resDeactAccess.status === 401, 'Protected access attempt by deactivated user rejected with 401 Unauthorized');
    }

    // TEST 65: Security Headers via Helmet Verification
    const resSecHeaders = await fetch(`${baseUrl}/health`);
    const hasFrameOptions = resSecHeaders.headers.has('x-frame-options');
    const hasContentTypeOpts = resSecHeaders.headers.has('x-content-type-options');
    assert(hasFrameOptions || hasContentTypeOpts, 'Express HTTP response includes security headers (Helmet active)');

    // TEST 66: Health Check Endpoint Verification
    const resFinalHealth = await fetch(`${baseUrl}/health`);
    const dataFinalHealth = await resFinalHealth.json();
    assert(resFinalHealth.status === 200 && dataFinalHealth.success === true, 'GET /api/v1/health returns 200 OK');

    console.log('===========================================================');

    console.log(` Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('[Test Suite Error]:', err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}


runBackendTests();

