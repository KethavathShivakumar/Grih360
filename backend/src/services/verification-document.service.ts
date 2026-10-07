import crypto from 'crypto';
import mongoose from 'mongoose';
import { VerificationDocumentModel } from '../models';
import { PersistentStore } from '../config/persistent-store';

export interface ProtectedDocumentRecord {
  storageKey: string;
  tenantId: string;
  documentType: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  dataBase64?: string;
  maskedNumber: string;
  uploadedAt: Date;
}

const memoryDocumentStore = new Map<string, ProtectedDocumentRecord>();

// Pre-load from PersistentStore if available
const savedDocs = PersistentStore.loadCollection('verification_documents');
for (const doc of savedDocs) {
  if (doc.storageKey) {
    memoryDocumentStore.set(doc.storageKey, doc);
  }
}

export class VerificationDocumentStorageService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Safely store sensitive identity document with masked identifier, storage key, and Base64 content.
   * Persists to MongoDB collection (or PersistentStore fallback).
   */
  static async storeDocumentFile(
    tenantId: string,
    documentType: string,
    fileName: string,
    mimeType: string,
    dataBase64: string,
    rawIdentifier?: string
  ): Promise<ProtectedDocumentRecord> {
    const storageKey = 'sec_doc_' + crypto.randomBytes(16).toString('hex');

    let maskedNumber = 'DOCUMENT-PROVIDED';
    if (rawIdentifier && rawIdentifier.length >= 4) {
      const lastFour = rawIdentifier.slice(-4);
      maskedNumber = `XXXX-XXXX-${lastFour}`;
    }

    const fileSize = Math.round((dataBase64.length * 3) / 4);

    const record: ProtectedDocumentRecord = {
      storageKey,
      tenantId,
      documentType,
      fileName,
      mimeType,
      fileSize,
      dataBase64,
      maskedNumber,
      uploadedAt: new Date(),
    };

    memoryDocumentStore.set(storageKey, record);
    PersistentStore.saveCollection('verification_documents', Array.from(memoryDocumentStore.values()));

    if (this.isMongoConnected()) {
      try {
        await VerificationDocumentModel.create(record);
      } catch (err) {
        console.warn('[VerificationDocumentStorageService] MongoDB save warning:', err);
      }
    }

    return record;
  }

  /**
   * Legacy method for raw identifier string without file payload
   */
  static storeDocument(tenantId: string, documentType: string, rawIdentifier?: string): ProtectedDocumentRecord {
    const storageKey = 'sec_doc_' + crypto.randomBytes(12).toString('hex');
    let maskedNumber = 'DOCUMENT-PROVIDED';
    if (rawIdentifier && rawIdentifier.length >= 4) {
      const lastFour = rawIdentifier.slice(-4);
      maskedNumber = `XXXX-XXXX-${lastFour}`;
    }

    const record: ProtectedDocumentRecord = {
      storageKey,
      tenantId,
      documentType,
      maskedNumber,
      uploadedAt: new Date(),
    };

    memoryDocumentStore.set(storageKey, record);
    return record;
  }

  /**
   * Get document payload with strict access control:
   * Only the tenant owner or ADMIN may access. Property Owners get ZERO raw document access (HTTP 403).
   */
  static async getDocumentFile(storageKey: string, requesterId: string, requesterRole: string): Promise<ProtectedDocumentRecord> {
    let record: ProtectedDocumentRecord | null = null;

    if (this.isMongoConnected()) {
      const dbDoc = await VerificationDocumentModel.findOne({ storageKey }).lean();
      if (dbDoc) {
        record = dbDoc as any;
      }
    }

    if (!record) {
      record = memoryDocumentStore.get(storageKey) || null;
    }

    if (!record) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Identity document file not found' };
    }

    // STRICT ROLE CHECK: Owners CANNOT view identity document bytes!
    if (requesterRole !== 'ADMIN' && record.tenantId !== requesterId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied. Only the tenant or admin can view identity documents.' };
    }

    return record;
  }
}
