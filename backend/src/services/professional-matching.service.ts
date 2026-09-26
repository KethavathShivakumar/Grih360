import { ProfessionalProfileModel } from '../models/professional-profile.model';
import { ServiceRequestModel } from '../models/service-request.model';
import { ServiceCategoryCode } from '../types/service.types';
import { NotificationService } from './notification.service';
import { memoryProfessionalProfiles } from './professional.service';
import mongoose, { Types } from 'mongoose';

export class ProfessionalMatchingService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Find active, available professionals matching category and optional city location.
   */
  static async findEligibleProfessionals(categoryCode: ServiceCategoryCode, city?: string) {
    if (this.isMongoConnected()) {
      const query: any = {
        isActive: true,
        isAvailable: true,
        categories: categoryCode,
      };

      if (city) {
        query.$or = [
          { serviceAreas: { $regex: new RegExp(city, 'i') } },
          { serviceAreas: { $size: 0 } },
        ];
      }

      return ProfessionalProfileModel.find(query)
        .sort({ rating: -1, experienceYears: -1 })
        .populate('userId', 'name email phone profileImage');
    } else {
      const allPros = Array.from(memoryProfessionalProfiles.values());
      const eligible = allPros.filter(
        (p) =>
          p.isActive !== false &&
          p.isAvailable !== false &&
          Array.isArray(p.categories) &&
          p.categories.includes(categoryCode)
      );
      return eligible;
    }
  }

  /**
   * Attempt automatic matching and assignment for a Service Request.
   */
  static async autoAssignProfessional(requestId: string): Promise<boolean> {
    const { memoryServiceRequests } = require('./service-request.service');
    let request: any = null;

    if (this.isMongoConnected()) {
      request = await ServiceRequestModel.findById(requestId);
    } else {
      request = memoryServiceRequests.get(requestId);
    }

    if (!request) return false;

    // Transition to MATCHING
    if (request.status === 'REQUESTED') {
      request.status = 'MATCHING';
      if (this.isMongoConnected()) await request.save();
    }

    if (request.status !== 'MATCHING') return false;

    const city = request.serviceLocation?.city;
    const candidates = await this.findEligibleProfessionals(request.categoryCode, city);

    if (!candidates || candidates.length === 0) {
      console.log(`[MatchingService] No active/available professionals found for request ${requestId} (${request.categoryCode}, ${city})`);
      return false;
    }

    // Select top candidate
    const selectedProProfile = candidates[0];
    const userAny = selectedProProfile.userId as any;
    const proUserId = userAny?._id ? userAny._id.toString() : (userAny?.id || userAny.toString());

    // Assign request
    if (this.isMongoConnected()) {
      request.professionalId = new Types.ObjectId(proUserId);
      request.status = 'ASSIGNED';
      await request.save();
    } else {
      request.professionalId = proUserId;
      request.status = 'ASSIGNED';
      memoryServiceRequests.set(requestId, request);
    }

    console.log(`[MatchingService] Service Request ${requestId} assigned to Professional User ${proUserId} (${selectedProProfile.businessName})`);

    // Notify Professional
    const requesterIdStr = request.requesterId?._id ? request.requesterId._id.toString() : (request.requesterId?.id || request.requesterId.toString());
    await NotificationService.createNotification({
      recipientId: proUserId,
      title: 'New Service Job Assigned',
      message: `You have been assigned a new ${request.categoryCode} service request in ${request.serviceLocation.city}.`,
      type: 'SERVICE',
      link: `/professional/requests/${request._id || request.id}`,
    });

    // Notify Requester
    await NotificationService.createNotification({
      recipientId: requesterIdStr,
      title: 'Professional Assigned',
      message: `A professional from ${selectedProProfile.businessName} has been assigned to your ${request.categoryCode} request.`,
      type: 'SERVICE',
      link: `/tenant/services/requests/${request._id || request.id}`,
    });

    return true;
  }
}
