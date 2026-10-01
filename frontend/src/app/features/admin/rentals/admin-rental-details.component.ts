import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-rental-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <a routerLink="/admin/dashboard" class="hover:text-slate-800">Admin Console</a>
        <span>/</span>
        <a routerLink="/admin/rentals" class="hover:text-slate-800">Rentals</a>
        <span>/</span>
        <span class="text-[#0F2937]">Rental Agreement Inspection</span>
      </div>

      <!-- Header -->
      <div *ngIf="rental" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <span
              [ngClass]="{
                'bg-emerald-100 text-emerald-800': rental.status === 'ACTIVE' || rental.status === 'CONFIRMED',
                'bg-slate-100 text-slate-700': rental.status === 'EXPIRED',
                'bg-rose-100 text-rose-800': rental.status === 'TERMINATED',
                'bg-amber-100 text-amber-800': rental.status === 'DRAFT' || rental.status === 'REVIEW'
              }"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            >
              {{ rental.status }}
            </span>
            <span
              [ngClass]="{
                'bg-emerald-50 text-emerald-700': rental.rentStatus === 'PAID',
                'bg-amber-50 text-amber-700': rental.rentStatus === 'DUE',
                'bg-rose-50 text-rose-700': rental.rentStatus === 'OVERDUE'
              }"
              class="px-2 py-0.5 rounded text-[10px] font-bold border"
            >
              RENT: {{ rental.rentStatus || 'UPCOMING' }}
            </span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937]">Rental Agreement #{{ (rental._id || rental.id || '').slice(-6).toUpperCase() }}</h1>
          <p class="text-xs text-slate-500 mt-0.5">Created: {{ rental.createdAt | date:'medium' }}</p>
        </div>
        <a routerLink="/admin/rentals" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition self-start">
          ← Back to Rentals
        </a>
      </div>

      <app-loading-state *ngIf="loading" message="Loading rental agreement..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadRental()"></app-error-state>

      <!-- Bento Grid -->
      <div *ngIf="!loading && !error && rental" class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Lease Parameters -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Lease Parameters</h3>
          <div class="space-y-3 text-xs">
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
              <span class="text-slate-500 font-bold">Monthly Rent</span>
              <span class="text-lg font-black text-[#0F2937]">₹{{ (rental.monthlyRent || 0).toLocaleString('en-IN') }}</span>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
              <span class="text-slate-500 font-bold">Security Deposit</span>
              <span class="font-bold text-slate-700">₹{{ (rental.securityDeposit || 0).toLocaleString('en-IN') }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Lease Start:</span>
              <span class="font-bold text-slate-800">{{ rental.startDate | date:'mediumDate' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Lease End:</span>
              <span class="font-bold text-slate-800">{{ rental.endDate | date:'mediumDate' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Maintenance By:</span>
              <span class="font-bold text-slate-800">{{ rental.maintenanceResponsibility || 'Owner' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Rent Due Day:</span>
              <span class="font-bold text-slate-800">{{ rental.rentDueDay ? rental.rentDueDay + 'th of month' : 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Tenant & Owner Contacts -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Parties</h3>
          <div class="space-y-3 text-xs">
            <!-- Tenant -->
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tenant</span>
              <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div class="w-9 h-9 rounded-full bg-blue-200 text-blue-800 font-black flex items-center justify-center">
                  {{ (rental.tenant?.name || rental.tenantId?.name || 'T')[0] }}
                </div>
                <div class="min-w-0 flex-1">
                  <span class="font-bold text-slate-800 block truncate">{{ rental.tenant?.name || rental.tenantId?.name || 'Tenant' }}</span>
                  <span class="text-[11px] text-slate-500 block truncate">{{ rental.tenant?.email || rental.tenantId?.email || 'N/A' }}</span>
                  <span class="text-[11px] text-slate-500 block">{{ rental.tenant?.phone || rental.tenantId?.phone }}</span>
                </div>
              </div>
              <a
                *ngIf="rental.tenant?._id || rental.tenant?.id || rental.tenantId"
                [routerLink]="['/admin/users', rental.tenant?._id || rental.tenant?.id || rental.tenantId]"
                class="block text-center py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition mt-1"
              >
                Inspect Tenant →
              </a>
            </div>

            <!-- Owner -->
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Landlord / Owner</span>
              <div class="flex items-center space-x-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div class="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 font-black flex items-center justify-center">
                  {{ (rental.owner?.name || rental.ownerId?.name || 'O')[0] }}
                </div>
                <div class="min-w-0 flex-1">
                  <span class="font-bold text-slate-800 block truncate">{{ rental.owner?.name || rental.ownerId?.name || 'Owner' }}</span>
                  <span class="text-[11px] text-slate-500 block truncate">{{ rental.owner?.email || rental.ownerId?.email || 'N/A' }}</span>
                  <span class="text-[11px] text-slate-500 block">{{ rental.owner?.phone || rental.ownerId?.phone }}</span>
                </div>
              </div>
              <a
                *ngIf="rental.owner?._id || rental.owner?.id || rental.ownerId"
                [routerLink]="['/admin/users', rental.owner?._id || rental.owner?.id || rental.ownerId]"
                class="block text-center py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition mt-1"
              >
                Inspect Owner →
              </a>
            </div>
          </div>
        </div>

        <!-- Property & Rent Status -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Property & Rent Tracking</h3>
          <div class="space-y-3 text-xs">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Property</span>
              <span class="font-bold text-slate-800 block">{{ rental.property?.title || rental.propertyId?.title || 'Leased Property' }}</span>
              <span class="text-[11px] text-slate-500 block">
                📍 {{ rental.property?.propertyLocation?.city || rental.property?.location?.city || 'Hyderabad' }}
              </span>
            </div>

            <div
              class="p-3 rounded-xl border space-y-0.5"
              [ngClass]="{
                'bg-emerald-50 border-emerald-200': rental.rentStatus === 'PAID',
                'bg-amber-50 border-amber-200': rental.rentStatus === 'DUE',
                'bg-rose-50 border-rose-200': rental.rentStatus === 'OVERDUE',
                'bg-slate-50 border-slate-200': !rental.rentStatus || rental.rentStatus === 'UPCOMING'
              }"
            >
              <span class="text-[10px] font-bold text-slate-500 uppercase block">Rent Status</span>
              <span class="font-black text-base"
                [ngClass]="{
                  'text-emerald-700': rental.rentStatus === 'PAID',
                  'text-amber-700': rental.rentStatus === 'DUE',
                  'text-rose-700': rental.rentStatus === 'OVERDUE',
                  'text-slate-600': !rental.rentStatus || rental.rentStatus === 'UPCOMING'
                }"
              >{{ rental.rentStatus || 'UPCOMING' }}</span>
              <div *ngIf="rental.lastPaidDate" class="text-[11px] text-slate-500">
                Last paid: {{ rental.lastPaidDate | date:'mediumDate' }}
              </div>
            </div>

            <a
              *ngIf="rental.property?._id || rental.property?.id || rental.propertyId"
              [routerLink]="['/admin/properties', rental.property?._id || rental.property?.id || rental.propertyId]"
              class="block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Inspect Property →
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AdminRentalDetailsComponent implements OnInit {
  rentalId: string = '';
  rental: any = null;
  loading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private adminService: AdminService) {}

  ngOnInit(): void {
    this.rentalId = this.route.snapshot.paramMap.get('id') || '';
    if (this.rentalId) this.loadRental();
    else { this.error = 'No Rental ID specified'; this.loading = false; }
  }

  loadRental(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getRentalById(this.rentalId).subscribe({
      next: (res) => { this.rental = res.data; this.loading = false; },
      error: (err) => { this.error = err.message || 'Failed to load rental details'; this.loading = false; },
    });
  }
}
