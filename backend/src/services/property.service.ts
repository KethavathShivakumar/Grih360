import { PropertyModel, SavedPropertyModel } from '../models';
import { MoneyUtil } from '../utils/money.util';
import mongoose from 'mongoose';

export interface CreatePropertyInput {
  title: string;
  description: string;
  propertyType: string;
  rentAmount: number | string;
  depositAmount: number | string;
  bhk: number;
  bathrooms: number;
  areaSqFt: number;
  furnishing: string;
  propertyLocation: {
    address: string;
    city: string;
    district?: string;
    state: string;
    country?: string;
    pincode: string;
    locality?: string;
    sublocality?: string;
    landmark?: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number };
  };
  amenities?: string[];
  images?: any[];
}

export interface PropertyQueryFilter {
  search?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  sublocality?: string;
  placeId?: string;
  lat?: number | string;
  lng?: number | string;
  radiusKm?: number | string;
  propertyType?: string;
  bhk?: number;
  minRent?: number;
  maxRent?: number;
  furnishing?: string;
  availabilityStatus?: string;
  amenities?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}

import { PersistentStore } from '../config/persistent-store';

export const memoryProperties = new Map<string, any>();
const memorySavedProperties = new Set<string>();

// Initialize memory cache from persistent disk store
const loadedProps = PersistentStore.loadCollection('properties');
for (const p of loadedProps) {
  memoryProperties.set(p._id || p.id, p);
}

const loadedSaved = PersistentStore.loadCollection('saved_properties');
for (const s of loadedSaved) {
  memorySavedProperties.add(`${s.tenantId}:${s.propertyId}`);
}

