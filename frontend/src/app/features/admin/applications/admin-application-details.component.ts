import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-application-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <a routerLink="/admin/dashboard" class="hover:text-slate-800">Admin Console</a>
        <span>/</span>
        <a routerLink="/admin/applications" class="hover:text-slate-800">Applications</a>
        <span>/</span>
        <span class="text-[#0F2937]">Application Inspection</span>
      </div>

      <!-- Header -->
      <div *ngIf="application" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <span
              [ngClass]="{
                'bg-blue-100 text-blue-800': application.status === 'SUBMITTED',
                'bg-amber-100 text-amber-800': application.status === 'UNDER_REVIEW' || application.status === 'VERIFICATION_PENDING',
                'bg-emerald-100 text-emerald-800': application.status === 'APPROVED',
                'bg-rose-100 text-rose-800': application.status === 'REJECTED'
              }"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            >
              {{ application.status }}
            </span>
            <span class="font-mono text-[10px] text-slate-400">ID: {{ application._id || application.id }}</span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937]">Rental Application Dossier</h1>
          <p class="text-xs text-slate-500 mt-0.5">Submitted: {{ application.createdAt | date:'medium' }}</p>
        </div>
        <a routerLink="/admin/applications" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition self-start">
          ← Back to Applications
        </a>
      </div>

      <app-loading-state *ngIf="loading" message="Loading application dossier..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadApplication()"></app-error-state>

      <!-- Bento Grid -->
      <div *ngIf="!loading && !error && application" class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Applicant Info -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Applicant</h3>
          <div class="space-y-3 text-xs">
            <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center">
                {{ (application.tenant?.name || application.tenantId?.name || 'T')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-800 block truncate">{{ application.tenant?.name || application.tenantId?.name || 'Tenant' }}</span>
                <span class="text-[11px] text-slate-500 block truncate">{{ application.tenant?.email || application.tenantId?.email || 'N/A' }}</span>
                <span class="text-[11px] text-slate-500 block">{{ application.tenant?.phone || application.tenantId?.phone || 'No phone' }}</span>
              </div>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">KYC Status:</span>
              <span class="font-bold text-indigo-700">{{ application.tenant?.identityVerificationStatus || 'NOT_STARTED' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Proposed Move-In:</span>
              <span class="font-bold text-slate-800">{{ application.moveInDate | date:'mediumDate' }}</span>
            </div>
            <div *ngIf="application.tenant?._id || application.tenant?.id" class="pt-1">
              <a
                [routerLink]="['/admin/users', application.tenant?._id || application.tenant?.id]"
                class="block text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition"
              >
                View Applicant Profile →
              </a>
            </div>
          </div>
        </div>

        <!-- Property Info -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Target Property</h3>
          <div class="space-y-3 text-xs">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span class="font-bold text-slate-800 block">{{ application.property?.title || application.propertyId?.title || 'Property' }}</span>
              <span class="text-[11px] text-slate-500 block">
                📍 {{ (application.property?.propertyLocation?.address || application.property?.location?.address) || 'N/A' }}
              </span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Monthly Rent:</span>
              <span class="font-bold text-[#0F2937]">₹{{ (application.property?.rentAmount || 0).toLocaleString('en-IN') }}/mo</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Configuration:</span>
              <span class="font-bold text-slate-800">{{ application.property?.bhk }} BHK {{ application.property?.propertyType }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">City:</span>
              <span class="font-semibold text-slate-700">{{ application.property?.propertyLocation?.city || application.property?.location?.city || 'N/A' }}</span>
            </div>
            <div *ngIf="application.property?._id || application.property?.id" class="pt-1">
              <a
                [routerLink]="['/admin/properties', application.property?._id || application.property?.id]"
                class="block text-center py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition"
              >
                Inspect Property →
              </a>
            </div>
          </div>
        </div>

        <!-- Application Details -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Application Details</h3>
          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Monthly Income:</span>
              <span class="font-bold text-slate-800">
                {{ application.monthlyIncome ? '₹' + application.monthlyIncome.toLocaleString('en-IN') : 'Not declared' }}
              </span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Occupants:</span>
              <span class="font-bold text-slate-800">{{ application.numberOfOccupants || application.occupants || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Pets:</span>
              <span class="font-bold text-slate-800">{{ application.hasPets ? 'Yes' : 'No' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Verification Required:</span>
              <span class="font-bold text-amber-700">{{ application.verificationRequired ? 'Yes' : 'Standard' }}</span>
            </div>
            <div *ngIf="application.message" class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Applicant Message</span>
              <p class="text-[11px] text-slate-600 leading-relaxed">{{ application.message }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AdminApplicationDetailsComponent implements OnInit {
  applicationId: string = '';
  application: any = null;
  loading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private adminService: AdminService) {}

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.applicationId) this.loadApplication();
    else { this.error = 'No Application ID specified'; this.loading = false; }
  }

  loadApplication(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getApplicationById(this.applicationId).subscribe({
      next: (res) => { this.application = res.data; this.loading = false; },
      error: (err) => { this.error = err.message || 'Failed to load application'; this.loading = false; },
    });
  }
}
