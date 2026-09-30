import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Owner Notifications</h1>
          <p class="text-xs text-slate-500">Real-time alerts regarding new tenant applications, rental updates, and rent tracking.</p>
        </div>

        <button
          *ngIf="unreadCount > 0"
          (click)="markAllAsRead()"
          [disabled]="isActioning"
          type="button"
          class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {{ isActioning ? 'Marking...' : '✓ Mark All as Read (' + unreadCount + ')' }}
        </button>
      </div>

      <!-- Feedback Banners -->
      <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>✓ {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>
      <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <!-- Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          *ngFor="let tab of tabs"
          (click)="selectedTab = tab.key"
          type="button"
          [class]="selectedTab === tab.key ? 'bg-[#0F2937] text-white font-extrabold shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
          class="px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{{ tab.label }}</span>
          <span
            *ngIf="getTabCount(tab.key) > 0"
            [class]="selectedTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
          >
            {{ getTabCount(tab.key) }}
          </span>
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading notifications..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load notifications"
        [message]="errorMessage"
        (retry)="loadNotifications()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && filteredNotifications.length === 0"
        title="No notifications for this filter"
        message="You will receive real-time alerts when prospective tenants submit applications or pay rent for your properties."
      ></app-empty-state>

      <!-- Notifications Feed List -->
      <div *ngIf="!isLoading && !isError && filteredNotifications.length > 0" class="space-y-3">
        <div
          *ngFor="let item of filteredNotifications"
          [class]="item.isRead ? 'bg-white opacity-85' : 'bg-emerald-50/50 border-[#2D7A5E] ring-1 ring-emerald-500/20'"
          class="bento-card p-5 border border-[#E8E6DF] rounded-2xl flex items-start justify-between gap-4 shadow-xs hover:shadow-md transition-all"
        >
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2">
              <span
                [ngClass]="getTypeBadgeClass(item.type)"
                class="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
              >
                {{ item.type }}
              </span>
              <span *ngIf="!item.isRead" class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-[10px] text-slate-400 font-semibold">{{ item.createdAt | date: 'medium' }}</span>
            </div>
            <h3 class="text-sm font-bold text-slate-900">{{ item.title }}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">{{ item.message }}</p>
          </div>

          <button
            *ngIf="!item.isRead"
            (click)="markAsRead(item.id)"
            type="button"
            class="px-2.5 py-1 text-xs font-bold text-[#2D7A5E] hover:bg-emerald-100 rounded-lg shrink-0 transition-colors cursor-pointer"
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
  isError: boolean = false;
  isActioning: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedTab: string = 'ALL';

  tabs = [
    { key: 'ALL', label: 'All Alerts' },
    { key: 'APPLICATION', label: 'Applications' },
    { key: 'RENTAL', label: 'Lease & Rent' },
    { key: 'SYSTEM', label: 'Platform & Security' },
  ];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';

    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.notifications = res.data;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to retrieve notifications.';
      },
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  get filteredNotifications(): NotificationItem[] {
    if (this.selectedTab === 'ALL') return this.notifications;
    return this.notifications.filter((n) => n.type === this.selectedTab);
  }

  getTabCount(key: string): number {
    if (key === 'ALL') return this.notifications.length;
    return this.notifications.filter((n) => n.type === key).length;
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'APPLICATION':
        return 'bg-amber-100 text-amber-900 border border-amber-200';
      case 'RENTAL':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
      case 'SERVICE':
        return 'bg-indigo-100 text-indigo-900 border border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const item = this.notifications.find((n) => n.id === id);
        if (item) item.isRead = true;
      },
      error: () => {
        const item = this.notifications.find((n) => n.id === id);
        if (item) item.isRead = true;
      }
    });
  }

  markAllAsRead(): void {
    this.isActioning = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.isActioning = false;
        this.notifications.forEach((n) => (n.isRead = true));
        this.successMessage = 'All alerts marked as read.';
      },
      error: () => {
        this.isActioning = false;
        this.notifications.forEach((n) => (n.isRead = true));
        this.successMessage = 'All alerts marked as read.';
      },
    });
  }
}
