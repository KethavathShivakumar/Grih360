import mongoose from 'mongoose';
import { AuditLogModel, memoryAuditLogs } from '../models/audit.model';

export interface AuditLogOptions {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async logAction(opts: AuditLogOptions): Promise<any> {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      actorId: opts.actorId,
      actorName: opts.actorName || 'Admin User',
      actorRole: opts.actorRole || 'ADMIN',
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      metadata: opts.metadata || {},
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await AuditLogModel.create({
          actorId: opts.actorId,
          actorName: opts.actorName || 'Admin User',
          actorRole: opts.actorRole || 'ADMIN',
          action: opts.action,
          entityType: opts.entityType,
          entityId: opts.entityId,
          metadata: opts.metadata || {},
        });
        return created;
      } catch (err) {
        console.warn('DB Audit log creation failed, falling back to memory log:', err);
      }
    }

    memoryAuditLogs.unshift(entry);
    return entry;
  }

  static async getLogs(filters?: { entityType?: string; action?: string; limit?: number }): Promise<any[]> {
    const limit = filters?.limit || 50;

    if (mongoose.connection.readyState === 1) {
      try {
        const query: any = {};
        if (filters?.entityType) query.entityType = filters.entityType;
        if (filters?.action) query.action = filters.action;

        return await AuditLogModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      } catch (err) {
        console.warn('DB Audit log fetch failed, falling back to memory store:', err);
      }
    }

    let logs = [...memoryAuditLogs];
    if (filters?.entityType) {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    return logs.slice(0, limit);
  }
}
