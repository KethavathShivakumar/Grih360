import crypto from 'crypto';

export interface ProtectedDocumentRecord {
  storageKey: string;
  tenantId: string;
  documentType: string;
  maskedNumber: string;
  uploadedAt: Date;
  metadata?: any;
}

// In-Memory store for protected identity documents (isolated from public property images)
const protectedDocumentStore = new Map<string, ProtectedDocumentRecord>();

export class VerificationDocumentStorageService {
  /**
   * Safely store sensitive identity document with masked identifier and unique storage key
   * Zero raw document data is exposed in public URLs or logs
   */
  static storeDocument(tenantId: string, documentType: string, rawIdentifier?: string): ProtectedDocumentRecord {
    const storageKey = 'sec_doc_' + crypto.randomBytes(12).toString('hex');
    
    // Create masked representation (e.g. XXXX-XXXX-1234)
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

    protectedDocumentStore.set(storageKey, record);
    return record;
  }

  /**
   * Get document record with strict access control:
   * Only the tenant owner or ADMIN may access. Owners get ZERO raw document access.
   */
  static getDocumentMetadata(storageKey: string, requesterId: string, requesterRole: string): ProtectedDocumentRecord | null {
    const record = protectedDocumentStore.get(storageKey);
    if (!record) return null;

    if (requesterRole !== 'ADMIN' && record.tenantId !== requesterId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to sensitive identity document' };
    }

    return record;
  }
}
