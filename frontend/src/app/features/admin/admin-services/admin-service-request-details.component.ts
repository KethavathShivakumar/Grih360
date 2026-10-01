import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-service-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <a routerLink="/admin/dashboard" class="hover:text-slate-800">Admin Console</a>
        <span>/</span>
        <a routerLink="/admin/services" class="hover:text-slate-800">Services</a>
        <span>/</span>
        <span class="text-[#0F2937]">Request Inspection</span>
      </div>

      <!-- Header -->
      <div *ngIf="request" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <span class="px-2.5 py-0.5 bg-slate-800 text-white rounded-full text-[10px] font-bold uppercase">
              {{ request.categoryCode || request.category }}
            </span>
            <span
              [ngClass]="{
                'bg-blue-100 text-blue-800': request.status === 'REQUESTED',
                'bg-amber-100 text-amber-800': request.status === 'MATCHING' || request.status === 'ASSIGNED',
                'bg-emerald-100 text-emerald-800': request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS' || request.status === 'COMPLETED',
                'bg-rose-100 text-rose-800': request.status === 'REJECTED' || request.status === 'CANCELLED'
              }"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            >
              {{ request.status }}
            </span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937]">Service Request #{{ (request._id || request.id || '').slice(-6).toUpperCase() }}</h1>
          <p class="text-xs text-slate-500 mt-0.5">Submitted: {{ request.createdAt | date:'medium' }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <a routerLink="/admin/services" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">
            ← Back
          </a>
        </div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading service request..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadRequest()"></app-error-state>

      <!-- Bento Grid -->
      <div *ngIf="!loading && !error && request" class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Request Details -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Request Details</h3>
          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Category:</span>
              <span class="font-bold text-slate-800 uppercase">{{ request.categoryCode || request.category }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Scheduled Date:</span>
              <span class="font-bold text-slate-800">{{ request.scheduledDate ? (request.scheduledDate | date:'mediumDate') : 'Not scheduled' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Service Location:</span>
              <span class="font-semibold text-slate-800">📍 {{ request.serviceLocation?.city || request.serviceLocation?.address || 'Hyderabad' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Created:</span>
              <span class="font-semibold text-slate-700">{{ request.createdAt | date:'shortDate' }}</span>
            </div>
            <div *ngIf="request.completedAt" class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Completed:</span>
              <span class="font-semibold text-emerald-700">{{ request.completedAt | date:'mediumDate' }}</span>
            </div>
            <div *ngIf="request.problemDescription || request.description" class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Problem Description</span>
              <p class="text-[11px] text-slate-600 leading-relaxed">{{ request.problemDescription || request.description }}</p>
            </div>
          </div>
        </div>

        <!-- Requester -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Requester</h3>
          <div class="space-y-3 text-xs">
            <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div class="w-10 h-10 rounded-full bg-blue-200 text-blue-800 font-black flex items-center justify-center">
                {{ (request.requester?.name || request.requesterId?.name || 'T')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-800 block truncate">{{ request.requester?.name || request.requesterId?.name || 'Tenant' }}</span>
                <span class="text-[11px] text-slate-500 block truncate">{{ request.requester?.email || request.requesterId?.email || 'N/A' }}</span>
                <span class="text-[11px] text-slate-500 block">{{ request.requester?.phone || request.requesterId?.phone }}</span>
              </div>
            </div>
            <a
              *ngIf="request.requester?._id || request.requester?.id || request.requesterId"
              [routerLink]="['/admin/users', request.requester?._id || request.requester?.id || request.requesterId]"
              class="block text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition"
            >
              Inspect Requester →
            </a>
          </div>
        </div>

        <!-- Assigned Professional & Reassignment -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Assigned Professional</h3>
          <div class="space-y-3 text-xs">

            <!-- Current Assignment -->
            <div *ngIf="request.professional || request.professionalId" class="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div class="w-10 h-10 rounded-full bg-purple-200 text-purple-800 font-black flex items-center justify-center">
                {{ (request.professional?.businessName || request.professional?.user?.name || request.professionalId?.businessName || 'P')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-800 block truncate">
                  {{ request.professional?.businessName || request.professionalId?.businessName || 'Professional' }}
                </span>
                <span class="text-[11px] text-slate-500 block">{{ request.professional?.verificationStatus || 'VERIFIED' }}</span>
              </div>
            </div>

            <div *ngIf="!request.professional && !request.professionalId" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-bold text-center">
              ⏳ Matching in progress — no professional assigned yet
            </div>

            <!-- Reassign Control -->
            <div *ngIf="!['COMPLETED', 'CANCELLED'].includes(request.status)" class="border-t border-slate-100 pt-3 space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Admin Reassignment</span>
              <input
                type="text"
                [(ngModel)]="reassignProId"
                placeholder="Enter Professional ID to reassign..."
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] bg-slate-50"
              />
              <button
                (click)="reassign()"
                [disabled]="isUpdating || !reassignProId"
                class="w-full py-2 bg-[#2D7A5E] hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition"
              >
                {{ isUpdating ? 'Reassigning...' : '⇄ Reassign Service Request' }}
              </button>
              <p *ngIf="reassignError" class="text-rose-600 text-[11px] font-bold">{{ reassignError }}</p>
              <p *ngIf="reassignSuccess" class="text-emerald-600 text-[11px] font-bold">{{ reassignSuccess }}</p>
            </div>

            <div *ngIf="['COMPLETED', 'CANCELLED'].includes(request.status)" class="border-t border-slate-100 pt-3">
              <p class="text-[11px] text-slate-400 italic text-center">
                Reassignment unavailable — request is {{ request.status }}.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AdminServiceRequestDetailsComponent implements OnInit {
  requestId: string = '';
  request: any = null;
  loading = true;
  error: string | null = null;
  isUpdating = false;
  reassignProId = '';
  reassignError: string | null = null;
  reassignSuccess: string | null = null;

  constructor(private route: ActivatedRoute, private adminService: AdminService) {}

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id') || '';
    if (this.requestId) this.loadRequest();
    else { this.error = 'No Request ID specified'; this.loading = false; }
  }

  loadRequest(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getServiceRequestById(this.requestId).subscribe({
      next: (res) => { this.request = res.data; this.loading = false; },
      error: (err) => { this.error = err.message || 'Failed to load service request'; this.loading = false; },
    });
  }

  reassign(): void {
    if (!this.reassignProId.trim()) return;
    this.isUpdating = true;
    this.reassignError = null;
    this.reassignSuccess = null;
    this.adminService.reassignServiceRequest(this.requestId, this.reassignProId.trim()).subscribe({
      next: (res) => {
        this.request = { ...this.request, ...res.data, status: 'ASSIGNED' };
        this.reassignSuccess = 'Service request successfully reassigned.';
        this.reassignProId = '';
        this.isUpdating = false;
      },
      error: (err) => {
        this.reassignError = err.message || 'Failed to reassign service request';
        this.isUpdating = false;
      },
    });
  }
}
