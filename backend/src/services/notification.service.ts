import { NotificationModel } from '../models';
import mongoose from 'mongoose';
import { PersistentStore } from '../config/persistent-store';

export const memoryNotifications = new Map<string, any>();

// Initialize memory cache from persistent disk store
const loadedNotifs = PersistentStore.loadCollection('notifications');
for (const n of loadedNotifs) {
  memoryNotifications.set(n._id || n.id, n);
}

export class NotificationService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  static async getUserNotifications(recipientId: string) {
    if (NotificationService.isMongoConnected()) {
      return NotificationModel.find({ recipientId }).sort({ createdAt: -1 }).lean();
    } else {
      return Array.from(memoryNotifications.values())
        .filter((n) => n.recipientId?.toString() === recipientId.toString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  static async markAsRead(notificationId: string, recipientId: string) {
    if (NotificationService.isMongoConnected()) {
      const notification = await NotificationModel.findOne({ _id: notificationId, recipientId });
      if (!notification) {
        throw { statusCode: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' };
      }
      notification.isRead = true;
      await notification.save();
      return notification;
    } else {
      const notification = memoryNotifications.get(notificationId);
      if (!notification) {
        throw { statusCode: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' };
      }
      notification.isRead = true;
      memoryNotifications.set(notificationId, notification);
      PersistentStore.update('notifications', notificationId, { isRead: true });
      return notification;
    }
  }

  static async markAllAsRead(recipientId: string) {
    if (NotificationService.isMongoConnected()) {
      await NotificationModel.updateMany({ recipientId, isRead: false }, { $set: { isRead: true } });
    } else {
      for (const [id, notif] of memoryNotifications.entries()) {
        if (notif.recipientId?.toString() === recipientId.toString()) {
          notif.isRead = true;
          memoryNotifications.set(id, notif);
          PersistentStore.update('notifications', id, { isRead: true });
        }
      }
    }
    return { success: true };
  }

  static async createNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    type?: 'SYSTEM' | 'APPLICATION' | 'RENTAL' | 'SERVICE' | 'AUTH';
    link?: string;
  }) {
    if (NotificationService.isMongoConnected() && mongoose.Types.ObjectId.isValid(data.recipientId)) {
      return NotificationModel.create(data);
    } else {
      const id = 'mem_notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const notif = {
        _id: id,
        id,
        ...data,
        recipientId: data.recipientId.toString(),
        isRead: false,
        createdAt: new Date(),
      };
      memoryNotifications.set(id, notif);
      PersistentStore.insert('notifications', notif);
      return notif;
    }
  }
}