export class PropertyService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Create Property (Owner / Admin only)
   */
  static async createProperty(ownerId: string, input: CreatePropertyInput) {
    const numericRent = MoneyUtil.parseNumericAmount(input.rentAmount);
    const numericDeposit = MoneyUtil.parseNumericAmount(input.depositAmount);

    const loc = input.propertyLocation || ({} as any);
    const lat = loc.coordinates?.lat ? Number(loc.coordinates.lat) : undefined;
    const lng = loc.coordinates?.lng ? Number(loc.coordinates.lng) : undefined;
    const normalizedLoc = {
      ...loc,
      country: loc.country || 'India',
      district: loc.district || loc.city,
      coordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
      geoPoint: lat !== undefined && lng !== undefined ? { type: 'Point', coordinates: [lng, lat] } : undefined,
    };

    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.create({
        ownerId,
        title: input.title.trim(),
        description: input.description.trim(),
        propertyType: input.propertyType,
        rentAmount: numericRent,
        depositAmount: numericDeposit,
        bhk: Number(input.bhk),
        bathrooms: Number(input.bathrooms),
        areaSqFt: Number(input.areaSqFt),
        furnishing: input.furnishing,
        propertyLocation: normalizedLoc,
        amenities: input.amenities || [],
        images: input.images || [],
        availabilityStatus: 'VACANT',
        isListed: true,
      });

      return property;
    } else {
      const id = 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const propDoc = {
        _id: id,
        id,
        ownerId,
        title: input.title.trim(),
        description: input.description.trim(),
        propertyType: input.propertyType,
        rentAmount: numericRent,
        depositAmount: numericDeposit,
        formattedRent: MoneyUtil.formatINR(numericRent) + '/mo',
        formattedDeposit: MoneyUtil.formatINR(numericDeposit),
        bhk: Number(input.bhk),
        bathrooms: Number(input.bathrooms),
        areaSqFt: Number(input.areaSqFt),
        furnishing: input.furnishing,
        propertyLocation: normalizedLoc,
        amenities: input.amenities || [],
        images: input.images || [],
        availabilityStatus: 'VACANT',
        isListed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      PersistentStore.insert('properties', propDoc);
      memoryProperties.set(id, propDoc);
      return propDoc;
    }
  }

  /**
   * Search / List Properties with Real Geographic Matching
   */
  static async searchProperties(query: PropertyQueryFilter) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

    if (PropertyService.isMongoConnected()) {
      const skip = (page - 1) * limit;
      const mongoFilter: any = { isListed: true };

      if (query.search) {
        const regex = new RegExp(query.search.trim(), 'i');
        mongoFilter.$or = [
          { title: regex },
          { description: regex },
          { 'propertyLocation.city': regex },
          { 'propertyLocation.district': regex },
          { 'propertyLocation.locality': regex },
          { 'propertyLocation.sublocality': regex },
          { 'propertyLocation.address': regex },
        ];
      }
      if (query.state) {
        mongoFilter['propertyLocation.state'] = new RegExp('^' + query.state.trim() + '$', 'i');
      }
      if (query.district) {
        const distRegex = new RegExp(query.district.trim(), 'i');
        mongoFilter.$and = mongoFilter.$and || [];
        mongoFilter.$and.push({
          $or: [
            { 'propertyLocation.district': distRegex },
            { 'propertyLocation.city': distRegex },
          ],
        });
      }
      if (query.city) {
        const cityRegex = new RegExp(query.city.trim(), 'i');
        mongoFilter.$and = mongoFilter.$and || [];
        mongoFilter.$and.push({
          $or: [
            { 'propertyLocation.city': cityRegex },
            { 'propertyLocation.district': cityRegex },
          ],
        });
      }
      if (query.locality || query.sublocality) {
        const locTerm = (query.locality || query.sublocality || '').trim();
        const locRegex = new RegExp(locTerm, 'i');
        mongoFilter.$and = mongoFilter.$and || [];
        mongoFilter.$and.push({
          $or: [
            { 'propertyLocation.locality': locRegex },
            { 'propertyLocation.sublocality': locRegex },
            { 'propertyLocation.address': locRegex },
          ],
        });
      }
      if (query.placeId) {
        mongoFilter['propertyLocation.placeId'] = query.placeId.trim();
      }
      if (
        query.lat !== undefined &&
        query.lng !== undefined &&
        !isNaN(Number(query.lat)) &&
        !isNaN(Number(query.lng))
      ) {
        const latNum = Number(query.lat);
        const lngNum = Number(query.lng);
        if (latNum !== 0 && lngNum !== 0) {
          const radiusKm = Math.min(150, Math.max(1, Number(query.radiusKm) || 35));
          const radiusRadians = radiusKm / 6378.1;
          mongoFilter['propertyLocation.geoPoint'] = {
            $geoWithin: {
              $centerSphere: [[lngNum, latNum], radiusRadians],
            },
          };
        }
      }
      if (query.propertyType) {
        mongoFilter.propertyType = query.propertyType;
      }
      if (query.bhk) {
        mongoFilter.bhk = Number(query.bhk);
      }
      if (query.furnishing) {
        mongoFilter.furnishing = query.furnishing;
      }
      if (query.availabilityStatus) {
        mongoFilter.availabilityStatus = query.availabilityStatus;
      }
      if (query.minRent !== undefined || query.maxRent !== undefined) {
        mongoFilter.rentAmount = {};
        if (query.minRent !== undefined && !isNaN(Number(query.minRent))) {
          mongoFilter.rentAmount.$gte = Number(query.minRent);
        }
        if (query.maxRent !== undefined && !isNaN(Number(query.maxRent))) {
          mongoFilter.rentAmount.$lte = Number(query.maxRent);
        }
      }

      let sortOptions: any = { createdAt: -1 };
      if (query.sort === 'rent_asc') {
        sortOptions = { rentAmount: 1 };
      } else if (query.sort === 'rent_desc') {
        sortOptions = { rentAmount: -1 };
      } else if (query.sort === 'newest') {
        sortOptions = { createdAt: -1 };
      }

      const [properties, total] = await Promise.all([
        PropertyModel.find(mongoFilter).sort(sortOptions).skip(skip).limit(limit).lean(),
        PropertyModel.countDocuments(mongoFilter),
      ]);

      const formattedProperties = properties.map((p: any) => ({
        ...p,
        id: p._id.toString(),
        formattedRent: MoneyUtil.formatINR(p.rentAmount) + '/mo',
        formattedDeposit: MoneyUtil.formatINR(p.depositAmount),
      }));

      return { properties: formattedProperties, page, limit, total };
    } else {
      let list = Array.from(memoryProperties.values()).filter((p) => p.isListed !== false);
      if (query.search) {
        const s = query.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title?.toLowerCase().includes(s) ||
            p.description?.toLowerCase().includes(s) ||
            p.propertyLocation?.city?.toLowerCase().includes(s) ||
            p.propertyLocation?.district?.toLowerCase().includes(s) ||
            p.propertyLocation?.locality?.toLowerCase().includes(s) ||
            p.propertyLocation?.sublocality?.toLowerCase().includes(s) ||
            p.propertyLocation?.address?.toLowerCase().includes(s)
        );
      }
      if (query.state) {
        const st = query.state.toLowerCase();
        list = list.filter((p) => p.propertyLocation?.state?.toLowerCase() === st);
      }
      if (query.district) {
        const dist = query.district.toLowerCase();
        list = list.filter((p) =>
          p.propertyLocation?.district?.toLowerCase().includes(dist) ||
          p.propertyLocation?.city?.toLowerCase().includes(dist)
        );
      }
      if (query.city) {
        const c = query.city.toLowerCase();
        list = list.filter((p) =>
          p.propertyLocation?.city?.toLowerCase().includes(c) ||
          p.propertyLocation?.district?.toLowerCase().includes(c)
        );
      }
      if (query.locality || query.sublocality) {
        const l = (query.locality || query.sublocality || '').toLowerCase();
        list = list.filter((p) =>
          p.propertyLocation?.locality?.toLowerCase().includes(l) ||
          p.propertyLocation?.sublocality?.toLowerCase().includes(l) ||
          p.propertyLocation?.address?.toLowerCase().includes(l)
        );
      }
      if (query.placeId) {
        list = list.filter((p) => p.propertyLocation?.placeId === query.placeId);
      }
      if (
        query.lat !== undefined &&
        query.lng !== undefined &&
        !isNaN(Number(query.lat)) &&
        !isNaN(Number(query.lng))
      ) {
        const latNum = Number(query.lat);
        const lngNum = Number(query.lng);
        const radiusKm = Number(query.radiusKm) || 35;
        list = list.filter((p) => {
          const pLat = p.propertyLocation?.coordinates?.lat;
          const pLng = p.propertyLocation?.coordinates?.lng;
          if (!pLat || !pLng) return true;
          const dLat = ((pLat - latNum) * Math.PI) / 180;
          const dLng = ((pLng - lngNum) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((latNum * Math.PI) / 180) *
              Math.cos((pLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return 6378.1 * c <= radiusKm;
        });
      }
      if (query.bhk) {
        list = list.filter((p) => p.bhk === Number(query.bhk));
      }
      if (query.propertyType) {
        list = list.filter((p) => p.propertyType === query.propertyType);
      }
      if (query.furnishing) {
        list = list.filter((p) => p.furnishing === query.furnishing);
      }
      if (query.minRent !== undefined && !isNaN(Number(query.minRent))) {
        list = list.filter((p) => p.rentAmount >= Number(query.minRent));
      }
      if (query.maxRent !== undefined && !isNaN(Number(query.maxRent))) {
        list = list.filter((p) => p.rentAmount <= Number(query.maxRent));
      }
      if (query.sort === 'rent_asc') {
        list.sort((a, b) => a.rentAmount - b.rentAmount);
      } else if (query.sort === 'rent_desc') {
        list.sort((a, b) => b.rentAmount - a.rentAmount);
      } else {
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
      const skip = (page - 1) * limit;
      const paginated = list.slice(skip, skip + limit);
      return { properties: paginated, page, limit, total: list.length };
    }
  }

  /**
   * Get Property By ID
   */
  static async getPropertyById(id: string) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(id).lean();
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property listing not found' };
      }
      return {
        ...property,
        id: (property._id as any).toString(),
        formattedRent: MoneyUtil.formatINR(property.rentAmount) + '/mo',
        formattedDeposit: MoneyUtil.formatINR(property.depositAmount),
      };
    } else {
      const property = memoryProperties.get(id);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property listing not found' };
      }
      return property;
    }
  }

  /**
   * Server-Side Ownership Enforced Update (Requirement #46)
   */
  static async updateProperty(propertyId: string, requesterUserId: string, requesterRole: string, updateData: any) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property listing not found' };
      }

      if (requesterRole !== 'ADMIN' && property.ownerId.toString() !== requesterUserId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have permission to modify this property listing' };
      }

      if (updateData.rentAmount) {
        updateData.rentAmount = MoneyUtil.parseNumericAmount(updateData.rentAmount);
      }

      Object.assign(property, updateData);
      await property.save();
      return property;
    } else {
      const property = memoryProperties.get(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property listing not found' };
      }

      if (requesterRole !== 'ADMIN' && property.ownerId !== requesterUserId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have permission to modify this property listing' };
      }

      Object.assign(property, updateData);
      memoryProperties.set(propertyId, property);
      return property;
    }
  }

  /**
   * Server-Side Ownership Enforced Delete (Requirement #46)
   */
  static async deleteProperty(propertyId: string, requesterUserId: string, requesterRole: string) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property listing not found' };
      }

      if (requesterRole !== 'ADMIN' && property.ownerId.toString() !== requesterUserId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have permission to delete this property listing' };
      }

      await PropertyModel.findByIdAndDelete(propertyId);
      return { success: true, message: 'Property listing deleted successfully' };
    } else {
      const property = memoryProperties.get(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property listing not found' };
      }

      if (requesterRole !== 'ADMIN' && property.ownerId !== requesterUserId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have permission to delete this property listing' };
      }

      memoryProperties.delete(propertyId);
      PersistentStore.delete('properties', propertyId);
      return { success: true, message: 'Property listing deleted successfully' };
    }
  }

  /**
   * Get Properties owned by authenticated user
   */
  static async getOwnerProperties(ownerId: string) {
    if (PropertyService.isMongoConnected()) {
      const properties = await PropertyModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
      return properties.map((p: any) => ({
        ...p,
        id: p._id.toString(),
        formattedRent: MoneyUtil.formatINR(p.rentAmount) + '/mo',
        formattedDeposit: MoneyUtil.formatINR(p.depositAmount),
      }));
    } else {
      return Array.from(memoryProperties.values()).filter((p) => p.ownerId === ownerId);
    }
  }

  /**
   * Save Property (Tenant only)
   */
  static async saveProperty(tenantId: string, propertyId: string) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      const existing = await SavedPropertyModel.findOne({ tenantId, propertyId });
      if (existing) return existing;
      return SavedPropertyModel.create({ tenantId, propertyId });
    } else {
      memorySavedProperties.add(`${tenantId}:${propertyId}`);
      PersistentStore.insert('saved_properties', { tenantId, propertyId, createdAt: new Date() });
      return { tenantId, propertyId, savedAt: new Date() };
    }
  }

  /**
   * Unsave Property (Tenant only)
   */
  static async unsaveProperty(tenantId: string, propertyId: string) {
    if (PropertyService.isMongoConnected()) {
      await SavedPropertyModel.findOneAndDelete({ tenantId, propertyId });
    } else {
      memorySavedProperties.delete(`${tenantId}:${propertyId}`);
      const allSaved = PersistentStore.loadCollection('saved_properties');
      PersistentStore.saveCollection('saved_properties', allSaved.filter((s: any) => !(s.tenantId === tenantId && s.propertyId === propertyId)));
    }
    return { success: true };
  }

  /**
   * Get Saved Properties for authenticated Tenant
   */
  static async getTenantSavedProperties(tenantId: string) {
    if (PropertyService.isMongoConnected()) {
      const saved = await SavedPropertyModel.find({ tenantId }).populate('propertyId').lean();
      return saved.map((s: any) => s.propertyId);
    } else {
      const savedIds = Array.from(memorySavedProperties)
        .filter((key) => key.startsWith(`${tenantId}:`))
        .map((key) => key.split(':')[1]);

      return savedIds.map((id) => memoryProperties.get(id)).filter(Boolean);
    }
  }

  /**
   * Property Image Management: Add Images (Owner / Admin)
   */
  static async addPropertyImages(propertyId: string, ownerId: string, role: string, newImages: any) {
    const rawArray = Array.isArray(newImages) ? newImages : (newImages ? [newImages] : []);
    const normalizedImages = rawArray.map((img: any) => ({
      url: img.url || img.imageUrl || img,
      caption: img.caption || '',
    }));

    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      const existingCount = property.images.length;
      const formattedNew = normalizedImages.map((img, idx) => ({
        url: img.url,
        isMain: existingCount === 0 && idx === 0,
        order: existingCount + idx,
        caption: img.caption,
      }));
      property.images.push(...(formattedNew as any));
      await property.save();
      return property;
    } else {
      const property = memoryProperties.get(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      property.images = property.images || [];
      const existingCount = property.images.length;
      const formattedNew = normalizedImages.map((img, idx) => ({
        url: img.url,
        isMain: existingCount === 0 && idx === 0,
        order: existingCount + idx,
        caption: img.caption,
      }));
      property.images.push(...formattedNew);
      memoryProperties.set(propertyId, property);
      return property;
    }
  }

  /**
   * Property Image Management: Set Main Image
   */
  static async setMainImage(propertyId: string, ownerId: string, role: string, imageIndex: number) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      if (!property.images || imageIndex < 0 || imageIndex >= property.images.length) {
        throw { statusCode: 400, code: 'INVALID_INDEX', message: 'Invalid image index' };
      }
      property.images.forEach((img: any, idx: number) => {
        img.isMain = idx === imageIndex;
      });
      await property.save();
      return property;
    } else {
      const property = memoryProperties.get(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      if (!property.images || imageIndex < 0 || imageIndex >= property.images.length) {
        throw { statusCode: 400, code: 'INVALID_INDEX', message: 'Invalid image index' };
      }
      property.images.forEach((img: any, idx: number) => {
        img.isMain = idx === imageIndex;
      });
      memoryProperties.set(propertyId, property);
      return property;
    }
  }

  /**
   * Property Image Management: Delete Image
   */
  static async deletePropertyImage(propertyId: string, ownerId: string, role: string, imageIndex: number) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      if (!property.images || imageIndex < 0 || imageIndex >= property.images.length) {
        throw { statusCode: 400, code: 'INVALID_INDEX', message: 'Invalid image index' };
      }
      const wasMain = property.images[imageIndex].isMain;
      property.images.splice(imageIndex, 1);
      if (wasMain && property.images.length > 0) {
        property.images[0].isMain = true;
      }
      await property.save();
      return property;
    } else {
      const property = memoryProperties.get(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      if (!property.images || imageIndex < 0 || imageIndex >= property.images.length) {
        throw { statusCode: 400, code: 'INVALID_INDEX', message: 'Invalid image index' };
      }
      const wasMain = property.images[imageIndex].isMain;
      property.images.splice(imageIndex, 1);
      if (wasMain && property.images.length > 0) {
        property.images[0].isMain = true;
      }
      memoryProperties.set(propertyId, property);
      return property;
    }
  }

  /**
   * Property Image Management: Reorder Images
   */
  static async reorderPropertyImages(propertyId: string, ownerId: string, role: string, reorderedImages: any[]) {
    if (PropertyService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      property.images = reorderedImages as any;
      await property.save();
      return property;
    } else {
      const property = memoryProperties.get(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      property.images = reorderedImages;
      memoryProperties.set(propertyId, property);
      return property;
    }
  }

  /**
   * Seed Default Realistic Residential Properties (Telangana & AP Tier-2/Tier-3 & Hubs)
   */
  static async seedDefaultProperties(): Promise<void> {
    const defaultProperties = [
      {
        title: '3 BHK Gated Community Apartment in Gachibowli',
        description: 'Spacious 3 BHK apartment in prime Financial District, Gachibowli. Featuring modular kitchen, 100% power backup, EV charging, 2 covered car parks, and biometric gate security under Model Tenancy Act.',
        propertyType: 'APARTMENT',
        rentAmount: 42000,
        depositAmount: 84000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1850,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: {
          address: 'Tower 4, My Home Bhooja, Financial District',
          locality: 'Gachibowli',
          sublocality: 'Financial District',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500032',
          landmark: 'Opposite Bio-Diversity Park',
          coordinates: { lat: 17.4401, lng: 78.3489 },
        },
        amenities: ['POWER_BACKUP', 'LIFT', 'COVERED_PARKING', 'SECURITY', 'GYM', 'SWIMMING_POOL', 'GAS_PIPELINE'],
        images: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', isMain: true, caption: 'Living Area' },
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', isMain: false, caption: 'Balcony View' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '2 BHK Luxury Furnished Flat near Cyber Towers',
        description: 'Walk-to-work 2 BHK modern flat near Cyber Towers, Hitec City. High-speed fiber internet ready, smart home lights, air conditioning, and clubhouse access.',
        propertyType: 'APARTMENT',
        rentAmount: 32000,
        depositAmount: 64000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1250,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: {
          address: 'Plot 18, Silicon Valley Enclave, Madhapur Road',
          locality: 'Hitec City',
          sublocality: 'Madhapur',
          city: 'Hyderabad',
          district: 'Rangareddy',
          state: 'Telangana',
          country: 'India',
          pincode: '500081',
          landmark: 'Near Cyber Towers Metro Station',
          coordinates: { lat: 17.4474, lng: 78.3762 },
        },
        amenities: ['POWER_BACKUP', 'LIFT', 'PARKING', 'SECURITY', 'AIR_CONDITIONING', 'FIBER_INTERNET'],
        images: [
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', isMain: true, caption: 'Master Bedroom' },
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', isMain: false, caption: 'Kitchen' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '4 BHK Independent Luxury Villa in Banjara Hills Road No. 12',
        description: 'Exclusive 4 BHK private villa with private landscaped garden, home theatre room, servant quarters, and solar water heater in peaceful Banjara Hills enclave.',
        propertyType: 'VILLA',
        rentAmount: 75000,
        depositAmount: 200000,
        bhk: 4,
        bathrooms: 4,
        areaSqFt: 3600,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: {
          address: 'Road No. 12, MLA Colony, Banjara Hills',
          locality: 'Banjara Hills',
          sublocality: 'Road No. 12',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500034',
          landmark: 'Near KBR Park Gate',
          coordinates: { lat: 17.4156, lng: 78.4357 },
        },
        amenities: ['PRIVATE_GARDEN', 'SERVANT_QUARTERS', 'SECURITY', 'COVERED_PARKING', 'POWER_BACKUP', 'SOLAR_HEATER'],
        images: [
          { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', isMain: true, caption: 'Villa Facade' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', isMain: false, caption: 'Private Courtyard' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Semi-Furnished Flat near Botanical Garden',
        description: 'Freshly painted 3 BHK facing Botanical Gardens with expansive balcony, wooden wardrobes, piped gas, and 24-hour Kaveri/Manjeera water supply.',
        propertyType: 'APARTMENT',
        rentAmount: 34000,
        depositAmount: 68000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1650,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Block C, Sri Ram Heights, Raghavendra Colony',
          locality: 'Kondapur',
          sublocality: 'Raghavendra Colony',
          city: 'Hyderabad',
          district: 'Rangareddy',
          state: 'Telangana',
          country: 'India',
          pincode: '500084',
          landmark: 'Opposite Botanical Garden Gate 2',
          coordinates: { lat: 17.4622, lng: 78.3568 },
        },
        amenities: ['LIFT', 'PARKING', 'WATER_SUPPLY_24X7', 'SECURITY', 'BALCONY', 'CHILDRENS_PLAY_AREA'],
        images: [
          { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', isMain: true, caption: 'Balcony' },
          { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', isMain: false, caption: 'Kitchen' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Independent Builder Floor in Subedari, Hanamkonda',
        description: 'Well-ventilated 3 BHK independent floor close to Kakatiya University and Subedari Collectorate. Peaceful residential zone with borewell and municipal water, covered parking, and wide 40ft road.',
        propertyType: 'INDEPENDENT_HOUSE',
        rentAmount: 16500,
        depositAmount: 33000,
        bhk: 3,
        bathrooms: 2,
        areaSqFt: 1500,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'House No. 2-5-184, Subedari Main Road',
          locality: 'Subedari',
          sublocality: 'Hanamkonda',
          city: 'Warangal',
          district: 'Warangal',
          state: 'Telangana',
          country: 'India',
          pincode: '506001',
          landmark: 'Near Kakatiya University Cross Road',
          coordinates: { lat: 17.9942, lng: 79.5638 },
        },
        amenities: ['COVERED_PARKING', 'BOREWELL_WATER', 'MUNICIPAL_WATER', 'CCTV', 'BALCONY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', isMain: true, caption: 'Front Elevation' },
          { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800', isMain: false, caption: 'Living Space' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '2 BHK Premium Apartment in Nakkalagutta',
        description: 'Heart of Hanamkonda city, 2 minutes from Asian Sridevi Mall. 2 BHK flat with lift, generator backup, dedicated stilt parking, and rainwater harvesting.',
        propertyType: 'APARTMENT',
        rentAmount: 13500,
        depositAmount: 27000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1100,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Flat 204, Balaji Residency, Nakkalagutta',
          locality: 'Nakkalagutta',
          sublocality: 'Hanamkonda',
          city: 'Warangal',
          district: 'Warangal',
          state: 'Telangana',
          country: 'India',
          pincode: '506001',
          landmark: 'Near Asian Sridevi Mall',
          coordinates: { lat: 18.0076, lng: 79.5750 },
        },
        amenities: ['LIFT', 'POWER_BACKUP', 'STILT_PARKING', 'RAINWATER_HARVESTING', 'SECURITY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800', isMain: true, caption: 'Apartment' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '2 BHK Independent House near Kazipet Railway Station',
        description: 'Prime residential spot near Kazipet Junction. 2 BHK home with separate utility area, spacious terrace, covered portico for car, and round-the-clock water.',
        propertyType: 'INDEPENDENT_HOUSE',
        rentAmount: 11000,
        depositAmount: 22000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1050,
        furnishing: 'UNFURNISHED',
        propertyLocation: {
          address: 'Quarter Lane 4, Railway Officers Colony',
          locality: 'Kazipet',
          sublocality: 'Railway Colony',
          city: 'Warangal',
          district: 'Warangal',
          state: 'Telangana',
          country: 'India',
          pincode: '506003',
          landmark: '500m from Kazipet Railway Junction',
          coordinates: { lat: 17.9818, lng: 79.5222 },
        },
        amenities: ['CAR_PORTICO', 'TERRACE', 'BOREWELL_WATER', 'SECURITY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', isMain: true, caption: 'Home Elevation' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Gated Villa near NIT Warangal',
        description: 'Peaceful 3 BHK gated community villa on Hunter Road near NIT Warangal. Premium vitrified tiles, 3 en-suite bathrooms, private garden, and 24x7 security guards.',
        propertyType: 'VILLA',
        rentAmount: 22000,
        depositAmount: 50000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 2200,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Villa 12, Kakatiya Enclave, Hunter Road',
          locality: 'Hunter Road',
          sublocality: 'NIT Hub',
          city: 'Warangal',
          district: 'Warangal',
          state: 'Telangana',
          country: 'India',
          pincode: '506002',
          landmark: 'Near NIT Warangal Campus',
          coordinates: { lat: 17.9622, lng: 79.5885 },
        },
        amenities: ['GATED_COMMUNITY', 'SECURITY_24X7', 'PRIVATE_GARDEN', 'PARKING', 'POWER_BACKUP'],
        images: [
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', isMain: true, caption: 'Villa' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '2 BHK Independent House in Christian Pally, Mahabubnagar',
        description: 'Independent family home in quiet residential sector of Christian Pally. Walking distance to schools, markets, and district hospital. Dedicated two-wheeler and car parking with sweet municipal water.',
        propertyType: 'INDEPENDENT_HOUSE',
        rentAmount: 11500,
        depositAmount: 23000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1150,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Plot 42, Teachers Colony, Christian Pally',
          locality: 'Christian Pally',
          sublocality: 'Teachers Colony',
          city: 'Mahabubnagar',
          district: 'Mahabubnagar',
          state: 'Telangana',
          country: 'India',
          pincode: '509001',
          landmark: 'Near Christian Pally Church',
          coordinates: { lat: 16.7420, lng: 78.0012 },
        },
        amenities: ['CAR_PORTICO', 'MUNICIPAL_WATER', 'BOREWELL_WATER', 'TERRACE'],
        images: [
          { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', isMain: true, caption: 'Front Elevation' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Family Villa near Raichur Road, Mahabubnagar',
        description: 'Modern 3 BHK independent duplex on Raichur Road. Features spacious hall, modular kitchen, open terrace, and secure compound wall.',
        propertyType: 'VILLA',
        rentAmount: 16000,
        depositAmount: 32000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1750,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Raichur Road Highway Colony',
          locality: 'Raichur Road',
          sublocality: 'Yenugonda Bypass',
          city: 'Mahabubnagar',
          district: 'Mahabubnagar',
          state: 'Telangana',
          country: 'India',
          pincode: '509001',
          landmark: 'Near Yenugonda Junction',
          coordinates: { lat: 16.7350, lng: 77.9850 },
        },
        amenities: ['GATED_COMMUNITY', 'POWER_BACKUP', 'PARKING', 'CCTV'],
        images: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', isMain: true, caption: 'Villa View' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '2 BHK Residential Flat at Clock Tower Center, Nalgonda',
        description: 'Central location flat right in the commercial and cultural hub of Nalgonda. Walkable to bus station, shopping complexes, and colleges. Lift and 24-hour Krishna water pipeline.',
        propertyType: 'APARTMENT',
        rentAmount: 10500,
        depositAmount: 21000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1000,
        furnishing: 'UNFURNISHED',
        propertyLocation: {
          address: 'Flat 102, Venkateshwara Residency, Clock Tower Road',
          locality: 'Clock Tower Center',
          sublocality: 'Main Market',
          city: 'Nalgonda',
          district: 'Nalgonda',
          state: 'Telangana',
          country: 'India',
          pincode: '508001',
          landmark: 'Opposite Old Clock Tower',
          coordinates: { lat: 17.0540, lng: 79.2670 },
        },
        amenities: ['LIFT', 'WATER_SUPPLY_24X7', 'SECURITY', 'TWO_WHEELER_PARKING'],
        images: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', isMain: true, caption: 'Apartment Hall' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Modern Apartment near Collectorate Road, Karimnagar',
        description: 'Prime Karimnagar location near District Collectorate and Mukarrampura. High-end granite flooring, modular kitchen, generator backup, and high-speed elevator.',
        propertyType: 'APARTMENT',
        rentAmount: 15500,
        depositAmount: 31000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1450,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Door No. 3-1-294, Sri Sai Enclave, Collectorate Road',
          locality: 'Collectorate Road',
          sublocality: 'Mukarrampura',
          city: 'Karimnagar',
          district: 'Karimnagar',
          state: 'Telangana',
          country: 'India',
          pincode: '505001',
          landmark: 'Adjacent to Collectorate Complex',
          coordinates: { lat: 18.4410, lng: 79.1320 },
        },
        amenities: ['LIFT', 'POWER_BACKUP', 'COVERED_PARKING', 'SECURITY', 'MUNICIPAL_WATER'],
        images: [
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', isMain: true, caption: 'Living Space' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Spacious Flat on Wyra Road, Khammam',
        description: 'Expansive 3 BHK apartment located directly on Wyra Road, Khammam. Close to prominent corporate hospitals, schools, and shopping avenues. Ample daylight, cross ventilation, and 24x7 water.',
        propertyType: 'APARTMENT',
        rentAmount: 14000,
        depositAmount: 28000,
        bhk: 3,
        bathrooms: 2,
        areaSqFt: 1350,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Flat 302, Green Meadows, Wyra Road',
          locality: 'Wyra Road',
          sublocality: 'Rotary Nagar Hub',
          city: 'Khammam',
          district: 'Khammam',
          state: 'Telangana',
          country: 'India',
          pincode: '507001',
          landmark: 'Near Mamata Hospital Flyover',
          coordinates: { lat: 17.2510, lng: 80.1550 },
        },
        amenities: ['LIFT', 'POWER_BACKUP', 'PARKING', 'SECURITY', 'BALCONY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', isMain: true, caption: 'Interior' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Independent House in Khaleelwadi, Nizamabad',
        description: 'High-demand residential neighborhood of Khaleelwadi, Nizamabad. Independent gated premises with private borewell, car parking porch, marble flooring, and puja room.',
        propertyType: 'INDEPENDENT_HOUSE',
        rentAmount: 15000,
        depositAmount: 30000,
        bhk: 3,
        bathrooms: 2,
        areaSqFt: 1400,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Plot 71, Khaleelwadi Main Road',
          locality: 'Khaleelwadi',
          sublocality: 'Subhash Nagar Zone',
          city: 'Nizamabad',
          district: 'Nizamabad',
          state: 'Telangana',
          country: 'India',
          pincode: '503001',
          landmark: 'Near Gandhi Chowk',
          coordinates: { lat: 18.6750, lng: 78.0980 },
        },
        amenities: ['CAR_PORTICO', 'BOREWELL_WATER', 'MUNICIPAL_WATER', 'TERRACE', 'CCTV'],
        images: [
          { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', isMain: true, caption: 'House View' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Sea Breeze & City View Apartment at Benz Circle',
        description: 'Luxurious 3 BHK high-rise flat on MG Road / Benz Circle junction. 24-hour Krishna river treated water, 2 high-speed lifts, gym, and CCTV surveillance.',
        propertyType: 'APARTMENT',
        rentAmount: 28000,
        depositAmount: 60000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1750,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: {
          address: 'Tower A, Krishna Heights, MG Road',
          locality: 'Benz Circle',
          sublocality: 'MG Road',
          city: 'Vijayawada',
          district: 'NTR',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '520010',
          landmark: 'Near Benz Circle Flyover',
          coordinates: { lat: 16.5012, lng: 80.6436 },
        },
        amenities: ['HIGH_SPEED_LIFTS', 'GYM', 'CCTV', 'RIVER_WATER', 'COVERED_PARKING', 'SECURITY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', isMain: true, caption: 'Living Room' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Luxury Flat in Lakshmipuram, Guntur',
        description: 'Prestigious residential enclave of Lakshmipuram, Guntur. Premium wooden work in all bedrooms, false ceiling, piped gas, and reserved basement parking.',
        propertyType: 'APARTMENT',
        rentAmount: 21000,
        depositAmount: 42000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1600,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Flat 401, Amaravati Heights, 4th Line Lakshmipuram',
          locality: 'Lakshmipuram',
          sublocality: 'Brodipet Link',
          city: 'Guntur',
          district: 'Guntur',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '522007',
          landmark: 'Near Lakshmipuram Main Junction',
          coordinates: { lat: 16.3120, lng: 80.4410 },
        },
        amenities: ['LIFT', 'POWER_BACKUP', 'COVERED_PARKING', 'SECURITY', 'PIPED_GAS'],
        images: [
          { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', isMain: true, caption: 'Interior' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '4 BHK Luxury Oceanfront Penthouse on RK Beach Road',
        description: 'Spectacular uninterrupted Bay of Bengal ocean view! 4 BHK luxury penthouse with wrap-around terrace, private elevator, VRV air conditioning, and 24/7 armed security.',
        propertyType: 'APARTMENT',
        rentAmount: 58000,
        depositAmount: 150000,
        bhk: 4,
        bathrooms: 4,
        areaSqFt: 3200,
        furnishing: 'FULLY_FURNISHED',
        propertyLocation: {
          address: 'Penthouse 1401, Sea Pearl Towers, Beach Road',
          locality: 'Beach Road',
          sublocality: 'RK Beach',
          city: 'Visakhapatnam',
          district: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '530002',
          landmark: 'Opposite Submarine Museum',
          coordinates: { lat: 17.7164, lng: 83.3189 },
        },
        amenities: ['OCEAN_VIEW', 'WRAP_AROUND_TERRACE', 'VRV_AC', 'SECURITY', 'SWIMMING_POOL', 'GYM'],
        images: [
          { url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800', isMain: true, caption: 'Oceanfront View' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK Family Apartment in MVP Colony Sector 4',
        description: 'One of Visakhapatnam premier residential colonies. 3 BHK with north-east facing balcony, piped cooking gas, covered car parking, and generator backup.',
        propertyType: 'APARTMENT',
        rentAmount: 24000,
        depositAmount: 48000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1550,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Flat 301, Sagarika Heights, Sector 4',
          locality: 'MVP Colony',
          sublocality: 'Sector 4',
          city: 'Visakhapatnam',
          district: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '530017',
          landmark: 'Near MVP Double Road Park',
          coordinates: { lat: 17.7412, lng: 83.3341 },
        },
        amenities: ['LIFT', 'POWER_BACKUP', 'COVERED_PARKING', 'PIPED_GAS', 'SECURITY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1502005229762-ee1b2da97a06?w=800', isMain: true, caption: 'Dining and Living' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '3 BHK High-Rise Apartment on AIR Bypass Road, Tirupati',
        description: 'Modern 3 BHK flat with panoramic view of Tirumala Hills. Close to Alipiri, educational institutions, and railway station. 24x7 security, water treatment, and clubhouse.',
        propertyType: 'APARTMENT',
        rentAmount: 18500,
        depositAmount: 37000,
        bhk: 3,
        bathrooms: 3,
        areaSqFt: 1500,
        furnishing: 'SEMI_FURNISHED',
        propertyLocation: {
          address: 'Flat 602, Tirumala Vista, AIR Bypass Road',
          locality: 'AIR Bypass Road',
          sublocality: 'Korlagunta',
          city: 'Tirupati',
          district: 'Tirupati',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '517501',
          landmark: 'Near AIR Station Cross',
          coordinates: { lat: 13.6320, lng: 79.4210 },
        },
        amenities: ['HILL_VIEW', 'LIFT', 'POWER_BACKUP', 'PARKING', 'SECURITY'],
        images: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', isMain: true, caption: 'Apartment' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
      {
        title: '2 BHK Independent House in MR Palli, Tirupati',
        description: 'Independent ground-floor house in peaceful MR Palli neighborhood. Features car parking, sweet groundwater, separate pooja room, and vastu compliant design.',
        propertyType: 'INDEPENDENT_HOUSE',
        rentAmount: 12000,
        depositAmount: 24000,
        bhk: 2,
        bathrooms: 2,
        areaSqFt: 1100,
        furnishing: 'UNFURNISHED',
        propertyLocation: {
          address: 'Door 19-8-112, Maruthi Nagar, MR Palli',
          locality: 'MR Palli',
          sublocality: 'Maruthi Nagar',
          city: 'Tirupati',
          district: 'Tirupati',
          state: 'Andhra Pradesh',
          country: 'India',
          pincode: '517502',
          landmark: 'Near MR Palli Circle',
          coordinates: { lat: 13.6210, lng: 79.4120 },
        },
        amenities: ['CAR_PORTICO', 'BOREWELL_WATER', 'MUNICIPAL_WATER', 'TERRACE'],
        images: [
          { url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', isMain: true, caption: 'House' },
        ],
        availabilityStatus: 'VACANT',
        isListed: true,
      },
    ];

    const ownerUser = PersistentStore.findOne('users', (u: any) => u.role === 'OWNER');
    const ownerId = ownerUser ? (ownerUser._id || ownerUser.id) : 'usr_owner_1790428482726';

    if (PropertyService.isMongoConnected()) {
      for (const p of defaultProperties) {
        const geoPoint = {
          type: 'Point',
          coordinates: [p.propertyLocation.coordinates.lng, p.propertyLocation.coordinates.lat],
        };
        const docData = {
          ...p,
          ownerId,
          propertyLocation: {
            ...p.propertyLocation,
            geoPoint,
          },
        };
        const existing = await PropertyModel.findOne({ title: p.title });
        if (!existing) {
          await PropertyModel.create(docData);
        } else {
          await PropertyModel.updateOne({ _id: existing._id }, { $set: docData });
        }
      }
      console.log('[PropertyService] Default Telangana & AP properties seeded/updated in MongoDB.');
    } else {
      for (const p of defaultProperties) {
        const geoPoint = {
          type: 'Point',
          coordinates: [p.propertyLocation.coordinates.lng, p.propertyLocation.coordinates.lat],
        };
        const deterministicId = 'prop_seed_' + (p.propertyLocation.locality || p.propertyLocation.city)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        const existing = PersistentStore.findOne('properties', (item: any) => item.title === p.title || item.id === deterministicId);
        const id = existing ? (existing.id || existing._id) : deterministicId;
        const propDoc = {
          ...p,
          _id: id,
          id,
          ownerId,
          propertyLocation: {
            ...p.propertyLocation,
            geoPoint,
          },
          formattedRent: MoneyUtil.formatINR(p.rentAmount) + '/mo',
          formattedDeposit: MoneyUtil.formatINR(p.depositAmount),
          createdAt: existing?.createdAt || new Date(),
          updatedAt: new Date(),
        };
        if (existing) {
          PersistentStore.update('properties', id, propDoc);
        } else {
          PersistentStore.insert('properties', propDoc);
        }
        memoryProperties.set(id, propDoc);
      }
      console.log('[PropertyService] Default Telangana & AP properties seeded and persisted.');
    }
  }
}

