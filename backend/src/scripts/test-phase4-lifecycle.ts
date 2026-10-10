import app from '../app';
import { connectDatabase } from '../config/database';
import mongoose from 'mongoose';
import { UserModel, PropertyModel, ApplicationModel, RentalModel, RentalAgreementModel, NotificationModel } from '../models';

const PORT = 5098;

async function runPhase4Tests() {
  console.log('===========================================================');
  console.log(' Grih360 Phase 4 — Real Application Lifecycle Verification');
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

  // 1. Connect to Database
  await connectDatabase();

  // 2. Start Test HTTP Server
  const server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api/v1`;

  try {
    const timestamp = Date.now();

    // STEP 1: Register and login an OWNER
    const ownerEmail = `phase4-owner-${timestamp}@grih360.com`;
    const resOwnerReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase4 Real Owner',
        email: ownerEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'OWNER',
      }),
    });
    const dataOwnerReg = await resOwnerReg.json();
    assert(resOwnerReg.status === 201, 'Owner registered successfully');
    const ownerToken = dataOwnerReg.data?.tokens?.accessToken;
    const ownerId = dataOwnerReg.data.user.id || dataOwnerReg.data.user._id;

    // STEP 2: Owner creates a property listing
    const resProp = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 4 Luxury Villa',
        description: 'Prime residential villa for real application testing',
        rentAmount: 35000,
        depositAmount: 70000,
        bhk: '3BHK',
        propertyType: 'INDEPENDENT_HOUSE',
        furnishing: 'FULLY_FURNISHED',
        preferredTenants: 'ANY',
        propertyLocation: {
          address: 'Road No 12, Banjara Hills',
          locality: 'Banjara Hills',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500034',
          coordinates: { latitude: 17.4156, longitude: 78.435 },
        },
      }),
    });
    const dataProp = await resProp.json();
    assert(resProp.status === 201, 'Owner created property listing');
    const propertyId = dataProp.data.id || dataProp.data._id;

    // STEP 3: Register and login TENANT 1
    const tenantEmail = `phase4-tenant1-${timestamp}@grih360.com`;
    const resTenantReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase4 Applicant One',
        email: tenantEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenantReg = await resTenantReg.json();
    assert(resTenantReg.status === 201, 'Tenant 1 registered successfully');
    const tenantToken = dataTenantReg.data?.tokens?.accessToken;
    const tenantId = dataTenantReg.data.user.id || dataTenantReg.data.user._id;

    // STEP 4: Tenant submits Application with full applicationData
    const moveInDate = new Date();
    moveInDate.setDate(moveInDate.getDate() + 14);

    const resSubmitApp = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId,
        proposedRent: 34000,
        moveInDate: moveInDate.toISOString(),
        message: 'Looking forward to moving in soon with family.',
        employmentStatus: 'Salaried (IT Professional)',
        monthlyIncome: 120000,
        occupantsCount: 3,
        notes: 'Quiet family, no pets.',
      }),
    });
    const dataSubmitApp = await resSubmitApp.json();
    assert(resSubmitApp.status === 201, 'Tenant submitted rental application successfully');
    const application = dataSubmitApp.data;
    const applicationId = application.id || application._id;

    // STEP 5: Verify Application Document Fields
    assert(application.status === 'SUBMITTED', 'Application initial status is SUBMITTED', `status=${application.status}`);
    assert(!!application.submittedAt, 'Application contains submittedAt timestamp');
    const appData = application.applicationData;
    assert(!!appData, 'Application contains applicationData');
    assert(appData.employmentStatus === 'Salaried (IT Professional)', 'applicationData preserves employmentStatus');
    assert(appData.monthlyIncome === 120000, 'applicationData preserves monthlyIncome');
    assert(appData.occupantsCount === 3, 'applicationData preserves occupantsCount');

    // STEP 6: Duplicate Application Check (Tenant cannot apply twice for same active listing)
    const resDup = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId,
        proposedRent: 34000,
        moveInDate: moveInDate.toISOString(),
      }),
    });
    assert(resDup.status === 409, 'Duplicate active application is rejected with 409 Conflict');

    // STEP 7: Tenant Applications list (GET /api/v1/applications)
    const resTenantApps = await fetch(`${baseUrl}/applications`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataTenantApps = await resTenantApps.json();
    assert(resTenantApps.status === 200, 'Tenant can list own applications');
    const tenantFoundApp = dataTenantApps.data.find((a: any) => (a.id || a._id) === applicationId);
    assert(!!tenantFoundApp, 'Submitted application appears immediately in Tenant Applications');
    assert(tenantFoundApp.propertyId.title === 'Phase 4 Luxury Villa', 'Application populates property details');

    // STEP 8: Owner Dashboard calculations (Real DB queries)
    const resOwnerDash = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataOwnerDash = await resOwnerDash.json();
    assert(resOwnerDash.status === 200, 'Owner dashboard metrics retrieved');
    assert(dataOwnerDash.data.newApplications >= 1, 'Owner dashboard calculates real newApplications count (SUBMITTED)');
    assert(dataOwnerDash.data.pendingApplications >= 1, 'Owner dashboard calculates real pendingApplications count');

    // STEP 9: Owner Applications list (GET /api/v1/applications)
    const resOwnerApps = await fetch(`${baseUrl}/applications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataOwnerApps = await resOwnerApps.json();
    assert(resOwnerApps.status === 200, 'Owner can list applications for their properties');
    const ownerFoundApp = dataOwnerApps.data.find((a: any) => (a.id || a._id) === applicationId);
    assert(!!ownerFoundApp, 'Application appears in Owner Applications list');
    assert(ownerFoundApp.tenantId.name === 'Phase4 Applicant One', 'Owner view populates applicant name');

    // STEP 10: IDOR Protection (Unrelated Tenant 2 cannot access this application)
    const resTenant2Reg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase4 Unrelated Tenant',
        email: `phase4-unrelated-${timestamp}@grih360.com`,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenant2Reg = await resTenant2Reg.json();
    const tenant2Token = dataTenant2Reg.data?.tokens?.accessToken;

    const resIdorGet = await fetch(`${baseUrl}/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${tenant2Token}` },
    });
    assert(resIdorGet.status === 403, 'IDOR Protection: Unrelated tenant receives 403 FORBIDDEN on GET application');

    const resIdorPatch = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenant2Token}`,
      },
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    });
    assert(resIdorPatch.status === 403, 'IDOR Protection: Unrelated tenant cannot withdraw another tenant application');

    // STEP 11: Owner transitions status: SUBMITTED -> UNDER_REVIEW
    const resReview = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'UNDER_REVIEW' }),
    });
    const dataReview = await resReview.json();
    assert(resReview.status === 200, 'Owner transitions status to UNDER_REVIEW');
    assert(dataReview.data.status === 'UNDER_REVIEW', 'Application state is now UNDER_REVIEW');

    // STEP 12: Owner transitions status: UNDER_REVIEW -> VERIFICATION_REQUIRED
    const resVerReq = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'VERIFICATION_REQUIRED' }),
    });
    const dataVerReq = await resVerReq.json();
    assert(resVerReq.status === 200, 'Owner transitions status to VERIFICATION_REQUIRED');
    assert(dataVerReq.data.status === 'VERIFICATION_REQUIRED', 'Application state is now VERIFICATION_REQUIRED');

    // STEP 13: Owner transitions status: VERIFICATION_REQUIRED -> APPROVED
    const resApprove = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const dataApprove = await resApprove.json();
    assert(resApprove.status === 200, 'Owner transitions status to APPROVED');
    assert(dataApprove.data.status === 'APPROVED', 'Application state is now APPROVED');

    // STEP 14: Verify Rental & Agreement Creation upon APPROVED
    const resRentals = await fetch(`${baseUrl}/rentals`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataRentals = await resRentals.json();
    assert(resRentals.status === 200, 'Tenant rentals queried');
    assert(Array.isArray(dataRentals.data) && dataRentals.data.length >= 1, 'Rental document auto-created upon APPROVED');

    const resAgreements = await fetch(`${baseUrl}/agreements`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataAgreements = await resAgreements.json();
    assert(resAgreements.status === 200, 'Tenant agreements queried');
    assert(Array.isArray(dataAgreements.data) && dataAgreements.data.length >= 1, 'Lease Agreement auto-created upon APPROVED');

    // STEP 15: Invalid State Transition (APPROVED is terminal state, cannot move back to SUBMITTED)
    const resInvalidTrans = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'SUBMITTED' }),
    });
    assert(resInvalidTrans.status === 400, 'Server rejects transition from terminal APPROVED status with 400');

    // STEP 16: Test Withdrawal Lifecycle on a new application
    // Create 2nd property & application
    const resProp2 = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 4 Second Property',
        description: 'Testing withdrawal flow',
        rentAmount: 20000,
        depositAmount: 40000,
        bhk: '2BHK',
        propertyType: 'APARTMENT',
        furnishing: 'SEMI_FURNISHED',
        preferredTenants: 'ANY',
        propertyLocation: {
          address: 'Madhapur',
          locality: 'Madhapur',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { latitude: 17.4483, longitude: 78.3915 },
        },
      }),
    });
    const dataProp2 = await resProp2.json();
    const prop2Id = dataProp2.data.id || dataProp2.data._id;

    const resApp2 = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: prop2Id,
        proposedRent: 19500,
        moveInDate: moveInDate.toISOString(),
        employmentStatus: 'Salaried',
        monthlyIncome: 80000,
        occupantsCount: 2,
      }),
    });
    const dataApp2 = await resApp2.json();
    const app2Id = dataApp2.data.id || dataApp2.data._id;

    // Tenant withdraws application 2
    const resWithdraw = await fetch(`${baseUrl}/applications/${app2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    });
    const dataWithdraw = await resWithdraw.json();
    assert(resWithdraw.status === 200, 'Tenant successfully withdraws own application');
    assert(dataWithdraw.data.status === 'WITHDRAWN', 'Application status is updated to WITHDRAWN');

    // Owner cannot transition a WITHDRAWN application (terminal state)
    const resPostWithdraw = await fetch(`${baseUrl}/applications/${app2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(resPostWithdraw.status === 400, 'Server rejects transition from terminal WITHDRAWN status with 400');

    // STEP 17: Notification delivery verification
    const resTenantNotifs = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataTenantNotifs = await resTenantNotifs.json();
    assert(resTenantNotifs.status === 200, 'Tenant notifications queried');
    assert(Array.isArray(dataTenantNotifs.data) && dataTenantNotifs.data.length >= 2, 'Tenant received notifications across transitions');

    const resOwnerNotifs = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataOwnerNotifs = await resOwnerNotifs.json();
    assert(resOwnerNotifs.status === 200, 'Owner notifications queried');
    assert(Array.isArray(dataOwnerNotifs.data) && dataOwnerNotifs.data.length >= 2, 'Owner received notifications across transitions');

    console.log('===========================================================');
    console.log(` Phase 4 Lifecycle Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  } finally {
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

runPhase4Tests();
