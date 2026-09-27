import { Schema, model, Document, Types } from 'mongoose';
import { IProperty } from '../types/property.types';

export interface IPropertyDocument extends Omit<IProperty, '_id' | 'ownerId'>, Document {
  ownerId: Types.ObjectId | string;
}

const PropertySchema = new Schema<IPropertyDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ['APARTMENT', 'INDEPENDENT_HOUSE', 'VILLA', 'PG_HOSTEL', 'COMMERCIAL'],
      required: true,
      index: true,
    },
    rentAmount: {
      type: Number,
      required: true,
      index: true,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    bhk: {
      type: Number,
      required: true,
      index: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    areaSqFt: {
      type: Number,
      required: true,
    },
    furnishing: {
      type: String,
      enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'],
      required: true,
    },
    propertyLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      district: { type: String, index: true },
      state: { type: String, required: true, index: true },
      country: { type: String, default: 'India', index: true },
      pincode: { type: String, required: true },
      locality: { type: String, index: true },
      sublocality: { type: String, index: true },
      landmark: { type: String },
      placeId: { type: String, index: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      geoPoint: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },
    images: [
      {
        url: { type: String, required: true },
        isMain: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
        caption: { type: String },
      },
    ],
    amenities: [{ type: String }],
    availabilityStatus: {
      type: String,
      enum: ['VACANT', 'RENTED', 'UNDER_MAINTENANCE', 'RESERVED'],
      default: 'VACANT',
      index: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    isListed: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PropertySchema.index({ 'propertyLocation.city': 1, propertyType: 1, rentAmount: 1 });
PropertySchema.index({ 'propertyLocation.state': 1, 'propertyLocation.district': 1, 'propertyLocation.city': 1 });
PropertySchema.index({ 'propertyLocation.geoPoint': '2dsphere' });

export const PropertyModel = model<IPropertyDocument>('Property', PropertySchema);
