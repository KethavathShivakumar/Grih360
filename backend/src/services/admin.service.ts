import mongoose from 'mongoose';
import {
  UserModel,
  PropertyModel,
  ApplicationModel,
  RentalModel,
  RentalVerificationModel,
  ProfessionalProfileModel,
  ServiceRequestModel,
  NotificationModel,
} from '../models';
import { memoryUsers } from './auth.service';
import { memoryProperties } from './property.service';
import { memoryApplications } from './application.service';
import { memoryRentals } from './rental.service';
import { memoryVerifications } from './verification.service';
import { memoryProfessionalProfiles } from './professional.service';
import { memoryServiceRequests } from './service-request.service';
import { memoryNotifications } from './notification.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { PersistentStore } from '../config/persistent-store';

export class AdminService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * System Dashboard Statistics & Metrics
   */
  static async getDashboardStats() {
    let users = { total: 0, tenants: 0, owners: 0, professionals: 0, admins: 0 };
    let properties = { total: 0, available: 0, occupied: 0, inactive: 0 };
    let applications = { total: 0, submitted: 0, underReview: 0, verificationPending: 0, approved: 0, rejected: 0 };
    let rentals = { total: 0, pending: 0, active: 0, completed: 0, terminated: 0 };
    let verifications = { total: 0, pending: 0, underReview: 0, verified: 0, rejected: 0 };
    let services = { total: 0, requested: 0, matching: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 };
    let professionals = { total: 0, active: 0, inactive: 0, verified: 0, pendingVerification: 0 };

    if (AdminService.isMongoConnected()) {
      try {
        const [uList, pList, aList, rList, vList, sList, proList] = await Promise.all([
          UserModel.find().lean(),
          PropertyModel.find().lean(),
          ApplicationModel.find().lean(),
          RentalModel.find().lean(),
          RentalVerificationModel.find().lean(),
          ServiceRequestModel.find().lean(),
          ProfessionalProfileModel.find().lean(),
        ]);

        users.total = uList.length;
        users.tenants = uList.filter((u: any) => u.role === 'TENANT').length;
        users.owners = uList.filter((u: any) => u.role === 'OWNER').length;
        users.professionals = uList.filter((u: any) => u.role === 'PROFESSIONAL').length;
        users.admins = uList.filter((u: any) => u.role === 'ADMIN').length;

        properties.total = pList.length;
        properties.available = pList.filter((p: any) => (p.availabilityStatus || p.status) === 'VACANT' || (p.availabilityStatus || p.status) === 'AVAILABLE' || p.isListed).length;
        properties.occupied = pList.filter((p: any) => (p.availabilityStatus || p.status) === 'RENTED' || (p.availabilityStatus || p.status) === 'OCCUPIED').length;
        properties.inactive = pList.filter((p: any) => !p.isListed || (p.availabilityStatus || p.status) === 'REMOVED' || (p.availabilityStatus || p.status) === 'INACTIVE').length;

        applications.total = aList.length;
        applications.submitted = aList.filter((a: any) => a.status === 'SUBMITTED').length;
        applications.underReview = aList.filter((a: any) => a.status === 'UNDER_REVIEW').length;
        applications.verificationPending = aList.filter((a: any) => a.status === 'VERIFICATION_PENDING' || a.status === 'VERIFICATION_REQUIRED').length;
        applications.approved = aList.filter((a: any) => a.status === 'APPROVED').length;
        applications.rejected = aList.filter((a: any) => a.status === 'REJECTED').length;

        rentals.total = rList.length;
        rentals.pending = rList.filter((r: any) => r.status === 'DRAFT' || r.status === 'REVIEW').length;
        rentals.active = rList.filter((r: any) => r.status === 'ACTIVE' || r.status === 'CONFIRMED').length;
        rentals.completed = rList.filter((r: any) => r.status === 'EXPIRED').length;
        rentals.terminated = rList.filter((r: any) => r.status === 'TERMINATED').length;

        verifications.total = vList.length;
        verifications.pending = vList.filter((v: any) => v.status === 'PENDING').length;
        verifications.underReview = vList.filter((v: any) => v.status === 'UNDER_REVIEW').length;
        verifications.verified = vList.filter((v: any) => v.status === 'VERIFIED').length;
        verifications.rejected = vList.filter((v: any) => v.status === 'REJECTED').length;

        services.total = sList.length;
        services.requested = sList.filter((s: any) => s.status === 'REQUESTED').length;
        services.matching = sList.filter((s: any) => s.status === 'MATCHING').length;
        services.assigned = sList.filter((s: any) => s.status === 'ASSIGNED' || s.status === 'ACCEPTED').length;
        services.inProgress = sList.filter((s: any) => s.status === 'IN_PROGRESS').length;
        services.completed = sList.filter((s: any) => s.status === 'COMPLETED').length;
        services.cancelled = sList.filter((s: any) => s.status === 'CANCELLED' || s.status === 'REJECTED').length;

        professionals.total = proList.length;
        professionals.active = proList.filter((p: any) => p.isActive).length;
        professionals.inactive = proList.filter((p: any) => !p.isActive).length;
        professionals.verified = proList.filter((p: any) => p.verificationStatus === 'VERIFIED').length;
        professionals.pendingVerification = proList.filter((p: any) => p.verificationStatus === 'PENDING').length;

        const recentActivity = await AuditService.getLogs({ limit: 10 });

        return {
          users,
          properties,
          applications,
          rentals,
          verifications,
          services,
          professionals,
          recentActivity,
        };
      } catch (err) {
        console.warn('DB stats failed, falling back to memory stats:', err);
      }
    }

    // Persistent fallback calculation
    const allUsers = PersistentStore.loadCollection('users');
    users.total = allUsers.length;
    users.tenants = allUsers.filter((u: any) => u.role === 'TENANT').length;
    users.owners = allUsers.filter((u: any) => u.role === 'OWNER').length;
    users.professionals = allUsers.filter((u: any) => u.role === 'PROFESSIONAL').length;
    users.admins = allUsers.filter((u: any) => u.role === 'ADMIN').length;

    const allProps = PersistentStore.loadCollection('properties');
    properties.total = allProps.length;
    properties.available = allProps.filter((p: any) => (p.availabilityStatus || p.status) === 'VACANT' || (p.availabilityStatus || p.status) === 'AVAILABLE' || p.isListed).length;
    properties.occupied = allProps.filter((p: any) => (p.availabilityStatus || p.status) === 'RENTED' || (p.availabilityStatus || p.status) === 'OCCUPIED').length;
    properties.inactive = allProps.filter((p: any) => !p.isListed || (p.availabilityStatus || p.status) === 'REMOVED' || (p.availabilityStatus || p.status) === 'INACTIVE').length;

    const allApps = PersistentStore.loadCollection('applications');
    applications.total = allApps.length;
    applications.submitted = allApps.filter((a: any) => a.status === 'SUBMITTED').length;
    applications.underReview = allApps.filter((a: any) => a.status === 'UNDER_REVIEW').length;
    applications.verificationPending = allApps.filter((a: any) => a.status === 'VERIFICATION_PENDING' || a.status === 'VERIFICATION_REQUIRED').length;
    applications.approved = allApps.filter((a: any) => a.status === 'APPROVED').length;
    applications.rejected = allApps.filter((a: any) => a.status === 'REJECTED').length;

    const allRentals = PersistentStore.loadCollection('rentals');
    rentals.total = allRentals.length;
    rentals.pending = allRentals.filter((r: any) => r.status === 'DRAFT' || r.status === 'REVIEW').length;
    rentals.active = allRentals.filter((r: any) => r.status === 'ACTIVE' || r.status === 'CONFIRMED').length;
    rentals.completed = allRentals.filter((r: any) => r.status === 'EXPIRED').length;
    rentals.terminated = allRentals.filter((r: any) => r.status === 'TERMINATED').length;

    const allVerifs = PersistentStore.loadCollection('verifications');
    verifications.total = allVerifs.length;
    verifications.pending = allVerifs.filter((v: any) => v.status === 'PENDING').length;
    verifications.underReview = allVerifs.filter((v: any) => v.status === 'UNDER_REVIEW').length;
    verifications.verified = allVerifs.filter((v: any) => v.status === 'VERIFIED').length;
    verifications.rejected = allVerifs.filter((v: any) => v.status === 'REJECTED').length;

    const allReqs = PersistentStore.loadCollection('service_requests');
    services.total = allReqs.length;
    services.requested = allReqs.filter((s: any) => s.status === 'REQUESTED').length;
    services.matching = allReqs.filter((s: any) => s.status === 'MATCHING').length;
    services.assigned = allReqs.filter((s: any) => s.status === 'ASSIGNED' || s.status === 'ACCEPTED').length;
    services.inProgress = allReqs.filter((s: any) => s.status === 'IN_PROGRESS').length;
    services.completed = allReqs.filter((s: any) => s.status === 'COMPLETED').length;
    services.cancelled = allReqs.filter((s: any) => s.status === 'CANCELLED' || s.status === 'REJECTED').length;

    const allPros = PersistentStore.loadCollection('professional_profiles');
    professionals.total = allPros.length;
    professionals.active = allPros.filter((p: any) => p.isActive).length;
    professionals.inactive = allPros.filter((p: any) => !p.isActive).length;
    professionals.verified = allPros.filter((p: any) => p.verificationStatus === 'VERIFIED').length;
    professionals.pendingVerification = allPros.filter((p: any) => p.verificationStatus === 'PENDING').length;

    const recentActivity = await AuditService.getLogs({ limit: 10 });

    return {
      users,
      properties,
      applications,
      rentals,
      verifications,
      services,
      professionals,
      recentActivity,
    };
  }

  /**
   * User Management
   */
  static async getUsers(options?: { search?: string; role?: string; isActive?: boolean; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.role) query.role = options.role;
        if (options?.isActive !== undefined) query.isActive = options.isActive;
        if (options?.search) {
          const s = new RegExp(options.search, 'i');
          query.$or = [{ name: s }, { email: s }, { phone: s }];
        }
        const total = await UserModel.countDocuments(query);
        const users = await UserModel.find(query)
          .select('-passwordHash')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, users };
      } catch (err) {
        console.warn('DB getUsers failed, falling back to memory store:', err);
      }
    }

    let list = PersistentStore.loadCollection('users');
    if (options?.role) list = list.filter((u: any) => u.role === options.role);
    if (options?.isActive !== undefined) list = list.filter((u: any) => u.isActive === options.isActive);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((u: any) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q));
    }
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map((u: any) => {
      const copy = { ...u };
      delete copy.passwordHash;
      return copy;
    });
    return { total, page, limit, users: paginated };
  }

  static async getUserById(userId: string) {
    let user: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        user = await UserModel.findById(userId).select('-passwordHash').lean();
      } catch (err) {
        console.warn('DB getUserById failed:', err);
      }
    }
    if (!user) {
      user = memoryUsers.get(userId);
      if (user) {
        user = { ...user };
        delete user.passwordHash;
      }
    }
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }

  static async updateUserStatus(userId: string, isActive: boolean, adminUser: any) {
    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        updated = await UserModel.findByIdAndUpdate(userId, { isActive }, { new: true }).select('-passwordHash').lean();
      } catch (err) {
        console.warn('DB updateUserStatus failed:', err);
      }
    }
    if (!updated) {
      const memUser = memoryUsers.get(userId);
      if (memUser) {
        memUser.isActive = isActive;
        memUser.updatedAt = new Date();
        memoryUsers.set(userId, memUser);
        updated = { ...memUser };
        delete updated.passwordHash;
      }
    }

    if (!updated) throw { statusCode: 404, message: 'User not found' };

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'USER_STATUS_CHANGE',
      entityType: 'USER',
      entityId: userId,
      metadata: { targetEmail: updated.email, isActive },
    });

    return updated;
  }

  static async updateUserRole(userId: string, newRole: string, adminUser: any) {
    const validRoles = ['TENANT', 'OWNER', 'PROFESSIONAL', 'ADMIN'];
    if (!validRoles.includes(newRole)) {
      throw { statusCode: 400, message: 'Invalid role specified' };
    }

    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        updated = await UserModel.findByIdAndUpdate(userId, { role: newRole }, { new: true }).select('-passwordHash').lean();
      } catch (err) {
        console.warn('DB updateUserRole failed:', err);
      }
    }
    if (!updated) {
      const memUser = memoryUsers.get(userId);
      if (memUser) {
        memUser.role = newRole;
        memUser.updatedAt = new Date();
        memoryUsers.set(userId, memUser);
        updated = { ...memUser };
        delete updated.passwordHash;
      }
    }

    if (!updated) throw { statusCode: 404, message: 'User not found' };

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'USER_ROLE_CHANGE',
      entityType: 'USER',
      entityId: userId,
      metadata: { targetEmail: updated.email, newRole },
    });

    return updated;
  }

  /**
   * Property Management & Moderation
   */
  static async getProperties(options?: { search?: string; status?: string; city?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.status) query.$or = [{ availabilityStatus: options.status }, { status: options.status }];
        if (options?.city) query['propertyLocation.city'] = new RegExp(options.city, 'i');
        if (options?.search) {
          const s = new RegExp(options.search, 'i');
          query.$or = [{ title: s }, { 'propertyLocation.address': s }, { 'propertyLocation.locality': s }];
        }
        const total = await PropertyModel.countDocuments(query);
        const properties = await PropertyModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, properties };
      } catch (err) {
        console.warn('DB getProperties failed:', err);
      }
    }

    let list = PersistentStore.loadCollection('properties');
    if (options?.status) list = list.filter((p: any) => (p.availabilityStatus || p.status) === options.status);
    if (options?.city) list = list.filter((p: any) => (p.propertyLocation?.city || p.location?.city)?.toLowerCase().includes(options.city!.toLowerCase()));
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (p: any) => p.title?.toLowerCase().includes(q) || (p.propertyLocation?.address || p.location?.address)?.toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { total, page, limit, properties: paginated };
  }

  static async getPropertyById(propertyId: string) {
    let prop: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        prop = await PropertyModel.findById(propertyId).populate('ownerId', '-passwordHash').lean();
      } catch (err) {
        console.warn('DB getPropertyById failed:', err);
      }
    }
    if (!prop) prop = memoryProperties.get(propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    if (prop.ownerId && typeof prop.ownerId === 'string') {
      try {
        prop.owner = await AdminService.getUserById(prop.ownerId);
      } catch (e) {}
    } else if (prop.ownerId && typeof prop.ownerId === 'object') {
      prop.owner = prop.ownerId;
    }
    return prop;
  }

  static async updatePropertyStatus(propertyId: string, status: string, adminUser: any) {
    const validStatuses = ['VACANT', 'AVAILABLE', 'ACTIVE', 'INACTIVE', 'RENTED', 'OCCUPIED', 'FLAGGED', 'REMOVED'];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid property status' };
    }

    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        updated = await PropertyModel.findByIdAndUpdate(propertyId, { availabilityStatus: status, isListed: status !== 'REMOVED' && status !== 'INACTIVE' }, { new: true }).lean();
      } catch (err) {
        console.warn('DB updatePropertyStatus failed:', err);
      }
    }
    if (!updated) {
      const memProp = memoryProperties.get(propertyId);
      if (memProp) {
        memProp.availabilityStatus = status;
        memProp.status = status;
        memProp.isListed = status !== 'REMOVED' && status !== 'INACTIVE';
        memProp.updatedAt = new Date();
        memoryProperties.set(propertyId, memProp);
        updated = { ...memProp };
      }
    }

    if (!updated) throw { statusCode: 404, message: 'Property not found' };

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'PROPERTY_MODERATION',
      entityType: 'PROPERTY',
      entityId: propertyId,
      metadata: { title: updated.title, newStatus: status },
    });

    return updated;
  }

  /**
   * Application Management
   */
  static async getApplications(options?: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.status) query.status = options.status;
        const total = await ApplicationModel.countDocuments(query);
        const applications = await ApplicationModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, applications };
      } catch (err) {
        console.warn('DB getApplications failed:', err);
      }
    }

    let list = PersistentStore.loadCollection('applications');
    if (options?.status) list = list.filter((a: any) => a.status === options.status);
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { total, page, limit, applications: paginated };
  }

  static async getApplicationById(id: string) {
    let appObj: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        appObj = await ApplicationModel.findById(id).populate('tenantId', '-passwordHash').populate('propertyId').lean();
      } catch (err) {
        console.warn('DB getApplicationById failed:', err);
      }
    }
    if (!appObj) appObj = memoryApplications.get(id);
    if (!appObj) throw { statusCode: 404, message: 'Application not found' };

    if (appObj.tenantId && typeof appObj.tenantId === 'string') {
      try {
        appObj.tenant = await AdminService.getUserById(appObj.tenantId);
      } catch (e) {}
    } else if (appObj.tenantId && typeof appObj.tenantId === 'object') {
      appObj.tenant = appObj.tenantId;
    }

    if (appObj.propertyId && typeof appObj.propertyId === 'string') {
      try {
        appObj.property = await AdminService.getPropertyById(appObj.propertyId);
      } catch (e) {}
    } else if (appObj.propertyId && typeof appObj.propertyId === 'object') {
      appObj.property = appObj.propertyId;
    }

    return appObj;
  }

  /**
   * Rental Management
   */
  static async getRentals(options?: { status?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.status) query.status = options.status;
        const total = await RentalModel.countDocuments(query);
        const rentals = await RentalModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, rentals };
      } catch (err) {
        console.warn('DB getRentals failed:', err);
      }
    }

    let list = PersistentStore.loadCollection('rentals');
    if (options?.status) list = list.filter((r: any) => r.status === options.status);
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { total, page, limit, rentals: paginated };
  }

  static async getRentalById(id: string) {
    let rental: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        rental = await RentalModel.findById(id)
          .populate('tenantId', '-passwordHash')
          .populate('ownerId', '-passwordHash')
          .populate('propertyId')
          .lean();
      } catch (err) {
        console.warn('DB getRentalById failed:', err);
      }
    }
    if (!rental) rental = memoryRentals.get(id);
    if (!rental) throw { statusCode: 404, message: 'Rental record not found' };

    if (rental.tenantId && typeof rental.tenantId === 'string') {
      try {
        rental.tenant = await AdminService.getUserById(rental.tenantId);
      } catch (e) {}
    } else if (rental.tenantId && typeof rental.tenantId === 'object') {
      rental.tenant = rental.tenantId;
    }

    if (rental.ownerId && typeof rental.ownerId === 'string') {
      try {
        rental.owner = await AdminService.getUserById(rental.ownerId);
      } catch (e) {}
    } else if (rental.ownerId && typeof rental.ownerId === 'object') {
      rental.owner = rental.ownerId;
    }

    if (rental.propertyId && typeof rental.propertyId === 'string') {
      try {
        rental.property = await AdminService.getPropertyById(rental.propertyId);
      } catch (e) {}
    } else if (rental.propertyId && typeof rental.propertyId === 'object') {
      rental.property = rental.propertyId;
    }

    return rental;
  }

  /**
   * Verification Management
   */
  static async getVerifications(options?: { status?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.status) query.status = options.status;
        const total = await RentalVerificationModel.countDocuments(query);
        const verifications = await RentalVerificationModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, verifications };
      } catch (err) {
        console.warn('DB getVerifications failed:', err);
      }
    }

    let list = Array.from(memoryVerifications.values());
    if (options?.status) list = list.filter((v: any) => v.status === options.status);
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { total, page, limit, verifications: paginated };
  }

  static async getVerificationById(id: string) {
    let verif: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        verif = await RentalVerificationModel.findById(id).lean();
      } catch (err) {
        console.warn('DB getVerificationById failed:', err);
      }
    }
    if (!verif) verif = memoryVerifications.get(id);
    if (!verif) throw { statusCode: 404, message: 'Verification record not found' };
    return verif;
  }

  static async updateVerificationStatus(id: string, status: string, adminUser: any, rejectionReason?: string) {
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid verification status' };
    }

    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        const payload: any = { status, reviewedBy: adminUser.userId || adminUser.id, reviewedAt: new Date() };
        if (rejectionReason) payload.rejectionReason = rejectionReason;
        updated = await RentalVerificationModel.findByIdAndUpdate(id, payload, { new: true }).lean();
      } catch (err) {
        console.warn('DB updateVerificationStatus failed:', err);
      }
    }
    if (!updated) {
      const memVerif = memoryVerifications.get(id);
      if (memVerif) {
        memVerif.status = status;
        memVerif.reviewedBy = adminUser.userId || adminUser.id;
        memVerif.reviewedAt = new Date();
        if (rejectionReason) memVerif.rejectionReason = rejectionReason;
        memoryVerifications.set(id, memVerif);
        updated = { ...memVerif };
      }
    }

    if (!updated) throw { statusCode: 404, message: 'Verification record not found' };

    // Also update tenant's User identityVerificationStatus if tenantId is attached
    if (updated.tenantId) {
      if (AdminService.isMongoConnected()) {
        try {
          await UserModel.findByIdAndUpdate(updated.tenantId, { identityVerificationStatus: status });
        } catch (_) {}
      } else {
        const tUser = memoryUsers.get(updated.tenantId);
        if (tUser) {
          tUser.identityVerificationStatus = status;
          memoryUsers.set(updated.tenantId, tUser);
        }
      }

      await NotificationService.createNotification({
        recipientId: updated.tenantId,
        title: `Identity Verification ${status}`,
        message:
          status === 'VERIFIED'
            ? 'Your background verification has been approved!'
            : status === 'REJECTED'
            ? `Your verification was rejected: ${rejectionReason || 'Documents insufficient'}`
            : `Your verification status is now ${status}.`,
        type: 'SYSTEM',
        link: '/tenant/verification',
      });
    }

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'VERIFICATION_DECISION',
      entityType: 'VERIFICATION',
      entityId: id,
      metadata: { newStatus: status, tenantId: updated.tenantId, rejectionReason },
    });

    return updated;
  }

  /**
   * Professional Management
   */
  static async getProfessionals(options?: { status?: string; verificationStatus?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.status === 'active') query.isActive = true;
        if (options?.status === 'inactive') query.isActive = false;
        if (options?.verificationStatus) query.verificationStatus = options.verificationStatus;
        const total = await ProfessionalProfileModel.countDocuments(query);
        const professionals = await ProfessionalProfileModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, professionals };
      } catch (err) {
        console.warn('DB getProfessionals failed:', err);
      }
    }

    let list = Array.from(memoryProfessionalProfiles.values());
    if (options?.status === 'active') list = list.filter((p: any) => p.isActive);
    if (options?.status === 'inactive') list = list.filter((p: any) => !p.isActive);
    if (options?.verificationStatus) list = list.filter((p: any) => p.verificationStatus === options.verificationStatus);
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { total, page, limit, professionals: paginated };
  }

  static async getProfessionalById(id: string) {
    let pro: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        pro = await ProfessionalProfileModel.findById(id).populate('userId', '-passwordHash').lean();
        if (!pro) pro = await ProfessionalProfileModel.findOne({ userId: id }).populate('userId', '-passwordHash').lean();
      } catch (err) {
        console.warn('DB getProfessionalById failed:', err);
      }
    }
    if (!pro) {
      pro = memoryProfessionalProfiles.get(id);
      if (!pro) {
        pro = Array.from(memoryProfessionalProfiles.values()).find(
          (p: any) => p._id === id || p.id === id || p.userId?._id === id || p.userId?.id === id || p.userId === id
        );
      }
    }
    if (!pro) throw { statusCode: 404, message: 'Professional profile not found' };

    if (pro.userId && typeof pro.userId === 'string') {
      try {
        pro.user = await AdminService.getUserById(pro.userId);
      } catch (e) {}
    } else if (pro.userId && typeof pro.userId === 'object') {
      pro.user = pro.userId;
    }

    return pro;
  }

  static async updateProfessionalStatus(id: string, isActive: boolean, adminUser: any) {
    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        updated = await ProfessionalProfileModel.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
        if (!updated) updated = await ProfessionalProfileModel.findOneAndUpdate({ userId: id }, { isActive }, { new: true }).lean();
      } catch (err) {
        console.warn('DB updateProfessionalStatus failed:', err);
      }
    }
    if (!updated) {
      let keyToUse = id;
      let memPro = memoryProfessionalProfiles.get(id);
      if (!memPro) {
        for (const [k, v] of memoryProfessionalProfiles.entries()) {
          if (v._id === id || v.id === id || v.userId?._id === id || v.userId?.id === id || v.userId === id) {
            memPro = v;
            keyToUse = k;
            break;
          }
        }
      }
      if (memPro) {
        memPro.isActive = isActive;
        memPro.updatedAt = new Date();
        memoryProfessionalProfiles.set(keyToUse, memPro);
        updated = { ...memPro };
      }
    }

    if (!updated) throw { statusCode: 404, message: 'Professional profile not found' };

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'PROFESSIONAL_STATUS_CHANGE',
      entityType: 'PROFESSIONAL',
      entityId: id,
      metadata: { name: updated.businessName || updated.name, isActive },
    });

    return updated;
  }

  static async updateProfessionalVerification(id: string, verificationStatus: string, adminUser: any) {
    const valid = ['PENDING', 'NOT_VERIFIED', 'VERIFIED', 'REJECTED'];
    if (!valid.includes(verificationStatus)) {
      throw { statusCode: 400, message: 'Invalid verification status' };
    }

    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        updated = await ProfessionalProfileModel.findByIdAndUpdate(id, { verificationStatus }, { new: true }).lean();
        if (!updated) updated = await ProfessionalProfileModel.findOneAndUpdate({ userId: id }, { verificationStatus }, { new: true }).lean();
      } catch (err) {
        console.warn('DB updateProfessionalVerification failed:', err);
      }
    }
    if (!updated) {
      let keyToUse = id;
      let memPro = memoryProfessionalProfiles.get(id);
      if (!memPro) {
        for (const [k, v] of memoryProfessionalProfiles.entries()) {
          if (v._id === id || v.id === id || v.userId?._id === id || v.userId?.id === id || v.userId === id) {
            memPro = v;
            keyToUse = k;
            break;
          }
        }
      }
      if (memPro) {
        memPro.verificationStatus = verificationStatus;
        memPro.updatedAt = new Date();
        memoryProfessionalProfiles.set(keyToUse, memPro);
        updated = { ...memPro };
      }
    }

    if (!updated) throw { statusCode: 404, message: 'Professional profile not found' };

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'PROFESSIONAL_VERIFICATION_CHANGE',
      entityType: 'PROFESSIONAL',
      entityId: id,
      metadata: { name: updated.name, verificationStatus },
    });

    return updated;
  }

  /**
   * Service Requests Management & Reassignment
   */
  static async getServiceRequests(options?: { category?: string; status?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (options?.category) query.category = options.category;
        if (options?.status) query.status = options.status;
        const total = await ServiceRequestModel.countDocuments(query);
        const requests = await ServiceRequestModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        return { total, page, limit, requests };
      } catch (err) {
        console.warn('DB getServiceRequests failed:', err);
      }
    }

    let list = Array.from(memoryServiceRequests.values());
    if (options?.category) list = list.filter((s: any) => s.category === options.category);
    if (options?.status) list = list.filter((s: any) => s.status === options.status);
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { total, page, limit, requests: paginated };
  }

  static async getServiceRequestById(id: string) {
    let reqObj: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        reqObj = await ServiceRequestModel.findById(id)
          .populate('requesterId', '-passwordHash')
          .populate('professionalId', '-passwordHash')
          .lean();
      } catch (err) {
        console.warn('DB getServiceRequestById failed:', err);
      }
    }
    if (!reqObj) reqObj = memoryServiceRequests.get(id);
    if (!reqObj) throw { statusCode: 404, message: 'Service request not found' };

    if (reqObj.requesterId && typeof reqObj.requesterId === 'string') {
      try {
        reqObj.requester = await AdminService.getUserById(reqObj.requesterId);
      } catch (e) {}
    } else if (reqObj.requesterId && typeof reqObj.requesterId === 'object') {
      reqObj.requester = reqObj.requesterId;
    }

    if (reqObj.professionalId && typeof reqObj.professionalId === 'string') {
      try {
        reqObj.professional = await AdminService.getProfessionalById(reqObj.professionalId);
      } catch (e) {}
    } else if (reqObj.professionalId && typeof reqObj.professionalId === 'object') {
      reqObj.professional = reqObj.professionalId;
    }

    return reqObj;
  }

  static async reassignServiceRequest(requestId: string, professionalId: string, adminUser: any) {
    // 1. Get request
    const reqObj = await AdminService.getServiceRequestById(requestId);
    if (['COMPLETED', 'CANCELLED'].includes(reqObj.status)) {
      throw { statusCode: 400, message: `Cannot reassign service request in state ${reqObj.status}` };
    }

    // 2. Get target professional
    const pro = await AdminService.getProfessionalById(professionalId);
    if (!pro.isActive) {
      throw { statusCode: 400, message: 'Target professional is not active' };
    }

    // 3. Update request assignment
    let updated: any = null;
    if (AdminService.isMongoConnected()) {
      try {
        updated = await ServiceRequestModel.findByIdAndUpdate(
          requestId,
          {
            professionalId: pro.userId || pro.id || pro._id,
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
          { new: true }
        ).lean();
      } catch (err) {
        console.warn('DB reassignServiceRequest failed:', err);
      }
    }

    if (!updated) {
      reqObj.professionalId = pro.userId || pro.id || pro._id;
      reqObj.status = 'ASSIGNED';
      reqObj.assignedAt = new Date();
      memoryServiceRequests.set(requestId, reqObj);
      updated = { ...reqObj };
    }

    // 4. Notify Professional
    const proUserId = (pro.userId || pro.id || pro._id).toString();
    await NotificationService.createNotification({
      recipientId: proUserId,
      title: 'New Service Job Assigned',
      message: `Admin has assigned you to service request for ${updated.category}.`,
      type: 'SERVICE',
      link: `/professional/requests/${requestId}`,
    });

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'SERVICE_REASSIGNMENT',
      entityType: 'SERVICE_REQUEST',
      entityId: requestId,
      metadata: { category: updated.category, targetProfessional: pro.name },
    });

    return updated;
  }

  /**
   * Notifications & Announcements
   */
  static async getNotifications() {
    if (AdminService.isMongoConnected()) {
      try {
        return await NotificationModel.find().sort({ createdAt: -1 }).limit(50).lean();
      } catch (err) {
        console.warn('DB getNotifications failed:', err);
      }
    }
    return Array.from(memoryNotifications.values()).slice(0, 50);
  }

  static async broadcastNotification(title: string, message: string, targetRole: string, adminUser: any) {
    let targetUsers: any[] = [];
    if (AdminService.isMongoConnected()) {
      try {
        const query: any = {};
        if (targetRole && targetRole !== 'ALL') query.role = targetRole;
        targetUsers = await UserModel.find(query).select('_id').lean();
      } catch (err) {
        console.warn('DB fetch users for broadcast failed:', err);
      }
    }

    if (targetUsers.length === 0) {
      let list = Array.from(memoryUsers.values());
      if (targetRole && targetRole !== 'ALL') list = list.filter((u: any) => u.role === targetRole);
      targetUsers = list.map((u: any) => ({ _id: u.id || u._id }));
    }

    for (const u of targetUsers) {
      await NotificationService.createNotification({
        recipientId: u._id.toString(),
        title,
        message,
        type: 'SYSTEM',
      });
    }

    await AuditService.logAction({
      actorId: adminUser.userId || adminUser.id,
      actorName: adminUser.name || 'Admin User',
      actorRole: adminUser.role || 'ADMIN',
      action: 'BROADCAST_NOTIFICATION',
      entityType: 'SYSTEM',
      entityId: 'ANNOUNCEMENT',
      metadata: { title, targetRole, count: targetUsers.length },
    });

    return { success: true, count: targetUsers.length };
  }

  /**
   * Platform Settings
   */
  private static platformSettings = {
    platformName: 'Nivas360',
    environment: process.env.NODE_ENV || 'production',
    maintenanceMode: false,
    mtaComplianceEnabled: true,
    defaultDepositCapMonths: 2,
    operatingStates: ['Telangana', 'Andhra Pradesh'],
    operatingCities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Vijayawada', 'Visakhapatnam', 'Guntur'],
    customerCareHotline: '+91 99000 36000',
    jwtExpiryDays: 7,
    requireAdminTwoFactor: true,
    backupSchedule: 'Daily at 03:00 IST',
    updatedAt: new Date().toISOString(),
  };

  static async getSettings() {
    return { ...AdminService.platformSettings };
  }

  static async updateSettings(updates: any, adminUser: any) {
    AdminService.platformSettings = {
      ...AdminService.platformSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AuditService.logAction({
      actorId: adminUser?.userId || adminUser?.id,
      actorName: adminUser?.name || 'Admin User',
      actorRole: adminUser?.role || 'ADMIN',
      action: 'PLATFORM_SETTINGS_UPDATE',
      entityType: 'SYSTEM',
      entityId: 'SETTINGS',
      metadata: updates,
    });

    return { ...AdminService.platformSettings };
  }

  static getSystemHealth() {
    return {
      status: 'HEALTHY',
      dbConnected: AdminService.isMongoConnected(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      services: {
        apiGateway: 'ONLINE',
        authService: 'ONLINE',
        propertyEngine: 'ONLINE',
        rentalContractEngine: 'ONLINE',
        homeServicesDispatcher: 'ONLINE',
        notificationBus: 'ONLINE',
      },
    };
  }
}

