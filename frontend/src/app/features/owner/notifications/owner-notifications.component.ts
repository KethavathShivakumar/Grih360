import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F2937]">Owner Notifications</h1>
        <p class="text-xs text-slate-500">Real-time alerts regarding new tenant applications, rental updates, and rent tracking.</p>
      </div>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading notifications..."></app-loading-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && notifications.length === 0"
        title="No notifications yet"
        message="You will receive real-time alerts when prospective tenants submit applications for your properties."
      ></app-empty-state>

      <!-- Notifications Feed List -->
      <div *ngIf="!isLoading && notifications.length > 0" class="space-y-3">
        <div
          *ngFor="let item of notifications"
          [class]="item.isRead ? 'bg-white opacity-80' : 'bg-emerald-50/50 border-[#2D7A5E]'"
          class="bento-card p-4 border border-[#E8E6DF] flex items-start justify-between gap-4"
        >
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-[#2D7A5E] uppercase">{{ item.type }}</span>
            <h3 class="text-sm font-bold text-slate-900">{{ item.title }}</h3>
            <p class="text-xs text-slate-600">{{ item.message }}</p>
            <span class="text-[10px] text-slate-400 block pt-1">{{ item.createdAt | date: 'medium' }}</span>
          </div>

          <button
            *ngIf="!item.isRead"
            (click)="markAsRead(item.id)"
            type="button"
            class="text-xs font-bold text-[#2D7A5E] hover:underline shrink-0"
          >
            Mark Read
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OwnerNotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  isLoading: boolean = true;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
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

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const item = this.notifications.find((n) => n.id === id);
        if (item) item.isRead = true;
      },
    });
  }
}
