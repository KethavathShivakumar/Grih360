import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-pro-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/professional/dashboard" class="hover:text-[#0F2937]">Professional Dashboard</a>
        <span>/</span>
        <span class="text-[#0F2937]">Service Alerts & Notifications</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Professional Notifications</h1>
          <p class="text-xs text-[#64748B]">Real-time alerts for new job assignments, schedule updates, and customer reviews.</p>
        </div>
        <button
          *ngIf="notifications.length > 0"
          (click)="markAllAsRead()"
          class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl transition"
        >
          ✓ Mark All as Read
        </button>
      </div>

      

      <app-loading-state *ngIf="isLoading" message="Loading service alerts..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadNotifications()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage">
        <app-empty-state
          *ngIf="notifications.length === 0"
          title="No service notifications yet."
          description="You will receive alerts here when new jobs are assigned to you or when customers review completed services."
        ></app-empty-state>

        <div *ngIf="notifications.length > 0" class="space-y-3 max-w-4xl mx-auto">
          <div
            *ngFor="let notif of notifications"
            [class]="notif.isRead ? 'p-4 bg-white border border-[#E8E6DF] rounded-xl flex items-start justify-between gap-4 text-xs' : 'p-4 bg-[#EBF5F0] border border-[#D1EADF] rounded-xl flex items-start justify-between gap-4 text-xs font-medium'"
          >
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-[#0F2937]">{{ notif.title }}</span>
                <span *ngIf="!notif.isRead" class="px-2 py-0.2 bg-[#E26D46] text-white text-[9px] font-bold rounded-full">NEW</span>
              </div>
              <p class="text-[#64748B]">{{ notif.message }}</p>
              <span class="text-[10px] text-[#64748B] block">{{ notif.createdAt | date: 'short' }}</span>
            </div>

            <a
              *ngIf="notif.link"
              [routerLink]="notif.link"
              class="px-3 py-1.5 bg-[#0F2937] text-white font-bold rounded-lg hover:bg-[#133E4D] transition text-[11px]"
            >
              View &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProNotificationsComponent implements OnInit {
  public notifications: any[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  public loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.notifService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load notifications';
        this.isLoading = false;
      },
    });
  }

  public markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
    });
  }
}
