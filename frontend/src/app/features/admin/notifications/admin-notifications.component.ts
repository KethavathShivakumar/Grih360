import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">System Broadcast Announcements</h1>
          <p class="text-xs text-slate-500">Send platform updates and system notifications to targeted user roles</p>
        </div>
      </div>

      <!-- Broadcast Announcement Form -->
      <div class="bg-white p-6 rounded-xl border border-[#E8E6DF] shadow-sm max-w-2xl">
        <h3 class="text-base font-black text-[#0F2937] mb-4">Send New Announcement</h3>
        <form (ngSubmit)="sendBroadcast()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="e.g., Scheduled Platform Maintenance"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
            <select
              [(ngModel)]="targetRole"
              name="targetRole"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Users (Tenants, Owners, Pros)</option>
              <option value="TENANT">Tenants Only</option>
              <option value="OWNER">Owners Only</option>
              <option value="PROFESSIONAL">Professionals Only</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
            <textarea
              [(ngModel)]="message"
              name="message"
              rows="3"
              required
              placeholder="Enter announcement details..."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            ></textarea>
          </div>

          <div *ngIf="successMessage" class="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
            {{ successMessage }}
          </div>

          <div *ngIf="broadcastError" class="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-lg border border-rose-200">
            {{ broadcastError }}
          </div>

          <button
            type="submit"
            [disabled]="sending || !title || !message"
            class="px-5 py-2.5 bg-[#0F2937] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
          >
            {{ sending ? 'Sending Broadcast...' : '📢 Send Broadcast Announcement' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AdminNotificationsComponent {
  title = '';
  message = '';
  targetRole = 'ALL';
  sending = false;
  successMessage: string | null = null;
  broadcastError: string | null = null;

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Broadcast Announcements',
    route: '/admin/notifications',
    role: 'Admin',
    purpose: 'Administrative messaging tool to broadcast system announcements to targeted roles',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['Target role selection', 'Announcement title', 'Message body'],
    requiredActions: ['Broadcast Announcement'],
    requiredComponents: ['Broadcast form', 'Audience selector'],
    requiredStates: ['Normal', 'Sending', 'Success', 'Error'],
    responsiveRequirements: { desktop: 'Form layout', tablet: 'Form layout', mobile: 'Single column form' },
    designRequirementNote: 'Logged in administrative audit trail.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  sendBroadcast(): void {
    if (!this.title || !this.message) return;
    this.sending = true;
    this.successMessage = null;
    this.broadcastError = null;

    this.adminService.broadcastNotification(this.title, this.message, this.targetRole).subscribe({
      next: (res) => {
        this.sending = false;
        this.successMessage = `Broadcast successfully sent to ${res.data?.count || 'target'} users.`;
        this.title = '';
        this.message = '';
      },
      error: (err) => {
        this.sending = false;
        this.broadcastError = err.message || 'Failed to send broadcast announcement';
      },
    });
  }
}
