import app from '../app';
import { connectDatabase } from '../config/database';
import mongoose from 'mongoose';

const PORT = 5102;

async function runPhase6Tests() {
  console.log('===========================================================');
  console.log(' Nivas360 Phase 6 — Agreement & Rental Lifecycle Test');
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
    // 1. Connect to Database
    await connectDatabase();

    // 2. Start Test HTTP Server
    server = app.listen(PORT);
    const baseUrl = `http://localhost:${PORT}/api/v1`;
    console.log(`[TestServer] Server started at ${baseUrl}`);

    const timestamp = Date.now();

    // =========================================================================
    // STEP 1: Register an OWNER
    // =========================================================================
    const ownerEmail = `phase6-owner-${timestamp}@nivas360.com`;
    const resOwnerReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase6 Property Owner',
        email: ownerEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'OWNER',
      }),
    });
    const dataOwnerReg = await resOwnerReg.json();
    assert(resOwnerReg.status === 201, 'Owner registered successfully');
    const ownerToken = dataOwnerReg.data?.tokens?.accessToken;
    const ownerId = dataOwnerReg.data?.user?.id || dataOwnerReg.data?.user?._id;

    // =========================================================================
    // STEP 2: Owner creates a property listing
    // =========================================================================
    const resProp = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 6 Lakeview Heights',
        description: 'Prime 3BHK flat near financial district',
        rentAmount: 35000,
        depositAmount: 70000,
        bhk: '3BHK',
        propertyType: 'APARTMENT',
        furnishing: 'SEMI_FURNISHED',
        preferredTenants: 'FAMILY',
        propertyLocation: {
          address: 'Gachibowli Main Rd',
          locality: 'Gachibowli',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500032',
          coordinates: { latitude: 17.4401, longitude: 78.3489 },
        },
      }),
    });
    const dataProp = await resProp.json();
    assert(resProp.status === 201, 'Owner listed property');
    const propertyId = dataProp.data.id || dataProp.data._id;

    // =========================================================================
    // STEP 3: Register TENANT 1
    // =========================================================================
    const tenantEmail = `phase6-tenant-${timestamp}@nivas360.com`;
    const resTenantReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase6 Verified Tenant',
        email: tenantEmail,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenantReg = await resTenantReg.json();
    assert(resTenantReg.status === 201, 'Tenant registered successfully');
    const tenantToken = dataTenantReg.data?.tokens?.accessToken;
    const tenantId = dataTenantReg.data?.user?.id || dataTenantReg.data?.user?._id;

    // =========================================================================
    // STEP 4: Tenant submits Application
    // =========================================================================
    const moveInDate = new Date(Date.now() + 14 * 86400000);
    const resSubmitApp = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId,
        proposedRent: 33000,
        moveInDate: moveInDate.toISOString(),
        employmentStatus: 'Salaried Professional',
        monthlyIncome: 140000,
        occupantsCount: 3,
        notes: 'Quiet family looking for long-term tenancy.',
      }),
    });
    const dataSubmitApp = await resSubmitApp.json();
    assert(resSubmitApp.status === 201, 'Application submitted by tenant');
    const applicationId = dataSubmitApp.data.id || dataSubmitApp.data._id;
    assert(dataSubmitApp.data.status === 'SUBMITTED', 'Initial application status is SUBMITTED');

    // =========================================================================
    // STEP 5: Verification Phase
    // Owner requests verification -> Tenant submits verification -> Admin verifies
    // =========================================================================
    // Owner requests verification
    const resReqVerif = await fetch(`${baseUrl}/verifications/application/${applicationId}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({}),
    });
    assert(resReqVerif.status === 200, 'Owner requests verification');

    // Generate ADMIN Token via JwtUtil
    const { JwtUtil } = await import('../utils/jwt.util');
    const adminToken = JwtUtil.generateTokens({
      userId: `admin_phase6_${timestamp}`,
      email: `admin-phase6-${timestamp}@nivas360.com`,
      role: 'ADMIN',
    }).accessToken;

    // Tenant submits verification
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
            documentNumber: 'XXXX-XXXX-5544',
            notes: 'Aadhaar front and back scan',
          },
        ],
        submittedInfo: {
          fullName: 'Phase6 Verified Tenant',
          currentAddress: 'Hitech City, Hyderabad',
        },
        notes: 'Documents submitted for verification review',
      }),
    });
    const dataSubmitVerif = await resSubmitVerif.json();
    assert(resSubmitVerif.status === 201, 'Tenant submitted verification');
    const verifId = dataSubmitVerif.data?._id || dataSubmitVerif.data?.id;

    // Admin approves verification
    const resApproveVerif = await fetch(`${baseUrl}/verifications/${verifId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        adminNotes: 'Identity confirmed by compliance team',
      }),
    });
    assert(resApproveVerif.status === 200, 'Admin verified tenant identity dossier');

    // =========================================================================
    // STEP 6: Owner APPROVES Application -> Prepares Agreement
    // FLOW: Application -> Verification -> Approval -> Agreement (PENDING_CONFIRMATION)
    // =========================================================================
    const resApprove = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const dataApprove = await resApprove.json();
    assert(resApprove.status === 200, 'Owner approved application');
    assert(dataApprove.data.status === 'APPROVED', 'Application status transitioned to APPROVED');

    // =========================================================================
    // STEP 7: Verify Rental initial state is PENDING_CONFIRMATION
    // (Rental is NOT ACTIVE yet until owner confirms agreement)
    // =========================================================================
    const resRentalsTenant = await fetch(`${baseUrl}/rentals`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataRentalsTenant = await resRentalsTenant.json();
    assert(resRentalsTenant.status === 200, 'Tenant fetched rentals list');
    assert(Array.isArray(dataRentalsTenant.data) && dataRentalsTenant.data.length >= 1, 'Rental record created upon approval');
    const initialRental = dataRentalsTenant.data[0];
    const rentalId = initialRental.id || initialRental._id;
    assert(initialRental.status === 'PENDING_CONFIRMATION', `Rental initial status is PENDING_CONFIRMATION (was ${initialRental.status})`);

    // Verify Property is not yet marked RENTED (remains VACANT)
    const resPropCheck = await fetch(`${baseUrl}/properties/${propertyId}`);
    const dataPropCheck = await resPropCheck.json();
    assert(dataPropCheck.data.availabilityStatus === 'VACANT', 'Property remains VACANT until agreement confirmation');

    // Owner Dashboard before confirmation: activeRentals should be 0 from MongoDB
    const resDashBefore = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataDashBefore = await resDashBefore.json();
    assert(dataDashBefore.data.activeRentals === 0, 'Owner dashboard has 0 active rentals prior to agreement confirmation');
    assert(dataDashBefore.data.occupiedProperties === 0, 'Owner dashboard has 0 occupied properties prior to confirmation');

    // =========================================================================
    // STEP 8: Verify Rental Agreement Document Fields
    // Flow: Tenant & Owner see Rental Agreement
    // Agreement must contain: property, owner, tenant, rent, deposit, start date, end date/term, metadata, status
    // Must NOT claim legal e-signature; show "Digital signature integration required"
    // =========================================================================
    const resAgreementsTenant = await fetch(`${baseUrl}/agreements`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataAgreementsTenant = await resAgreementsTenant.json();
    assert(resAgreementsTenant.status === 200, 'Tenant fetched agreements list');
    assert(Array.isArray(dataAgreementsTenant.data) && dataAgreementsTenant.data.length >= 1, 'Agreement created upon approval');
    const agreement = dataAgreementsTenant.data[0];
    const agreementId = agreement.id || agreement._id;

    assert(agreement.status === 'PENDING_CONFIRMATION', 'Agreement initial status is PENDING_CONFIRMATION');
    assert(agreement.rent === 33000, `Agreement contains agreed rent (33000, got ${agreement.rent})`);
    assert(agreement.deposit === 70000, `Agreement contains security deposit (70000, got ${agreement.deposit})`);
    assert(!!agreement.startDate, 'Agreement contains lease startDate');
    assert(!!agreement.endDate, 'Agreement contains lease endDate');
    assert(agreement.termMonths === 11, 'Agreement contains termMonths (11)');

    // Verify populates: property, owner, tenant
    const propTitle = agreement.propertyId?.title || agreement.property?.title;
    assert(propTitle === 'Phase 6 Lakeview Heights', 'Agreement populates property details');
    const tenantName = agreement.tenantId?.name || agreement.tenant?.name;
    assert(tenantName === 'Phase6 Verified Tenant', 'Agreement populates tenant details');
    const ownerObjName = agreement.ownerId?.name || agreement.owner?.name;
    assert(ownerObjName === 'Phase6 Property Owner', 'Agreement populates owner details');

    // Verify Compliance & E-Sign Notice
    const metadata = agreement.agreementMetadata;
    assert(!!metadata, 'Agreement contains agreementMetadata');
    assert(
      metadata.eSignNotice === 'Digital signature integration required',
      `Agreement contains exact notice: "Digital signature integration required" (got: "${metadata.eSignNotice}")`
    );
    assert(metadata.isDigitallySigned === false, 'Agreement does NOT falsely claim digital signature completion');
    assert(metadata.eSignProvider === 'UNAVAILABLE', 'External e-sign provider is accurately marked UNAVAILABLE');
    assert(
      metadata.legalNotice.includes('Digital signature integration required'),
      'Legal notice contains explicit digital signature requirement disclaimer'
    );
    assert(agreement.tenantConfirmed === false, 'Initial tenantConfirmed is false');
    assert(agreement.ownerConfirmed === false, 'Initial ownerConfirmed is false');

    // Query Agreement by ID (GET /api/v1/agreements/:id)
    const resAgreeById = await fetch(`${baseUrl}/agreements/${agreementId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataAgreeById = await resAgreeById.json();
    assert(resAgreeById.status === 200, 'GET /agreements/:id successfully retrieved agreement');
    assert((dataAgreeById.data.id || dataAgreeById.data._id) === agreementId, 'Correct agreement returned by ID');

    // Query Agreement by Rental ID (GET /api/v1/agreements/rental/:rentalId)
    const resAgreeByRental = await fetch(`${baseUrl}/agreements/rental/${rentalId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataAgreeByRental = await resAgreeByRental.json();
    assert(resAgreeByRental.status === 200, 'GET /agreements/rental/:rentalId successfully retrieved agreement');

    // =========================================================================
    // STEP 9: Tenant Confirms Agreement
    // FLOW: Tenant reviews & records platform assent
    // =========================================================================
    const resTenantConfirm = await fetch(`${baseUrl}/agreements/${agreementId}/tenant-confirm`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        method: 'PLATFORM_CONSENT',
        notes: 'Tenant verified lease terms and approved draft agreement',
      }),
    });
    const dataTenantConfirm = await resTenantConfirm.json();
    assert(resTenantConfirm.status === 200, 'Tenant confirmed agreement');
    assert(dataTenantConfirm.data.tenantConfirmed === true, 'tenantConfirmed is now true');
    const tenantConfMeta = dataTenantConfirm.data.agreementMetadata?.tenantConfirmation;
    assert(tenantConfMeta?.confirmed === true, 'tenantConfirmation.confirmed is true');
    assert(!!tenantConfMeta?.confirmedAt, 'tenantConfirmation contains accurate confirmedAt timestamp');
    assert(tenantConfMeta?.method === 'PLATFORM_CONSENT', 'Accurately represents platform consent method');

    // Agreement and Rental still pending owner confirmation
    assert(dataTenantConfirm.data.status === 'PENDING_CONFIRMATION', 'Agreement remains PENDING_CONFIRMATION until owner confirmation');

    // =========================================================================
    // STEP 10: Owner Confirms Agreement -> RENTAL ACTIVATION
    // FLOW: Owner confirmation -> Rental activation (status: ACTIVE)
    // =========================================================================
    const resOwnerConfirm = await fetch(`${baseUrl}/agreements/${agreementId}/confirm`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        method: 'PLATFORM_CONSENT',
        notes: 'Owner approved lease and authorized rental activation',
      }),
    });
    const dataOwnerConfirm = await resOwnerConfirm.json();
    assert(resOwnerConfirm.status === 200, 'Owner confirmed agreement & activated rental');
    assert(dataOwnerConfirm.data.status === 'CONFIRMED', 'Agreement status is now CONFIRMED');
    assert(dataOwnerConfirm.data.ownerConfirmed === true, 'ownerConfirmed is now true');
    assert(!!dataOwnerConfirm.data.confirmedAt, 'Agreement confirmedAt timestamp is set');
    const ownerConfMeta = dataOwnerConfirm.data.agreementMetadata?.ownerConfirmation;
    assert(ownerConfMeta?.confirmed === true, 'ownerConfirmation.confirmed is true');
    assert(!!ownerConfMeta?.confirmedAt, 'ownerConfirmation contains confirmedAt timestamp');

    // =========================================================================
    // STEP 11: Verify Rental is now ACTIVE
    // =========================================================================
    const resRentalActive = await fetch(`${baseUrl}/rentals`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataRentalActive = await resRentalActive.json();
    const activeRental = dataRentalActive.data.find((r: any) => (r.id || r._id) === rentalId);
    assert(activeRental.status === 'ACTIVE', 'Rental status transitioned to ACTIVE upon owner agreement confirmation');

    // Verify Property is now marked RENTED
    const resPropRented = await fetch(`${baseUrl}/properties/${propertyId}`);
    const dataPropRented = await resPropRented.json();
    assert(dataPropRented.data.availabilityStatus === 'RENTED', 'Property availability status transitioned to RENTED');

    // =========================================================================
    // STEP 12: Verify Owner Dashboard Metrics Update from MongoDB
    // =========================================================================
    const resDashAfter = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dataDashAfter = await resDashAfter.json();
    assert(dataDashAfter.data.activeRentals === 1, `Owner dashboard activeRentals updated from MongoDB (expected 1, got ${dataDashAfter.data.activeRentals})`);
    assert(dataDashAfter.data.occupiedProperties === 1, `Owner dashboard occupiedProperties updated from MongoDB (expected 1, got ${dataDashAfter.data.occupiedProperties})`);

    // =========================================================================
    // STEP 13: IDOR Security Check (Unauthorized user cannot confirm/cancel)
    // =========================================================================
    // Register Tenant 2 (unrelated)
    const tenant2Email = `phase6-unrelated-${timestamp}@nivas360.com`;
    const resTenant2Reg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase6 Unrelated User',
        email: tenant2Email,
        phone: '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: 'Password123',
        role: 'TENANT',
      }),
    });
    const dataTenant2Reg = await resTenant2Reg.json();
    const tenant2Token = dataTenant2Reg.data?.tokens?.accessToken;

    const resIdorConfirm = await fetch(`${baseUrl}/agreements/${agreementId}/confirm`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenant2Token}`,
      },
    });
    assert(resIdorConfirm.status === 403, 'IDOR Protection: Unrelated user rejected with 403 Forbidden on confirmation');

    // =========================================================================
    // STEP 14: Test Agreement Cancellation Flow
    // =========================================================================
    // Create Property 2
    const resProp2 = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 6 Cancellation Property',
        description: 'For testing lease cancellation flow',
        rentAmount: 22000,
        depositAmount: 44000,
        bhk: '2BHK',
        propertyType: 'APARTMENT',
        furnishing: 'UNFURNISHED',
        preferredTenants: 'ANY',
        propertyLocation: {
          address: 'Madhapur Metro',
          locality: 'Madhapur',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { latitude: 17.4485, longitude: 78.3908 },
        },
      }),
    });
    const dataProp2 = await resProp2.json();
    const prop2Id = dataProp2.data.id || dataProp2.data._id;

    // Tenant 2 applies for Property 2
    const resApp2 = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenant2Token}`,
      },
      body: JSON.stringify({
        propertyId: prop2Id,
        proposedRent: 22000,
        moveInDate: moveInDate.toISOString(),
      }),
    });
    const dataApp2 = await resApp2.json();
    const app2Id = dataApp2.data.id || dataApp2.data._id;

    // Owner approves Application 2
    await fetch(`${baseUrl}/applications/${app2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    // Get agreement for application 2
    const resAgree2 = await fetch(`${baseUrl}/agreements`, {
      headers: { Authorization: `Bearer ${tenant2Token}` },
    });
    const dataAgree2 = await resAgree2.json();
    const agreement2 = dataAgree2.data[0];
    const agree2Id = agreement2.id || agreement2._id;

    // Tenant cancels agreement
    const resCancel = await fetch(`${baseUrl}/agreements/${agree2Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenant2Token}`,
      },
      body: JSON.stringify({ reason: 'Tenant relocated to another city' }),
    });
    const dataCancel = await resCancel.json();
    assert(resCancel.status === 200, 'Agreement successfully cancelled');
    assert(dataCancel.data.status === 'CANCELLED', 'Agreement status updated to CANCELLED');
    assert(!!dataCancel.data.cancelledAt, 'Agreement cancelledAt timestamp recorded');
    assert(dataCancel.data.cancellationReason === 'Tenant relocated to another city', 'Cancellation reason preserved');

    // =========================================================================
    // STEP 15: Notification Delivery Verification
    // =========================================================================
    const resTenantNotifs = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const dataTenantNotifs = await resTenantNotifs.json();
    assert(resTenantNotifs.status === 200, 'Tenant notifications queried');
    const hasActivationNotif = dataTenantNotifs.data.some((n: any) =>
      n.title.includes('Confirmed') || n.title.includes('Activated') || n.message.includes('ACTIVE')
    );
    assert(hasActivationNotif, 'Tenant received confirmation and activation notification');

    console.log('===========================================================');
    console.log(` Phase 6 Lifecycle Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPhase6Tests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});

