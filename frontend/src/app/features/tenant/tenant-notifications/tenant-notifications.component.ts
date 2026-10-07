import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-tenant-notifications',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-800">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Notifications Center</h1>
          <p class="text-xs text-slate-500">Real-time alerts regarding application statuses and property updates.</p>
        </div>
        <button
          *ngIf="unreadCount > 0"
          (click)="markAllAsRead()"
          type="button"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F2937] text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px]"
        >
          Mark All Read
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading notifications..."></app-loading-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && notifications.length === 0"
        title="No notifications yet"
        message="You will receive real-time alerts when landlords review or update your rental applications."
      ></app-empty-state>

      <!-- Notifications Feed List -->
      <div *ngIf="!isLoading && notifications.length > 0" class="space-y-3">
        <div
          *ngFor="let item of notifications"
          [class]="item.isRead ? 'bg-white opacity-80 border-slate-200' : 'bg-emerald-50/50 border-[#2D7A5E] shadow-2xs'"
          class="p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all"
        >
          <div class="space-y-1 flex-1 min-w-0" [class.cursor-pointer]="item.link" (click)="onNotificationClick(item)">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black text-[#2D7A5E] uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded-md">{{ item.type }}</span>
              <span *ngIf="!item.isRead" class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <h3 class="text-sm font-bold text-slate-900 leading-snug">{{ item.title }}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">{{ item.message }}</p>
            <span class="text-[10px] text-slate-400 block pt-1 font-medium">{{ item.createdAt | date: 'medium' }}</span>
          </div>

          <button
            *ngIf="!item.isRead"
            (click)="markAsRead(item.id, $event)"
            type="button"
            class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#2D7A5E] rounded-xl shrink-0 cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Mark Read
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TenantNotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  isLoading: boolean = true;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.notifications = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  markAsRead(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const item = this.notifications.find((n) => n.id === id);
        if (item) item.isRead = true;
      },
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.isRead = true));
      },
    });
  }

  onNotificationClick(item: NotificationItem): void {
    if (!item.isRead) {
      this.markAsRead(item.id);
    }
    if (item.link) {
      this.router.navigate([item.link]);
    }
  }
}
