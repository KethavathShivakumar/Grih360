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
            <span class="text-xs text-[#64748B]">Grih360 Network</span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937] mt-1">{{ dashboardData?.profile?.businessName || 'Professional Dashboard' }}</h1>
          <p class="text-xs text-[#64748B]">Manage incoming service jobs, active work in progress, and availability status.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            (click)="toggleAvailability()"
            [class]="dashboardData?.stats?.isAvailable ? 'px-4 py-2 bg-[#2D7A5E] text-white text-xs font-bold rounded-xl shadow-sm' : 'px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl'"
          >
            {{ dashboardData?.stats?.isAvailable ? 'AVAILABLE FOR JOBS' : 'OFF-DUTY / UNAVAILABLE' }}
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
              <div class="text-2xl font-black text-[#2D7A5E] flex items-center gap-1.5">
                <svg class="w-6 h-6 fill-amber-400 text-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                <span>{{ dashboardData.stats.rating.toFixed(1) }}</span>
              </div>
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
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D7A5E] flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 class="text-sm font-black text-[#0F2937] group-hover:text-[#2D7A5E]">Active Job</h3>
              <p class="text-[11px] text-slate-500">Track current on-site work & mark completion.</p>
            </a>

            <a
              routerLink="/professional/requests"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 class="text-sm font-black text-[#0F2937] group-hover:text-[#0F2937]">Assigned Requests</h3>
              <p class="text-[11px] text-slate-500">Review incoming jobs & accept/reject.</p>
            </a>

            <a
              routerLink="/professional/history"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black  transition-transform">
                
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Job History</h3>
              <p class="text-[11px] text-slate-500">Review completed jobs & earnings record.</p>
            </a>

            <a
              routerLink="/professional/services"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Offered Services</h3>
              <p class="text-[11px] text-slate-500">Configure 8 categories & specializations.</p>
            </a>

            <a
              routerLink="/professional/availability"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Duty & Availability</h3>
              <p class="text-[11px] text-slate-500">Toggle shift status & matching availability.</p>
            </a>

            <a
              routerLink="/professional/service-area"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Service Area</h3>
              <p class="text-[11px] text-slate-500">Operating cities & travel radius in km.</p>
            </a>

            <a
              routerLink="/professional/reviews"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-5 h-5 fill-amber-400 text-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </div>
              <h3 class="text-sm font-black text-[#0F2937]">Client Reviews</h3>
              <p class="text-[11px] text-slate-500">Tenant star ratings & verified feedback.</p>
            </a>

            <a
              routerLink="/professional/profile"
              class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition space-y-2 group block"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
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
                  <span class="text-xs text-[#64748B]"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {{ req.serviceLocation?.city || 'Hyderabad' }}</span>
                </div>
                <h3 class="text-xs font-bold text-[#0F2937] group-hover:text-[#2D7A5E]">{{ req.description }}</h3>
              </div>

              <div class="flex items-center space-x-3">
                <app-status-badge [status]="req.status"></app-status-badge>
                <span class="text-xs font-bold text-[#E26D46] group-hover:text-amber-700 transition-colors">&rarr;</span>
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
