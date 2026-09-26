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
    state: string;
    pincode: string;
    locality?: string;
    landmark?: string;
    coordinates?: { lat: number; lng: number };
  };
  amenities?: string[];
  images?: any[];
}

export interface PropertyQueryFilter {
  search?: string;
  city?: string;
  locality?: string;
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
        propertyLocation: input.propertyLocation,
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
        propertyLocation: input.propertyLocation,
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
   * Search / List Properties
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
          { 'propertyLocation.locality': regex },
          { 'propertyLocation.address': regex },
        ];
      }
      if (query.city) {
        mongoFilter['propertyLocation.city'] = new RegExp(query.city.trim(), 'i');
      }
      if (query.locality) {
        mongoFilter['propertyLocation.locality'] = new RegExp(query.locality.trim(), 'i');
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
            p.propertyLocation?.locality?.toLowerCase().includes(s) ||
            p.propertyLocation?.address?.toLowerCase().includes(s)
        );
      }
      if (query.city) {
        const c = query.city.toLowerCase();
        list = list.filter((p) => p.propertyLocation?.city?.toLowerCase().includes(c));
      }
      if (query.locality) {
        const l = query.locality.toLowerCase();
        list = list.filter((p) => p.propertyLocation?.locality?.toLowerCase().includes(l));
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
   * Seed Default Realistic Residential Properties (Telangana & AP)
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
          city: 'Hyderabad',
          state: 'Telangana',
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
          city: 'Hyderabad',
          state: 'Telangana',
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
          city: 'Hyderabad',
          state: 'Telangana',
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
          city: 'Hyderabad',
          state: 'Telangana',
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
          city: 'Warangal',
          state: 'Telangana',
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
          city: 'Warangal',
          state: 'Telangana',
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
          city: 'Warangal',
          state: 'Telangana',
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
          city: 'Warangal',
          state: 'Telangana',
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
          city: 'Vijayawada',
          state: 'Andhra Pradesh',
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
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
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
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
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
    ];

    const ownerUser = PersistentStore.findOne('users', (u: any) => u.role === 'OWNER');
    const ownerId = ownerUser ? (ownerUser._id || ownerUser.id) : 'usr_owner_1790428482726';

    if (PropertyService.isMongoConnected()) {
      const count = await PropertyModel.countDocuments();
      if (count === 0) {
        for (const p of defaultProperties) {
          await PropertyModel.create({ ...p, ownerId });
        }
        console.log('[PropertyService] Default Telangana & AP properties seeded to MongoDB.');
      }
    } else {
      if (PersistentStore.loadCollection('properties').length === 0) {
        let i = 1;
        for (const p of defaultProperties) {
          const id = 'prop_seed_' + (i++);
          const propDoc = {
            ...p,
            _id: id,
            id,
            ownerId,
            formattedRent: MoneyUtil.formatINR(p.rentAmount) + '/mo',
            formattedDeposit: MoneyUtil.formatINR(p.depositAmount),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          PersistentStore.insert('properties', propDoc);
          memoryProperties.set(id, propDoc);
        }
        console.log('[PropertyService] Default Telangana & AP properties seeded and persisted.');
      }
    }
  }
}
