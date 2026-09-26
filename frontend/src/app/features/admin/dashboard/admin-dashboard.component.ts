import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Platform Overview & Operations</h1>
          <p class="text-xs text-slate-500">Real-time system health, user volume, and security audit log</p>
        </div>
        <button
          (click)="loadStats()"
          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
        >
          🔄 Refresh Metrics
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="loading" message="Loading dashboard statistics..."></app-loading-state>


      <!-- Error State -->
      <app-error-state
        *ngIf="error"
        [message]="error"
        (retry)="loadStats()"
      ></app-error-state>

      <!-- Dashboard Data Cards (Bento) -->
      <div *ngIf="!loading && !error && stats" class="space-y-6">
        <!-- Top Metrics Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Users -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Users</span>
              <span class="p-1 bg-blue-50 text-blue-600 rounded">👥</span>
            </div>
            <div class="text-3xl font-black text-[#0F2937]">{{ stats.users?.total || 0 }}</div>
            <div class="mt-2 text-[11px] text-slate-500 space-x-2">
              <span>{{ stats.users?.tenants || 0 }} Tenants</span> •
              <span>{{ stats.users?.owners || 0 }} Owners</span> •
              <span>{{ stats.users?.professionals || 0 }} Pros</span>
            </div>
          </div>

          <!-- Total Properties -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Properties</span>
              <span class="p-1 bg-emerald-50 text-emerald-600 rounded">🏠</span>
            </div>
            <div class="text-3xl font-black text-[#0F2937]">{{ stats.properties?.total || 0 }}</div>
            <div class="mt-2 text-[11px] text-slate-500 space-x-2">
              <span class="text-emerald-600 font-bold">{{ stats.properties?.available || 0 }} Vacant</span> •
              <span>{{ stats.properties?.occupied || 0 }} Occupied</span>
            </div>
          </div>

          <!-- Active Rentals & Apps -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Active Rentals</span>
              <span class="p-1 bg-amber-50 text-amber-600 rounded">🔑</span>
            </div>
            <div class="text-3xl font-black text-[#0F2937]">{{ stats.rentals?.active || 0 }}</div>
            <div class="mt-2 text-[11px] text-slate-500 space-x-2">
              <span>{{ stats.applications?.submitted || 0 }} Apps Pending</span>
            </div>
          </div>

          <!-- Home Services -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Service Jobs</span>
              <span class="p-1 bg-purple-50 text-purple-600 rounded">🛠️</span>
            </div>
            <div class="text-3xl font-black text-[#0F2937]">{{ stats.services?.total || 0 }}</div>
            <div class="mt-2 text-[11px] text-slate-500 space-x-2">
              <span class="text-indigo-600 font-bold">{{ stats.services?.inProgress || 0 }} Active</span> •
              <span>{{ stats.services?.completed || 0 }} Completed</span>
            </div>
          </div>
        </div>

        <!-- System Operations Quick Jump Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Background Verification Review Queue Card -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold uppercase text-slate-400">Security Audit</span>
                <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  {{ stats.verifications?.pending || 0 }} Pending Review
                </span>
              </div>
              <h3 class="text-lg font-black text-[#0F2937] mb-1">Identity Verifications</h3>
              <p class="text-xs text-slate-500 mb-4">
                Review tenant Aadhaar and owner title deed background verifications safely without exposing raw files.
              </p>
            </div>
            <a
              routerLink="/admin/verifications"
              class="w-full text-center py-2 bg-[#0F2937] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Open Verifications Queue →
            </a>
          </div>

          <!-- Home Services & Professional Network Card -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold uppercase text-slate-400">Professional Network</span>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {{ stats.professionals?.active || 0 }} Active Pros
                </span>
              </div>
              <h3 class="text-lg font-black text-[#0F2937] mb-1">Home Services Oversight</h3>
              <p class="text-xs text-slate-500 mb-4">
                Monitor service requests, professional availability, category assignments, and customer ratings.
              </p>
            </div>
            <a
              routerLink="/admin/services"
              class="w-full text-center py-2 bg-[#2D7A5E] text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition-colors"
            >
              Manage Home Services →
            </a>
          </div>

          <!-- Broadcast Announcement Card -->
          <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold uppercase text-slate-400">Communications</span>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">System Wide</span>
              </div>
              <h3 class="text-lg font-black text-[#0F2937] mb-1">Broadcast Announcement</h3>
              <p class="text-xs text-slate-500 mb-4">
                Send targeted announcements to all Tenants, Owners, Professionals, or entire platform users.
              </p>
            </div>
            <a
              routerLink="/admin/notifications"
              class="w-full text-center py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors"
            >
              Send Announcement →
            </a>
          </div>
        </div>

        <!-- Recent Administrative Audit Activity Log -->
        <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide">Recent Operations Audit Log</h3>
            <a routerLink="/admin/audit" class="text-xs font-bold text-[#2D7A5E] hover:underline">View All Logs →</a>
          </div>

          <div *ngIf="!stats.recentActivity || stats.recentActivity.length === 0" class="text-xs text-slate-500 py-4 text-center">
            No administrative audit events recorded yet.
          </div>

          <div *ngIf="stats.recentActivity && stats.recentActivity.length > 0" class="divide-y divide-slate-100">
            <div *ngFor="let log of stats.recentActivity" class="py-3 flex items-center justify-between text-xs">
              <div class="flex items-center space-x-3">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded">
                  {{ log.action }}
                </span>
                <div>
                  <span class="font-bold text-[#0F2937]">{{ log.actorName }}</span>
                  <span class="text-slate-500"> modified </span>
                  <span class="font-semibold text-slate-700">{{ log.entityType }} ({{ log.entityId }})</span>
                </div>
              </div>
              <span class="text-slate-400 text-[11px]">{{ log.createdAt | date: 'medium' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  error: string | null = null;
  stats: any = null;

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Dashboard Console',
    route: '/admin/dashboard',
    role: 'Admin',
    purpose: 'Protected platform operations control panel for user oversight, property moderation, verifications, and security audit log',
    userEntersFrom: 'Admin Auth Login',
    userCanNavigateTo: ['/admin/users', '/admin/properties', '/admin/verifications', '/admin/services', '/admin/audit'],
    existingStitchReferences: ['projects/1596135526498527550/screens/6495c2e395bb4ae999d214cec77b5888'],
    requiredInformation: ['Platform user totals by role', 'Available vs rented properties', 'Active service requests', 'Audit trail events'],
    requiredActions: ['Review Verifications', 'Moderate Properties', 'Broadcast Announcement', 'Audit Operations'],
    requiredComponents: ['Bento metric cards', 'Quick jump cards', 'Audit log list'],
    requiredStates: ['Loading', 'Normal', 'Error'],
    responsiveRequirements: {
      desktop: 'Multi-column bento dashboard grid',
      tablet: '2-column stacked grid',
      mobile: 'Single column responsive dashboard cards',
    },
    designRequirementNote: 'Strict server-side role authorization enforced.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load dashboard metrics';
        this.loading = false;
      },
    });
  }
}
