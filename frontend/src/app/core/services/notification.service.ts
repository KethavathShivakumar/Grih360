import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'APPLICATION' | 'RENTAL' | 'SERVICE' | 'AUTH';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  public notifications$: Observable<NotificationItem[]> = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  constructor(private apiService: ApiService) {}

  public fetchNotifications(): void {
    this.apiService.get<{ success: boolean; data: NotificationItem[] }>('/notifications').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notificationsSubject.next(res.data);
          const unread = res.data.filter((n) => !n.isRead).length;
          this.unreadCountSubject.next(unread);
        }
      },
      error: (err) => {
        console.warn('[NotificationService] Unable to fetch notifications:', err);
      },
    });
  }

  public getNotifications(): Observable<{ success: boolean; data: NotificationItem[] }> {
    return this.apiService.get<{ success: boolean; data: NotificationItem[] }>('/notifications');
  }

  public markAsRead(notificationId: string): Observable<any> {
    const current = this.notificationsSubject.value.map((item) => {
      if (item.id === notificationId) {
        return { ...item, isRead: true };
      }
      return item;
    });
    this.notificationsSubject.next(current);
    this.unreadCountSubject.next(current.filter((n) => !n.isRead).length);
    return this.apiService.patch(`/notifications/${notificationId}/read`, {});
  }

  public markAllAsRead(): Observable<any> {
    const current = this.notificationsSubject.value.map((item) => ({ ...item, isRead: true }));
    this.notificationsSubject.next(current);
    this.unreadCountSubject.next(0);
    return this.apiService.patch('/notifications/read-all', {});
  }
}

