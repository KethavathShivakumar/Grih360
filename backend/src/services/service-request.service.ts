import { ServiceCategoryModel } from '../models/service-category.model';
import { ServiceRequestModel } from '../models/service-request.model';
import { RentalModel } from '../models/rental.model';
import { PropertyModel } from '../models/property.model';
import { ReviewModel } from '../models/review.model';
import { ProfessionalService, memoryReviews } from './professional.service';
import { ProfessionalMatchingService } from './professional-matching.service';
import { NotificationService } from './notification.service';
import { ServiceCategoryCode, ServiceRequestStatus, IServiceLocation } from '../types/service.types';
import { CUSTOMER_CARE_HOTLINE } from '../utils/customer-care.util';
import mongoose, { Types } from 'mongoose';

export const memoryServiceCategories = new Map<string, any>();
export const memoryServiceRequests = new Map<string, any>();

const DEFAULT_CATEGORIES = [
  { id: 'cat_1', code: 'PLUMBING', name: 'Plumbing', description: 'Pipe fixes, leakages, tap replacements, and sanitary fittings', icon: 'wrench' },
  { id: 'cat_2', code: 'ELECTRICAL', name: 'Electrical', description: 'Wiring, MCBs, lightings, fans, and switchboard repairs', icon: 'zap' },
  { id: 'cat_3', code: 'CARPENTRY', name: 'Carpentry', description: 'Furniture repair, door locks, hinges, and custom woodwork', icon: 'hammer' },
  { id: 'cat_4', code: 'PAINTING', name: 'Painting', description: 'Touchup painting, full wall coating, and waterproofing solutions', icon: 'paint-brush' },
  { id: 'cat_5', code: 'CLEANING', name: 'Cleaning', description: 'Deep home cleaning, sofa, carpet, and kitchen sanitation', icon: 'sparkles' },
  { id: 'cat_6', code: 'AC_APPLIANCE', name: 'AC & Appliance', description: 'Air conditioner servicing, fridge, and washing machine repair', icon: 'air-vent' },
  { id: 'cat_7', code: 'WATER_FILTER', name: 'Water Filter', description: 'RO filter replacement, servicing, and TDS testing', icon: 'droplet' },
  { id: 'cat_8', code: 'GENERAL_MAINTENANCE', name: 'General Maintenance', description: 'Handyman services, tile repairs, and overall property upkeep', icon: 'settings' },
];

