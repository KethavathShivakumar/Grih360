import { ProfessionalProfileModel, IProfessionalProfileDocument } from '../models/professional-profile.model';
import { ServiceRequestModel } from '../models/service-request.model';
import { ReviewModel } from '../models/review.model';
import { UserModel } from '../models/user.model';
import { ServiceCategoryCode, ProfessionalVerificationStatus } from '../types/service.types';
import mongoose, { Types } from 'mongoose';

export const memoryProfessionalProfiles = new Map<string, any>();
export const memoryReviews = new Map<string, any>();

export class ProfessionalService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get professional profile by User ID (or create initial empty profile if none exists).
   */
  static async getProfileByUserId(userId: string): Promise<any> {
    if (this.isMongoConnected()) {
      let profile = await ProfessionalProfileModel.findOne({ userId }).populate('userId', 'name email phone role profileImage');
      if (!profile) {
        const user = await UserModel.findById(userId);
        profile = await ProfessionalProfileModel.create({
          userId: new Types.ObjectId(userId),
          businessName: user ? `${user.name}'s Services` : 'Home Services',
          categories: [],
          experienceYears: 1,
          rating: 0,
          reviewCount: 0,
          isAvailable: true,
          isActive: true,
          verificationStatus: 'NOT_VERIFIED',
          serviceAreas: [],
          serviceRadiusKm: 15,
          phone: user?.phone,
        });
        profile = await profile.populate('userId', 'name email phone role profileImage');
      }
      return profile;
    } else {
      let profile = memoryProfessionalProfiles.get(userId);
      if (!profile) {
        profile = {
          _id: 'mem_pro_prof_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          userId: { _id: userId, id: userId, name: 'Professional User', email: `${userId}@nivas360.com`, phone: '+919900000000', role: 'PROFESSIONAL' },
          businessName: 'Home Services Specialist',
          categories: [],
          experienceYears: 1,
          rating: 0,
          reviewCount: 0,
          isAvailable: true,
          isActive: true,
          verificationStatus: 'NOT_VERIFIED',
          serviceAreas: [],
          serviceRadiusKm: 15,
          phone: '+919900000000',
          createdAt: new Date(),
          updatedAt: new Date(),
          save: async function () {
            memoryProfessionalProfiles.set(userId, this);
            return this;
          },
          populate: async function () {
            return this;
          },
        };
        memoryProfessionalProfiles.set(userId, profile);
      }
      return profile;
    }
  }

  /**
   * Update professional profile details.
   */
  static async updateProfile(
    userId: string,
    data: {
      businessName?: string;
      categories?: ServiceCategoryCode[];
      experienceYears?: number;
      serviceAreas?: string[];
      serviceRadiusKm?: number;
      bio?: string;
      profileImage?: string;
      phone?: string;
    }
  ): Promise<any> {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) throw new Error('Failed to retrieve or create professional profile');

    if (data.businessName !== undefined) profile.businessName = data.businessName;
    if (data.categories !== undefined) profile.categories = data.categories;
    if (data.experienceYears !== undefined) profile.experienceYears = data.experienceYears;
    if (data.serviceAreas !== undefined) profile.serviceAreas = data.serviceAreas;
    if (data.serviceRadiusKm !== undefined) profile.serviceRadiusKm = data.serviceRadiusKm;
    if (data.bio !== undefined) profile.bio = data.bio;
    if (data.profileImage !== undefined) profile.profileImage = data.profileImage;
    if (data.phone !== undefined) profile.phone = data.phone;

    if (this.isMongoConnected()) {
      await profile.save();
      return (await profile.populate('userId', 'name email phone role profileImage')) as any;
    } else {
      profile.updatedAt = new Date();
      memoryProfessionalProfiles.set(userId, profile);
      return profile;
    }
  }

  /**
   * Toggle availability status for job matching.
   */
  static async toggleAvailability(userId: string, isAvailable: boolean): Promise<any> {
    const profile = await this.getProfileByUserId(userId);
    profile.isAvailable = isAvailable;
    if (this.isMongoConnected()) {
      await profile.save();
    } else {
      memoryProfessionalProfiles.set(userId, profile);
    }
    return profile;
  }

  /**
   * Get real dashboard metrics for professional.
   */
  static async getDashboardStats(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    if (this.isMongoConnected()) {
      const [assigned, accepted, inProgress, completed, total] = await Promise.all([
        ServiceRequestModel.countDocuments({ professionalId: userId, status: 'ASSIGNED' }),
        ServiceRequestModel.countDocuments({ professionalId: userId, status: 'ACCEPTED' }),
        ServiceRequestModel.countDocuments({ professionalId: userId, status: 'IN_PROGRESS' }),
        ServiceRequestModel.countDocuments({ professionalId: userId, status: 'COMPLETED' }),
        ServiceRequestModel.countDocuments({ professionalId: userId }),
      ]);

      const recentRequests = await ServiceRequestModel.find({ professionalId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('requesterId', 'name phone email')
        .populate('propertyId', 'title propertyLocation');

      return {
        profile,
        stats: {
          pendingAssignments: assigned,
          acceptedJobs: accepted,
          activeJobs: inProgress,
          completedJobs: completed,
          totalJobs: total,
          rating: profile.rating,
          reviewCount: profile.reviewCount,
          isAvailable: profile.isAvailable,
          verificationStatus: profile.verificationStatus,
        },
        recentRequests,
      };
    } else {
      const { memoryServiceRequests } = require('./service-request.service');
      const allReqs: any[] = Array.from(memoryServiceRequests.values()).filter(
        (r: any) =>
          r.professionalId === userId ||
          r.professionalId?._id === userId ||
          (typeof r.professionalId === 'object' && r.professionalId && (r.professionalId.id === userId || r.professionalId._id === userId))
      );

      const assigned = allReqs.filter((r) => r.status === 'ASSIGNED').length;
      const accepted = allReqs.filter((r) => r.status === 'ACCEPTED').length;
      const inProgress = allReqs.filter((r) => r.status === 'IN_PROGRESS').length;
      const completed = allReqs.filter((r) => r.status === 'COMPLETED').length;

      return {
        profile,
        stats: {
          pendingAssignments: assigned,
          acceptedJobs: accepted,
          activeJobs: inProgress,
          completedJobs: completed,
          totalJobs: allReqs.length,
          rating: profile.rating,
          reviewCount: profile.reviewCount,
          isAvailable: profile.isAvailable,
          verificationStatus: profile.verificationStatus,
        },
        recentRequests: allReqs.slice(0, 5),
      };
    }
  }

  /**
   * Get requests assigned to or handled by professional.
   */
  static async getAssignedRequests(userId: string, status?: string) {
    if (this.isMongoConnected()) {
      const query: any = { professionalId: userId };
      if (status) query.status = status;
      return ServiceRequestModel.find(query)
        .sort({ createdAt: -1 })
        .populate('requesterId', 'name phone email')
        .populate('propertyId', 'title propertyLocation');
    } else {
      const { memoryServiceRequests } = require('./service-request.service');
      let reqs: any[] = Array.from(memoryServiceRequests.values()).filter((r: any) => {
        const proId = r.professionalId?._id || r.professionalId?.id || r.professionalId;
        return proId === userId;
      });
      if (status) {
        reqs = reqs.filter((r) => r.status === status);
      }
      return reqs;
    }
  }

  /**
   * Recalculate average rating and total review count from real Review records.
   */
  static async recalculateRating(userId: string) {
    if (this.isMongoConnected()) {
      const reviews = await ReviewModel.find({ targetType: 'PROFESSIONAL', targetId: userId });
      const count = reviews.length;
      let avg = 0;
      if (count > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        avg = Math.round((sum / count) * 10) / 10;
      }

      await ProfessionalProfileModel.findOneAndUpdate({ userId }, { rating: avg, reviewCount: count });
    } else {
      const reviews: any[] = Array.from(memoryReviews.values()).filter(
        (r: any) => r.targetType === 'PROFESSIONAL' && (r.targetId === userId || r.targetId?._id === userId)
      );
      const count = reviews.length;
      let avg = 0;
      if (count > 0) {
        const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
        avg = Math.round((sum / count) * 10) / 10;
      }
      const profile = await this.getProfileByUserId(userId);
      if (profile) {
        profile.rating = avg;
        profile.reviewCount = count;
        memoryProfessionalProfiles.set(userId, profile);
      }
    }
  }

  /**
   * Get all reviews for a professional.
   */
  static async getReviewsForProfessional(userId: string) {
    if (this.isMongoConnected()) {
      return ReviewModel.find({ targetType: 'PROFESSIONAL', targetId: userId })
        .sort({ createdAt: -1 })
        .populate('reviewerId', 'name profileImage');
    } else {
      return Array.from(memoryReviews.values()).filter(
        (r: any) => r.targetType === 'PROFESSIONAL' && (r.targetId === userId || r.targetId?._id === userId)
      );
    }
  }

  /**
   * Admin: get all professional profiles.
   */
  static async adminGetAllProfessionals() {
    if (this.isMongoConnected()) {
      return ProfessionalProfileModel.find()
        .populate('userId', 'name email phone role profileImage')
        .sort({ createdAt: -1 });
    } else {
      return Array.from(memoryProfessionalProfiles.values());
    }
  }

  /**
   * Admin: update verification status.
   */
  static async adminVerifyProfessional(profileId: string, status: ProfessionalVerificationStatus) {
    if (this.isMongoConnected()) {
      const profile = await ProfessionalProfileModel.findById(profileId);
      if (!profile) throw new Error('Professional profile not found');
      profile.verificationStatus = status;
      await profile.save();
      return profile;
    } else {
      let target: any = null;
      for (const p of memoryProfessionalProfiles.values()) {
        if (p._id === profileId || p.id === profileId) {
          target = p;
          break;
        }
      }
      if (!target && memoryProfessionalProfiles.size > 0) {
        target = Array.from(memoryProfessionalProfiles.values())[0];
      }
      if (!target) throw new Error('Professional profile not found');
      target.verificationStatus = status;
      return target;
    }
  }

  /**
   * Admin: activate or deactivate professional.
   */
  static async adminToggleStatus(profileId: string, isActive: boolean) {
    if (this.isMongoConnected()) {
      const profile = await ProfessionalProfileModel.findById(profileId);
      if (!profile) throw new Error('Professional profile not found');
      profile.isActive = isActive;
      await profile.save();
      return profile;
    } else {
      let target: any = null;
      for (const p of memoryProfessionalProfiles.values()) {
        if (p._id === profileId || p.id === profileId) {
          target = p;
          break;
        }
      }
      if (!target) throw new Error('Professional profile not found');
      target.isActive = isActive;
      return target;
    }
  }
}
