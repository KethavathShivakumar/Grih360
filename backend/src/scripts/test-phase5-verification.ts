import app from '../app';
import { connectDatabase } from '../config/database';
import mongoose from 'mongoose';
import { UserModel, PropertyModel, ApplicationModel, RentalVerificationModel, NotificationModel } from '../models';

const PORT = 5097;

async function runPhase5Tests() {
  console.log('===========================================================');
  console.log(' Nivas360 Phase 5 — Dedicated Verification Workflow Test');
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

    // STEP 1: Register an OWNER
    const ownerEmail = `phase5-owner-${timestamp}@nivas360.com`;
    const resOwnerReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase5 Property Owner',
        email: ownerEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'OWNER',
      }),
    });
    const dataOwnerReg = await resOwnerReg.json();
    assert(resOwnerReg.status === 201, 'Owner registered successfully');
    const ownerToken = dataOwnerReg.data?.tokens?.accessToken;

    // STEP 2: Owner creates a property listing
    const resProp = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 5 Residency',
        description: 'Verification test property',
        rentAmount: 28000,
        depositAmount: 56000,
        bhk: '2BHK',
        propertyType: 'APARTMENT',
        furnishing: 'SEMI_FURNISHED',
        preferredTenants: 'FAMILY',
        propertyLocation: {
          address: 'Hitech City Road',
          locality: 'Hitech City',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { latitude: 17.4435, longitude: 78.3772 },
        },
      }),
    });
    const dataProp = await resProp.json();
    assert(resProp.status === 201, 'Owner listed property');
    const propertyId = dataProp.data.id || dataProp.data._id;

    // STEP 3: Register a TENANT
    const tenantEmail = `phase5-tenant-${timestamp}@nivas360.com`;
    const resTenantReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase5 Verification Applicant',
        email: tenantEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenantReg = await resTenantReg.json();
    assert(resTenantReg.status === 201, 'Tenant registered successfully');
    const tenantToken = dataTenantReg.data?.tokens?.accessToken;
    const tenantId = dataTenantReg.data.user.id || dataTenantReg.data.user._id;

    // STEP 4: Tenant submits Application
    const moveInDate = new Date();
    moveInDate.setDate(moveInDate.getDate() + 10);
    const resApp = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId,
        proposedRent: 28000,
        moveInDate: moveInDate.toISOString(),
        message: 'Ready to proceed with verification.',
        employmentStatus: 'Salaried',
        monthlyIncome: 95000,
        occupantsCount: 2,
      }),
    });
    const dataApp = await resApp.json();
    assert(resApp.status === 201, 'Application submitted with initial status SUBMITTED');
    const application = dataApp.data;
    const applicationId = application.id || application._id;

    // STEP 5: Initial Verification State (NOT_STARTED)
    const resInitVerif = await fetch(`${baseUrl}/verifications/application/${applicationId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataInitVerif = await resInitVerif.json();
    assert(resInitVerif.status === 200, 'Tenant fetches verification by applicationId');
    assert(
      dataInitVerif.data.verification.status === 'NOT_STARTED',
      'Initial verification status is NOT_STARTED',
      dataInitVerif.data.verification.status
    );
    const idStep = dataInitVerif.data.verification.steps.find((s: any) => s.stepId === 'ID_VERIFICATION');
    assert(
      idStep.providerNotice === 'Verification provider integration required',
      'Unavailable external identity step clearly labeled: Verification provider integration required'
    );

    // STEP 6: Owner Requests Verification
    const resReqVerif = await fetch(`${baseUrl}/verifications/application/${applicationId}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({}),
    });
    const dataReqVerif = await resReqVerif.json();
    assert(resReqVerif.status === 200, 'Owner requested verification successfully');

    // Verify application status updated to VERIFICATION_REQUIRED
    const resCheckApp = await fetch(`${baseUrl}/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataCheckApp = await resCheckApp.json();
    assert(dataCheckApp.data.status === 'VERIFICATION_REQUIRED', 'Application status updated to VERIFICATION_REQUIRED');

    // STEP 7: Privacy Shield for Owner (Owner does NOT see raw documents)
    const resOwnerVerif = await fetch(`${baseUrl}/verifications/application/${applicationId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataOwnerVerif = await resOwnerVerif.json();
    assert(resOwnerVerif.status === 200, 'Owner views verification summary');
    assert(dataOwnerVerif.data.verification.isRestrictedView === true, 'Privacy shield active: isRestrictedView is true for Owner');
    assert(!!dataOwnerVerif.data.verification.privacyNotice, 'Privacy notice is present on owner view');

    // STEP 8: Tenant Submits Available Verification Steps & Documents
    const resSubmitVerif = await fetch(`${baseUrl}/verifications/application/${applicationId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        documents: [
          {
            documentType: 'AADHAAR',
            documentNumber: 'XXXX-XXXX-9012',
            notes: 'Aadhaar identity card copy uploaded',
          },
          {
            documentType: 'SALARY_SLIP',
            documentNumber: 'PAYSLIP-SEP-2026',
            notes: 'Corporate payslip',
          },
        ],
        submittedInfo: {
          fullName: 'Phase5 Verification Applicant',
          phone: '+919876543302',
          email: tenantEmail,
          employerName: 'Global Tech Services',
          designation: 'Senior Lead Architect',
          monthlyIncome: 95000,
          currentAddress: 'Hyderabad, Telangana',
          previousLandlordContact: '+919800112233',
        },
        notes: 'Documents submitted for verification review',
      }),
    });
    const dataSubmitVerif = await resSubmitVerif.json();
    assert(resSubmitVerif.status === 201, 'Tenant submitted verification details successfully');
    assert(dataSubmitVerif.data.status === 'PENDING', 'Verification status transitioned to PENDING');

    // Verify application status updated to VERIFICATION_PENDING
    const resAppPending = await fetch(`${baseUrl}/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataAppPending = await resAppPending.json();
    assert(dataAppPending.data.status === 'VERIFICATION_PENDING', 'Application status transitioned to VERIFICATION_PENDING');

    const verifId = dataSubmitVerif.data._id || dataSubmitVerif.data.id;

    // STEP 9: Login as ADMIN and inspect Verification Queue
    // We can generate admin token directly via Auth login or admin route
    // Let's create an admin account or login with default admin seed
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nivas360.com',
        password: 'AdminSecret123!',
      }),
    });
    let adminToken: string;
    if (resAdminLogin.status === 200) {
      const dataAdminLogin = await resAdminLogin.json();
      adminToken = dataAdminLogin.data?.tokens?.accessToken;
    } else {
      const { JwtUtil } = await import('../utils/jwt.util');
      adminToken = JwtUtil.generateTokens({
        userId: 'admin_user_seed',
        email: 'admin@nivas360.com',
        role: 'ADMIN',
      }).accessToken;
    }

    // Admin Queue Query
    const resAdminQueue = await fetch(`${baseUrl}/verifications/admin/queue?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminQueue = await resAdminQueue.json();
    assert(resAdminQueue.status === 200, 'Admin fetches verification queue with status=PENDING');
    assert(Array.isArray(dataAdminQueue.data) && dataAdminQueue.data.length >= 1, 'Verification record found in Admin queue');

    // STEP 10: Admin Inspects Verification Record by ID
    const resVerifRecord = await fetch(`${baseUrl}/verifications/${verifId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataVerifRecord = await resVerifRecord.json();
    assert(resVerifRecord.status === 200, 'Admin inspects single verification record');
    assert(dataVerifRecord.data.status === 'PENDING', 'Record status is PENDING');
    assert(dataVerifRecord.data.documents.length >= 2, 'Admin view contains submitted documents');

    // STEP 11: Admin marks verification as UNDER_REVIEW
    const resUnderReview = await fetch(`${baseUrl}/verifications/${verifId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'UNDER_REVIEW' }),
    });
    const dataUnderReview = await resUnderReview.json();
    assert(resUnderReview.status === 200, 'Admin transitioned verification to UNDER_REVIEW');
    assert(dataUnderReview.data.status === 'UNDER_REVIEW', 'Verification status is now UNDER_REVIEW');

    // STEP 12: Admin approves verification as VERIFIED
    const resApproveVerif = await fetch(`${baseUrl}/verifications/${verifId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        adminNotes: 'All identity and income credentials verified by compliance team',
      }),
    });
    const dataApproveVerif = await resApproveVerif.json();
    assert(resApproveVerif.status === 200, 'Admin approved verification as VERIFIED');
    assert(dataApproveVerif.data.status === 'VERIFIED', 'Verification status is now VERIFIED');

    // Tenant profile KYC status updated to VERIFIED
    const resTenantMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataTenantMe = await resTenantMe.json();
    const verifiedStatus = dataTenantMe.data?.user?.identityVerificationStatus || dataTenantMe.data?.identityVerificationStatus;
    assert(verifiedStatus === 'VERIFIED', 'Tenant profile KYC status updated to VERIFIED');

    // STEP 13: Test Rejection Flow on another application
    // Create 2nd property & application
    const resProp2 = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 5 Rejection Test House',
        description: 'For testing rejection workflow',
        rentAmount: 20000,
        depositAmount: 40000,
        bhk: '2BHK',
        propertyType: 'INDEPENDENT_HOUSE',
        furnishing: 'UNFURNISHED',
        preferredTenants: 'ANY',
        propertyLocation: {
          address: 'Kukatpally Housing Board',
          locality: 'Kukatpally',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500072',
          coordinates: { latitude: 17.4875, longitude: 78.3953 },
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
      }),
    });
    const dataApp2 = await resApp2.json();
    const app2Id = dataApp2.data.id || dataApp2.data._id;

    // Tenant submits incomplete verification for app2
    const resSubmitVerif2 = await fetch(`${baseUrl}/verifications/application/${app2Id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        documents: [
          {
            documentType: 'AADHAAR',
            documentNumber: 'XXXX-XXXX-0000',
            notes: 'Unreadable test scan',
          },
        ],
      }),
    });
    const dataSubmitVerif2 = await resSubmitVerif2.json();
    const verif2Id = dataSubmitVerif2.data._id || dataSubmitVerif2.data.id;

    // Admin rejects verification 2
    const resRejectVerif = await fetch(`${baseUrl}/verifications/${verif2Id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'Document scan is unreadable and name does not match applicant profile.',
      }),
    });
    const dataRejectVerif = await resRejectVerif.json();
    assert(resRejectVerif.status === 200, 'Admin rejected verification record');
    assert(dataRejectVerif.data.status === 'REJECTED', 'Status updated to REJECTED');
    assert(
      dataRejectVerif.data.rejectionReason === 'Document scan is unreadable and name does not match applicant profile.',
      'Rejection reason is preserved and returned'
    );

    // Verify linked application status reverted to VERIFICATION_REQUIRED
    const resApp2Check = await fetch(`${baseUrl}/applications/${app2Id}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataApp2Check = await resApp2Check.json();
    assert(
      dataApp2Check.data.status === 'VERIFICATION_REQUIRED',
      'Linked application reverted to VERIFICATION_REQUIRED upon rejection'
    );

    // STEP 14: Verify Notifications
    const resTenantNotifs = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataTenantNotifs = await resTenantNotifs.json();
    assert(resTenantNotifs.status === 200, 'Tenant notifications retrieved');
    assert(
      Array.isArray(dataTenantNotifs.data) && dataTenantNotifs.data.length >= 3,
      'Tenant received notifications on all verification steps (Requested, Submitted, Decision)'
    );

    console.log('===========================================================');
    console.log(` Phase 5 Verification Test Results: ${passed} PASSED, ${failed} FAILED`);
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

runPhase5Tests();