export class ServiceRequestService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Seed default service categories.
   */
  static async seedDefaultCategories() {
    if (this.isMongoConnected()) {
      for (const cat of DEFAULT_CATEGORIES) {
        await ServiceCategoryModel.findOneAndUpdate(
          { code: cat.code },
          { name: cat.name, description: cat.description, icon: cat.icon, isActive: true },
          { upsert: true, new: true }
        );
      }
    } else {
      for (const cat of DEFAULT_CATEGORIES) {
        memoryServiceCategories.set(cat.code, {
          _id: cat.id,
          id: cat.id,
          code: cat.code,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          isActive: true,
        });
      }
    }
  }

  /**
   * Get all active service categories.
   */
  static async getCategories() {
    await this.seedDefaultCategories();
    if (this.isMongoConnected()) {
      return ServiceCategoryModel.find({ isActive: true }).sort({ name: 1 });
    } else {
      return Array.from(memoryServiceCategories.values()).filter((c) => c.isActive);
    }
  }

  /**
   * Create a new Home Service Request.
   */
  static async createServiceRequest(
    requesterId: string,
    data: {
      categoryCode: ServiceCategoryCode;
      description: string;
      scheduledDate: string | Date;
      preferredTimeWindow?: string;
      propertyId?: string;
      rentalId?: string;
      serviceLocation?: Partial<IServiceLocation>;
      images?: string[];
    }
  ): Promise<any> {
    if (!data.categoryCode || !data.description || !data.scheduledDate) {
      throw new Error('Category, issue description, and scheduled date are required');
    }

    await this.seedDefaultCategories();

    let finalPropertyId = data.propertyId;
    let finalRentalId = data.rentalId;
    let location: IServiceLocation = {
      address: data.serviceLocation?.address || '',
      city: data.serviceLocation?.city || 'Hyderabad',
      state: data.serviceLocation?.state || 'Telangana',
      pincode: data.serviceLocation?.pincode || '500001',
      latitude: data.serviceLocation?.latitude,
      longitude: data.serviceLocation?.longitude,
    };

    if (this.isMongoConnected()) {
      const categoryDoc = await ServiceCategoryModel.findOne({ code: data.categoryCode });
      if (!categoryDoc) throw new Error(`Invalid service category code: ${data.categoryCode}`);

      if (!finalRentalId || !finalPropertyId) {
        const activeRental = await RentalModel.findOne({ tenantId: requesterId, status: 'ACTIVE' }).populate('propertyId');
        if (activeRental) {
          finalRentalId = activeRental._id.toString();
          finalPropertyId = (activeRental.propertyId as any)?._id
            ? (activeRental.propertyId as any)._id.toString()
            : activeRental.propertyId.toString();

          const prop = activeRental.propertyId as any;
          if (prop && prop.propertyLocation && (!location.address || location.address.trim() === '')) {
            location = {
              address: prop.propertyLocation.address || prop.title || 'Current Rental Property',
              city: prop.propertyLocation.city || 'Hyderabad',
              state: prop.propertyLocation.state || 'Telangana',
              pincode: prop.propertyLocation.pincode || '500001',
              latitude: prop.propertyLocation.latitude,
              longitude: prop.propertyLocation.longitude,
            };
          }
        }
      }

      if (!location.address || location.address.trim() === '') location.address = 'Service Address';

      const request = await ServiceRequestModel.create({
        requesterId: new Types.ObjectId(requesterId),
        propertyId: finalPropertyId ? new Types.ObjectId(finalPropertyId) : undefined,
        rentalId: finalRentalId ? new Types.ObjectId(finalRentalId) : undefined,
        categoryId: categoryDoc._id,
        categoryCode: data.categoryCode,
        status: 'REQUESTED',
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        preferredTimeWindow: data.preferredTimeWindow || 'Flexible',
        serviceLocation: location,
        images: data.images || [],
        customerCareContact: CUSTOMER_CARE_HOTLINE,
      });

      await ProfessionalMatchingService.autoAssignProfessional(request._id.toString());

      await NotificationService.createNotification({
        recipientId: requesterId,
        title: 'Service Request Submitted',
        message: `Your ${categoryDoc.name} request has been received and matching has started.`,
        type: 'SERVICE',
        link: `/tenant/services/requests/${request._id}`,
      });

      return (await ServiceRequestModel.findById(request._id)
        .populate('requesterId', 'name email phone')
        .populate('propertyId', 'title propertyLocation')
        .populate('professionalId', 'name email phone'))!;
    } else {
      const cat = memoryServiceCategories.get(data.categoryCode);
      const reqId = 'srv_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      if (!location.address || location.address.trim() === '') location.address = 'Service Address';

      const reqObj: any = {
        _id: reqId,
        id: reqId,
        requesterId: { _id: requesterId, id: requesterId, name: 'Tenant User', email: `${requesterId}@grih360.com`, phone: '+919800000000' },
        propertyId: finalPropertyId ? { _id: finalPropertyId, id: finalPropertyId, title: 'Current Residence' } : undefined,
        rentalId: finalRentalId,
        categoryId: cat?._id || 'cat_1',
        categoryCode: data.categoryCode,
        status: 'REQUESTED',
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        preferredTimeWindow: data.preferredTimeWindow || 'Flexible',
        serviceLocation: location,
        images: data.images || [],
        customerCareContact: CUSTOMER_CARE_HOTLINE,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          memoryServiceRequests.set(reqId, this);
          return this;
        },
      };

      memoryServiceRequests.set(reqId, reqObj);
      await ProfessionalMatchingService.autoAssignProfessional(reqId);

      await NotificationService.createNotification({
        recipientId: requesterId,
        title: 'Service Request Submitted',
        message: `Your ${data.categoryCode} request has been received.`,
        type: 'SERVICE',
        link: `/tenant/services/requests/${reqId}`,
      });

      return memoryServiceRequests.get(reqId);
    }
  }

  /**
   * Get single service request by ID with server-side authorization check.
   * Authorized: ADMIN, requester (TENANT), assigned PROFESSIONAL, or property OWNER.
   */
  static async getRequestById(requestId: string, userId: string, userRole: string) {
    let request: any = null;

    if (this.isMongoConnected()) {
      request = await ServiceRequestModel.findById(requestId)
        .populate('requesterId', 'name email phone profileImage')
        .populate('propertyId', 'title propertyLocation rentAmount ownerId')
        .populate('professionalId', 'name email phone profileImage');
    } else {
      request = memoryServiceRequests.get(requestId);
    }

    if (!request) throw new Error('Service request not found');

    const requesterAny = request.requesterId as any;
    const requesterIdStr = requesterAny?._id ? requesterAny._id.toString() : (requesterAny?.id || requesterAny.toString());

    const proAny = request.professionalId as any;
    const proIdStr = proAny ? (proAny._id ? proAny._id.toString() : (proAny.id || proAny.toString())) : null;

    let isOwner = false;
    if (request.propertyId) {
      const propAny = request.propertyId as any;
      const propOwnerIdStr = propAny?.ownerId?._id
        ? propAny.ownerId._id.toString()
        : (propAny?.ownerId?.toString() || '');
      if (propOwnerIdStr && propOwnerIdStr === userId) {
        isOwner = true;
      } else {
        const propId = propAny._id ? propAny._id.toString() : (propAny.id || propAny.toString());
        if (this.isMongoConnected()) {
          const prop = await PropertyModel.findById(propId);
          if (prop && prop.ownerId && prop.ownerId.toString() === userId) {
            isOwner = true;
          }
        } else {
          const { memoryProperties } = require('./property.service');
          const prop = memoryProperties?.get(propId);
          if (prop && (prop.ownerId === userId || prop.ownerId?._id === userId)) {
            isOwner = true;
          }
        }
      }
    }

    if (userRole !== 'ADMIN' && userId !== requesterIdStr && userId !== proIdStr && !isOwner) {
      throw new Error('Unauthorized access to service request');
    }

    let professionalProfile = null;
    if (proIdStr) {
      professionalProfile = await ProfessionalService.getProfileByUserId(proIdStr);
    }

    return { request, professionalProfile };
  }

  /**
   * Get user's service requests.
   * TENANT: Requests submitted by tenant.
   * PROFESSIONAL: Requests assigned to professional.
   * OWNER: Requests submitted for properties owned by this owner.
   */
  static async getUserRequests(userId: string, userRole: string, status?: string) {
    if (this.isMongoConnected()) {
      const query: any = {};
      if (userRole === 'TENANT') {
        query.requesterId = userId;
      } else if (userRole === 'PROFESSIONAL') {
        query.professionalId = userId;
      } else if (userRole === 'OWNER') {
        const ownedProps = await PropertyModel.find({ ownerId: userId }).select('_id');
        const propIds = ownedProps.map((p) => p._id);
        query.propertyId = { $in: propIds };
      }
      if (status) query.status = status;

      return ServiceRequestModel.find(query)
        .sort({ createdAt: -1 })
        .populate('requesterId', 'name email phone')
        .populate('propertyId', 'title propertyLocation')
        .populate('professionalId', 'name email phone');
    } else {
      const list = Array.from(memoryServiceRequests.values()).filter((r: any) => {
        const reqStr = r.requesterId?._id || r.requesterId?.id || r.requesterId;
        const proStr = r.professionalId?._id || r.professionalId?.id || r.professionalId;
        if (userRole === 'TENANT') return reqStr === userId;
        if (userRole === 'PROFESSIONAL') return proStr === userId;
        if (userRole === 'OWNER') {
          const { memoryProperties } = require('./property.service');
          const propId = r.propertyId?._id || r.propertyId?.id || r.propertyId;
          const prop = memoryProperties?.get(propId);
          return prop && (prop.ownerId === userId || prop.ownerId?._id === userId);
        }
        return true;
      });
      if (status) return list.filter((r) => r.status === status);
      return list;
    }
  }

  /**
   * Get all service requests for a specific property (for Owner or Tenant).
   */
  static async getPropertyRequests(propertyId: string, userId: string, userRole: string) {
    if (this.isMongoConnected()) {
      return ServiceRequestModel.find({ propertyId })
        .sort({ createdAt: -1 })
        .populate('requesterId', 'name email phone')
        .populate('propertyId', 'title propertyLocation')
        .populate('professionalId', 'name email phone');
    } else {
      return Array.from(memoryServiceRequests.values()).filter((r: any) => {
        const pId = r.propertyId?._id || r.propertyId?.id || r.propertyId;
        return pId === propertyId;
      });
    }
  }

  /**
   * Update request status using Controlled State Machine logic.
   */
  static async updateRequestStatus(
    requestId: string,
    actorId: string,
    actorRole: string,
    targetStatus: ServiceRequestStatus,
    notes?: string,
    actualCost?: number
  ) {
    let request: any = null;
    if (this.isMongoConnected()) {
      request = await ServiceRequestModel.findById(requestId);
    } else {
      request = memoryServiceRequests.get(requestId);
    }

    if (!request) throw new Error('Service request not found');

    const currentStatus = request.status;
    const proIdStr = request.professionalId
      ? request.professionalId._id
        ? request.professionalId._id.toString()
        : (request.professionalId.id || request.professionalId.toString())
      : null;

    const requesterAny = request.requesterId as any;
    const requesterIdStr = requesterAny?._id ? requesterAny._id.toString() : (requesterAny?.id || requesterAny.toString());

    if (actorRole !== 'ADMIN') {
      if (['ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(targetStatus)) {
        if (proIdStr !== actorId) {
          throw new Error('Only the assigned professional can update job status');
        }
      }
    }

    const validTransitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
      REQUESTED: ['MATCHING', 'CANCELLED'],
      MATCHING: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
      REJECTED: ['MATCHING', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowedNext = validTransitions[currentStatus as ServiceRequestStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    }

    request.status = targetStatus;
    request.updatedAt = new Date();

    if (targetStatus === 'COMPLETED') {
      request.completion = { completedAt: new Date(), notes: notes || 'Service completed' };
      if (actualCost !== undefined && !isNaN(Number(actualCost))) {
        request.estimatedCost = Number(actualCost);
      }
    } else if (targetStatus === 'REJECTED') {
      request.professionalId = undefined;
      request.status = 'MATCHING';
      if (this.isMongoConnected()) await request.save();
      else memoryServiceRequests.set(requestId, request);
      await ProfessionalMatchingService.autoAssignProfessional(requestId);
      return request;
    }

    if (this.isMongoConnected()) {
      await request.save();
    } else {
      memoryServiceRequests.set(requestId, request);
    }

    await NotificationService.createNotification({
      recipientId: requesterIdStr,
      title: `Service Request Update: ${targetStatus}`,
      message: `Your ${request.categoryCode} service request status changed to ${targetStatus}.`,
      type: 'SERVICE',
      link: `/tenant/services/requests/${request._id || request.id}`,
    });

    return request;
  }

  /**
   * Cancel service request.
   */
  static async cancelServiceRequest(requestId: string, userId: string, userRole: string, reason: string) {
    let request: any = null;
    if (this.isMongoConnected()) {
      request = await ServiceRequestModel.findById(requestId);
    } else {
      request = memoryServiceRequests.get(requestId);
    }

    if (!request) throw new Error('Service request not found');

    const requesterAny = request.requesterId as any;
    const requesterIdStr = requesterAny?._id ? requesterAny._id.toString() : (requesterAny?.id || requesterAny.toString());

    const proAny = request.professionalId as any;
    const proIdStr = proAny ? (proAny._id ? proAny._id.toString() : (proAny.id || proAny.toString())) : null;

    if (userRole !== 'ADMIN' && userId !== requesterIdStr && userId !== proIdStr) {
      throw new Error('Unauthorized to cancel this service request');
    }

    if (['COMPLETED', 'CANCELLED'].includes(request.status)) {
      throw new Error(`Cannot cancel a service request in ${request.status} state`);
    }

    request.status = 'CANCELLED';
    request.cancellation = {
      cancelledBy: userId,
      cancelledAt: new Date(),
      reason: reason || 'Cancelled by user',
    };

    if (this.isMongoConnected()) await request.save();
    else memoryServiceRequests.set(requestId, request);

    return request;
  }

  /**
   * Add service photo attachments.
   */
  static async addServiceImages(requestId: string, userId: string, userRole: string, imageUrls: string[]) {
    let request: any = null;
    if (this.isMongoConnected()) {
      request = await ServiceRequestModel.findById(requestId);
    } else {
      request = memoryServiceRequests.get(requestId);
    }

    if (!request) throw new Error('Service request not found');

    if (!request.images) request.images = [];
    request.images.push(...imageUrls);

    if (this.isMongoConnected()) await request.save();
    else memoryServiceRequests.set(requestId, request);

    return request;
  }

  /**
   * Submit review for a COMPLETED service request.
  /**
   * Submit review for a COMPLETED service request.
   * Supports:
   * - Tenant -> Professional
   * - Owner/Tenant -> completed service
   */
  static async submitServiceReview(requestId: string, reviewerId: string, rating: number, comment: string) {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      throw new Error('Review comment is required');
    }

    let request: any = null;
    if (this.isMongoConnected()) {
      request = await ServiceRequestModel.findById(requestId);
    } else {
      request = memoryServiceRequests.get(requestId);
    }

    if (!request) throw new Error('Service request not found');

    if (request.status !== 'COMPLETED') {
      throw new Error('Only completed service requests can be reviewed');
    }

    const requesterAny = request.requesterId as any;
    const requesterIdStr = requesterAny?._id ? requesterAny._id.toString() : (requesterAny?.id || requesterAny.toString());

    // Check if reviewer is the requester (Tenant / Customer) or the Property Owner
    let isAuthorized = (requesterIdStr === reviewerId);
    if (!isAuthorized && request.propertyId) {
      const propIdStr = (request.propertyId as any)?._id ? (request.propertyId as any)._id.toString() : (request.propertyId as any)?.id || request.propertyId.toString();
      let prop: any = null;
      if (this.isMongoConnected()) {
        prop = await PropertyModel.findById(propIdStr);
      } else {
        const { memoryProperties } = require('./property.service');
        prop = memoryProperties?.get(propIdStr);
      }
      if (prop) {
        const ownerAny = prop.ownerId as any;
        const ownerIdStr = ownerAny?._id ? ownerAny._id.toString() : (ownerAny?.id || ownerAny.toString());
        if (ownerIdStr === reviewerId) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      throw new Error('Only the customer who requested the service or the property owner can leave a review');
    }

    const proAny = request.professionalId as any;
    const proUserId = proAny ? (proAny._id ? proAny._id.toString() : (proAny.id || proAny.toString())) : null;

    if (!proUserId) {
      throw new Error('No professional associated with this service request');
    }

    if (this.isMongoConnected()) {
      const existingReview = await ReviewModel.findOne({
        serviceRequestId: new Types.ObjectId(requestId),
        reviewerId: new Types.ObjectId(reviewerId),
      });
      if (existingReview) {
        throw new Error('You have already submitted a review for this completed service');
      }

      const review = await ReviewModel.create({
        reviewerId: new Types.ObjectId(reviewerId),
        reviewer: new Types.ObjectId(reviewerId),
        revieweeId: new Types.ObjectId(proUserId),
        reviewee: new Types.ObjectId(proUserId),
        targetType: 'PROFESSIONAL',
        targetId: new Types.ObjectId(proUserId),
        serviceRequestId: new Types.ObjectId(requestId),
        serviceRequest: new Types.ObjectId(requestId),
        rating: numRating,
        comment: comment.trim(),
      });

      await ProfessionalService.recalculateRating(proUserId);
      return review;
    } else {
      for (const r of memoryReviews.values()) {
        const sId = r.serviceRequestId?._id || r.serviceRequestId?.id || r.serviceRequestId;
        const revId = r.reviewerId?._id || r.reviewerId?.id || r.reviewerId;
        if (sId === requestId && revId === reviewerId) {
          throw new Error('You have already submitted a review for this completed service');
        }
      }

      const revId = 'rev_' + Date.now();
      const reviewObj = {
        _id: revId,
        id: revId,
        reviewerId,
        reviewer: reviewerId,
        revieweeId: proUserId,
        reviewee: proUserId,
        targetType: 'PROFESSIONAL',
        targetId: proUserId,
        serviceRequestId: requestId,
        serviceRequest: requestId,
        rating: numRating,
        comment: comment.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryReviews.set(revId, reviewObj);
      await ProfessionalService.recalculateRating(proUserId);
      return reviewObj;
    }
  }

  /**
   * Get all reviews submitted for a specific service request.
   */
  static async getReviewsForServiceRequest(requestId: string) {
    if (this.isMongoConnected()) {
      return ReviewModel.find({ serviceRequestId: requestId })
        .sort({ createdAt: -1 })
        .populate('reviewerId', 'name email role profileImage')
        .populate('reviewer', 'name email role profileImage')
        .populate('revieweeId', 'name email role')
        .populate('reviewee', 'name email role');
    } else {
      return Array.from(memoryReviews.values()).filter((r: any) => {
        const sId = r.serviceRequestId?._id || r.serviceRequestId?.id || r.serviceRequestId;
        return sId === requestId;
      });
    }
  }

  /**
   * Admin: Get all service requests.
   */
  static async adminGetAllRequests() {
    if (this.isMongoConnected()) {
      return ServiceRequestModel.find()
        .sort({ createdAt: -1 })
        .populate('requesterId', 'name email phone')
        .populate('propertyId', 'title propertyLocation')
        .populate('professionalId', 'name email phone');
    } else {
      return Array.from(memoryServiceRequests.values());
    }
  }
}
