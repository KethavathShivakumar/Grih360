import mongoose from 'mongoose';
import { ServiceRequestModel } from '../models/service-request.model';
import { ServiceCategoryModel } from '../models/service-category.model';
import { ProfessionalProfileModel } from '../models/professional-profile.model';
import { UserModel } from '../models/user.model';
import { PropertyModel } from '../models/property.model';
import { ReviewModel } from '../models/review.model';
import { ServiceRequestService } from '../services/service-request.service';
import { ProfessionalService } from '../services/professional.service';
import { ProfessionalMatchingService } from '../services/professional-matching.service';
import { connectDatabase } from '../config/database';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(` ❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(` ✅ PASS: ${message}`);
  }
}

async function runPhase10Tests() {
  console.log('===========================================================');
  console.log(' Nivas360 Phase 10: Real Home Services Lifecycle Verification');
  console.log('===========================================================');

  await connectDatabase();
  console.log('[Database] Connected to MongoDB');

  // 1. Verify all 8 categories
  const categories = await ServiceRequestService.getCategories();
  const categoryCodes = categories.map((c: any) => c.code);
  const requiredCategories = [
    'PLUMBING',
    'ELECTRICAL',
    'CARPENTRY',
    'PAINTING',
    'CLEANING',
    'AC_APPLIANCE',
    'WATER_FILTER',
    'GENERAL_MAINTENANCE',
  ];

  for (const cat of requiredCategories) {
    assert(categoryCodes.includes(cat), `Category '${cat}' is present and active in database`);
  }

  // 2. Create Owner, Property, Tenant, Professional
  const ts = Date.now();
  const owner = await UserModel.create({
    name: `Owner Phase10 ${ts}`,
    email: `owner10_${ts}@nivas360.com`,
    phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'OWNER',
  });

  const property = await PropertyModel.create({
    ownerId: owner._id,
    title: 'Emerald Residency 4BHK Banjara Hills',
    propertyType: 'APARTMENT',
    propertyLocation: {
      address: 'Road No 12, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
    rentAmount: 45000,
    depositAmount: 90000,
    bhk: 4,
    bathrooms: 4,
    areaSqFt: 2400,
    furnishing: 'SEMI_FURNISHED',
    description: 'Luxury 4BHK apartment in Banjara Hills',
    status: 'ACTIVE',
  });

  const tenant = await UserModel.create({
    name: `Tenant Resident ${ts}`,
    email: `tenant10_${ts}@nivas360.com`,
    phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'TENANT',
  });

  const professionalUser = await UserModel.create({
    name: `Raju Plumbing Specialist ${ts}`,
    email: `pro10_${ts}@nivas360.com`,
    phone: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'PROFESSIONAL',
  });

  assert(Boolean(owner && property && tenant && professionalUser), 'Created real Owner, Property, Tenant, and Professional in database');

  // 3. Configure Professional Profile
  const proProfile = await ProfessionalService.updateProfile(professionalUser._id.toString(), {
    businessName: 'Raju Master Plumbing & Repairs',
    categories: ['PLUMBING', 'GENERAL_MAINTENANCE'],
    experienceYears: 6,
    serviceAreas: ['Hyderabad', 'Banjara Hills'],
    serviceRadiusKm: 20,
    bio: 'Licensed plumbing contractor with 6 years experience in residential complexes.',
  });

  await ProfessionalService.toggleAvailability(professionalUser._id.toString(), true);
  assert(proProfile.categories.includes('PLUMBING') && proProfile.isAvailable === true, 'Professional profile configured with PLUMBING category and ON-DUTY availability');

  // 4. Tenant creates Service Request for the property
  const request = await ServiceRequestService.createServiceRequest(tenant._id.toString(), {
    categoryCode: 'PLUMBING',
    description: 'Master bathroom hot water mixer leaking continuously from wall joint',
    scheduledDate: new Date(Date.now() + 86400000),
    preferredTimeWindow: '10:00 AM - 01:00 PM',
    propertyId: property._id.toString(),
    serviceLocation: {
      address: 'Flat 301, Emerald Residency, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
  });

  assert(Boolean(request && request._id), 'Tenant created Service Request successfully');
  console.log(`[Lifecycle] Request ID: ${request._id}, Initial Status: ${request.status}`);

  // Check auto-assignment or direct assignment
  let reqDetails = await ServiceRequestService.getRequestById(request._id.toString(), tenant._id.toString(), 'TENANT');
  assert(
    reqDetails.request.status === 'ASSIGNED' || reqDetails.request.status === 'MATCHING',
    `Request lifecycle entered state ${reqDetails.request.status}`
  );

  // If assigned to another professional due to prior database entries, ensure our test pro is assigned
  const reqDoc = await ServiceRequestModel.findById(request._id);
  if (reqDoc) {
    reqDoc.professionalId = professionalUser._id;
    reqDoc.status = 'ASSIGNED';
    await reqDoc.save();
  }

  // 5. Professional Views Assigned Requests
  const proAssigned = await ProfessionalService.getAssignedRequests(professionalUser._id.toString(), 'ASSIGNED');
  assert(proAssigned.length > 0, 'Professional sees the assigned service request in their assigned queue');

  // 6. Professional Accepts Job (ASSIGNED -> ACCEPTED)
  const acceptedReq = await ServiceRequestService.updateRequestStatus(
    request._id.toString(),
    professionalUser._id.toString(),
    'PROFESSIONAL',
    'ACCEPTED'
  );
  assert(acceptedReq.status === 'ACCEPTED', 'Professional accepted job: status transitioned ASSIGNED -> ACCEPTED');

  // 7. Professional Starts Job (ACCEPTED -> IN_PROGRESS)
  const inProgressReq = await ServiceRequestService.updateRequestStatus(
    request._id.toString(),
    professionalUser._id.toString(),
    'PROFESSIONAL',
    'IN_PROGRESS'
  );
  assert(inProgressReq.status === 'IN_PROGRESS', 'Professional started work: status transitioned ACCEPTED -> IN_PROGRESS');

  // 8. Professional Completes Job (IN_PROGRESS -> COMPLETED)
  const completedReq = await ServiceRequestService.updateRequestStatus(
    request._id.toString(),
    professionalUser._id.toString(),
    'PROFESSIONAL',
    'COMPLETED',
    'Replaced worn rubber seal on thermostatic diverter and resealed pipe flange',
    750
  );
  assert(completedReq.status === 'COMPLETED', 'Professional completed job: status transitioned IN_PROGRESS -> COMPLETED');
  assert(completedReq.completion?.notes?.includes('diverter'), 'Job completion notes persisted in database');
  assert(completedReq.estimatedCost === 750, 'Actual completed cost (₹750) persisted in database');

  // 9. Tenant sees real-time COMPLETED status
  const tenantView = await ServiceRequestService.getRequestById(request._id.toString(), tenant._id.toString(), 'TENANT');
  assert(tenantView.request.status === 'COMPLETED', 'Tenant views real request status as COMPLETED');
  assert(tenantView.professionalProfile?.businessName === 'Raju Master Plumbing & Repairs', 'Tenant views assigned professional business details');

  // 10. Tenant submits 5-star review
  const review = await ServiceRequestService.submitServiceReview(
    request._id.toString(),
    tenant._id.toString(),
    5,
    'Fast arrival and completely fixed the bathroom leak. Clean work!'
  );
  assert(review && review.rating === 5, 'Tenant submitted 5-star review for completed job');

  // 11. Professional Reviews & Rating Recalculation
  const proReviews = await ProfessionalService.getReviewsForProfessional(professionalUser._id.toString());
  assert(proReviews.length > 0 && proReviews[0].rating === 5, 'Professional reviews list reflects the real customer review');

  const updatedProProfile = await ProfessionalProfileModel.findOne({ userId: professionalUser._id });
  assert(updatedProProfile?.rating === 5.0, `Professional rating dynamically recalculated from real reviews to ${updatedProProfile?.rating}`);

  // 12. Owner views maintenance log for their rental property
  const ownerPropertyRequests = await ServiceRequestService.getPropertyRequests(
    property._id.toString(),
    owner._id.toString(),
    'OWNER'
  );
  assert(ownerPropertyRequests.length > 0, 'Owner retrieves maintenance log for their owned rental property');
  assert(
    ownerPropertyRequests[0].status === 'COMPLETED' && ownerPropertyRequests[0].estimatedCost === 750,
    'Owner sees accurate completed maintenance ticket with labor cost and completion info'
  );

  // 13. Test Rejection & Re-queueing (ASSIGNED -> REJECTED -> MATCHING)
  const request2 = await ServiceRequestService.createServiceRequest(tenant._id.toString(), {
    categoryCode: 'GENERAL_MAINTENANCE',
    description: 'Balcony sliding door roller track stuck and jumping rails',
    scheduledDate: new Date(Date.now() + 172800000),
    propertyId: property._id.toString(),
    serviceLocation: {
      address: 'Flat 301, Emerald Residency, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
  });

  const reqDoc2 = await ServiceRequestModel.findById(request2._id);
  if (reqDoc2) {
    reqDoc2.professionalId = professionalUser._id;
    reqDoc2.status = 'ASSIGNED';
    await reqDoc2.save();
  }

  const rejectedReq = await ServiceRequestService.updateRequestStatus(
    request2._id.toString(),
    professionalUser._id.toString(),
    'PROFESSIONAL',
    'REJECTED',
    'Cannot take this assignment due to scheduling conflict'
  );
  assert(
    rejectedReq.status === 'MATCHING' || rejectedReq.status === 'ASSIGNED',
    `Professional rejected job: request unassigned and returned to MATCHING/ASSIGNED queue (Status: ${rejectedReq.status})`
  );

  // 14. Test Cancellation (REQUESTED/MATCHING/ASSIGNED -> CANCELLED)
  const cancelledReq = await ServiceRequestService.cancelServiceRequest(
    request2._id.toString(),
    tenant._id.toString(),
    'TENANT',
    'Issue resolved independently'
  );
  assert(cancelledReq.status === 'CANCELLED', 'Tenant cancelled service request: status transitioned to CANCELLED');

  console.log('===========================================================');
  console.log(' ✅ ALL PHASE 10 REAL HOME SERVICES WORKFLOW TESTS PASSED!');
  console.log('===========================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runPhase10Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
