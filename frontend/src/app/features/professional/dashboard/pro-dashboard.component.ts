import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProDashboardData } from '../../../core/services/professional.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pro-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 bg-[#EBF5F0] text-[#2D7A5E] text-xs font-bold rounded-full">Professional Workspace</span>
            <span class="text-xs text-[#64748B]">Nivas360 Network</span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937] mt-1">{{ dashboardData?.profile?.businessName || 'Professional Dashboard' }}</h1>
          <p class="text-xs text-[#64748B]">Manage incoming service jobs, active work in progress, and availability status.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            (click)="toggleAvailability()"
            [class]="dashboardData?.stats?.isAvailable ? 'px-4 py-2 bg-[#2D7A5E] text-white text-xs font-bold rounded-xl shadow-sm' : 'px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl'"
          >
            {{ dashboardData?.stats?.isAvailable ? '🟢 AVAILABLE FOR JOBS' : '🔴 OFF-DUTY / UNAVAILABLE' }}
          </button>
          <app-customer-care></app-customer-care>
        </div>
      </div>

      <app-loading-state *ngIf="isLoading" message="Loading professional dashboard..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadDashboard()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage && dashboardData" class="space-y-6">
        <!-- Bento Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-2">
            <span class="text-xs text-[#64748B] font-medium">Pending Assignments</span>
            <div class="text-2xl font-black text-[#E26D46]">{{ dashboardData.stats.pendingAssignments }}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-2">
            <span class="text-xs text-[#64748B] font-medium">Accepted Jobs</span>
            <div class="text-2xl font-black text-[#0F2937]">{{ dashboardData.stats.acceptedJobs }}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-2">
            <span class="text-xs text-[#64748B] font-medium">Active Jobs</span>
            <div class="text-2xl font-black text-[#2D7A5E]">{{ dashboardData.stats.activeJobs }}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-2">
            <span class="text-xs text-[#64748B] font-medium">Completed Jobs</span>
            <div class="text-2xl font-black text-[#0F2937]">{{ dashboardData.stats.completedJobs }}</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-2 col-span-2 lg:col-span-1">
            <span class="text-xs text-[#64748B] font-medium">Rating & Reviews</span>
            <div *ngIf="dashboardData.stats.reviewCount > 0" class="space-y-1">
              <div class="text-2xl font-black text-[#2D7A5E]">⭐ {{ dashboardData.stats.rating.toFixed(1) }}</div>
              <span class="text-[11px] text-[#64748B] block">({{ dashboardData.stats.reviewCount }} verified customer {{ dashboardData.stats.reviewCount === 1 ? 'review' : 'reviews' }})</span>
            </div>
            <div *ngIf="dashboardData.stats.reviewCount === 0" class="space-y-1">
              <div class="text-base font-black text-slate-400">No reviews yet</div>
              <span class="text-[11px] text-slate-400 block">0 completed job reviews</span>
            </div>
          </div>
        </div>

        <!-- Quick Work Management Bento Grid -->
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-[#0F2937]">Service Management Workspace</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a
              routerLink="/professional/active-job"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#2D7A5E] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D7A5E] flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <h3 class="text-sm font-black text-[#0F2937] group-hover:text-[#2D7A5E]">Active Job</h3>
              <p class="text-[11px] text-slate-500">Track current on-site work & mark completion.</p>
            </a>

            <a
              routerLink="/professional/requests"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                📋
              </div>
              <h3 class="text-sm font-black text-[#0F2937] group-hover:text-[#0F2937]">Assigned Requests</h3>
              <p class="text-[11px] text-slate-500">Review incoming jobs & accept/reject.</p>
            </a>

            <a
              routerLink="/professional/history"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                📜
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Job History</h3>
              <p class="text-[11px] text-slate-500">Review completed jobs & earnings record.</p>
            </a>

            <a
              routerLink="/professional/services"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                🛠️
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Offered Services</h3>
              <p class="text-[11px] text-slate-500">Configure 8 categories & specializations.</p>
            </a>

            <a
              routerLink="/professional/availability"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                ⏰
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Duty & Availability</h3>
              <p class="text-[11px] text-slate-500">Toggle shift status & matching availability.</p>
            </a>

            <a
              routerLink="/professional/service-area"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                📍
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Service Area</h3>
              <p class="text-[11px] text-slate-500">Operating cities & travel radius in km.</p>
            </a>

            <a
              routerLink="/professional/reviews"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                ⭐
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Client Reviews</h3>
              <p class="text-[11px] text-slate-500">Tenant star ratings & verified feedback.</p>
            </a>

            <a
              routerLink="/professional/profile"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform">
                👤
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Pro Profile</h3>
              <p class="text-[11px] text-slate-500">Business identity & account credentials.</p>
            </a>
          </div>
        </div>

        <!-- Recent Jobs Section -->
        <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#0F2937]">Recent Assigned Jobs</h2>
            <a routerLink="/professional/requests" class="text-xs font-bold text-[#E26D46] hover:underline">View All &rarr;</a>
          </div>

          <div *ngIf="dashboardData.recentRequests.length === 0" class="text-center py-8 text-xs text-[#64748B]">
            No assigned jobs yet. Ensure your categories and service areas are configured in your profile.
          </div>

          <div *ngIf="dashboardData.recentRequests.length > 0" class="space-y-3">
            <div
              *ngFor="let req of dashboardData.recentRequests"
              [routerLink]="['/professional/requests', req._id || req.id]"
              class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] hover:border-[#0F2937] rounded-xl transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 group"
            >
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-0.5 bg-white border text-[10px] font-bold rounded uppercase">{{ req.categoryCode }}</span>
                  <span class="text-xs text-[#64748B]">📍 {{ req.serviceLocation?.city || 'Hyderabad' }}</span>
                </div>
                <h3 class="text-xs font-bold text-[#0F2937] group-hover:text-[#2D7A5E]">{{ req.description }}</h3>
              </div>

              <div class="flex items-center space-x-3">
                <app-status-badge [status]="req.status"></app-status-badge>
                <span class="text-xs font-bold text-[#E26D46] group-hover:translate-x-1 transition">&rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProDashboardComponent implements OnInit {
  public dashboardData?: ProDashboardData;
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(private proService: ProfessionalService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  public loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.proService.getDashboard().subscribe({
      next: (res) => {
        this.dashboardData = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load professional dashboard';
        this.isLoading = false;
      },
    });
  }

  public toggleAvailability(): void {
    if (!this.dashboardData) return;
    const current = this.dashboardData.stats.isAvailable;
    this.proService.toggleAvailability(!current).subscribe({
      next: () => {
        this.loadDashboard();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update availability');
      },
    });
  }
}
