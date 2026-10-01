import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-rentals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div>
        <h1 class="text-2xl font-black text-[#0F2937]">Active Rentals & Rent Tracking</h1>
        <p class="text-xs text-slate-500">Monitor active lease agreements and monthly rent tracking records</p>
      </div>

      <div class="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <select
          [(ngModel)]="selectedStatus"
          (change)="loadRentals()"
          class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="">All Rental Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="EXPIRED">Expired</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <div class="text-xs font-bold text-slate-500">Total Rentals: {{ totalRentals }}</div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading active rentals..."></app-loading-state>


      <app-error-state *ngIf="error" [message]="error" (retry)="loadRentals()"></app-error-state>

      <div *ngIf="!loading && !error" class="bg-white rounded-xl border border-[#E8E6DF] shadow-sm overflow-hidden">
        <div *ngIf="rentals.length === 0" class="p-8 text-center text-xs text-slate-500">
          No rental records found.
        </div>

        <div *ngIf="rentals.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F4F3EE] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E8E6DF]">
              <tr>
                <th class="px-4 py-3">Rental ID</th>
                <th class="px-4 py-3">Property ID</th>
                <th class="px-4 py-3">Monthly Rent</th>
                <th class="px-4 py-3">Lease Dates</th>
                <th class="px-4 py-3">Rent Tracking</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr *ngFor="let r of rentals" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-mono text-slate-600 font-bold">{{ r._id || r.id }}</td>
                <td class="px-4 py-3 text-slate-700">{{ r.propertyId }}</td>
                <td class="px-4 py-3 font-bold text-[#0F2937]">₹{{ r.monthlyRent }}/mo</td>
                <td class="px-4 py-3 text-[11px] text-slate-500">
                  {{ r.startDate | date: 'shortDate' }} - {{ r.endDate | date: 'shortDate' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-800': r.rentStatus === 'PAID',
                      'bg-amber-100 text-amber-800': r.rentStatus === 'DUE',
                      'bg-rose-100 text-rose-800': r.rentStatus === 'OVERDUE',
                      'bg-slate-100 text-slate-700': r.rentStatus === 'UPCOMING' || !r.rentStatus
                    }"
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                  >
                    {{ r.rentStatus || 'UPCOMING' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-800': r.status === 'ACTIVE' || r.status === 'CONFIRMED',
                      'bg-slate-100 text-slate-700': r.status === 'EXPIRED',
                      'bg-rose-100 text-rose-800': r.status === 'TERMINATED'
                    }"
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  >
                    {{ r.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <a
                    [routerLink]="['/admin/rentals', r._id || r.id]"
                    class="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-[10px] font-bold transition-colors"
                  >
                    Inspect →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminRentalsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  rentals: any[] = [];
  totalRentals = 0;
  selectedStatus = '';

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Rentals & Rent Tracking Oversight',
    route: '/admin/rentals',
    role: 'Admin',
    purpose: 'Administrative monitoring panel for active lease agreements and monthly rent tracking records',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['Rental list', 'Rent tracking badge', 'Lease dates'],
    requiredActions: ['Filter status'],
    requiredComponents: ['Data table', 'Rent status pill'],
    requiredStates: ['Loading', 'Normal', 'Empty', 'Error'],
    responsiveRequirements: { desktop: 'Data table layout', tablet: 'Scrollable table', mobile: 'Card list' },
    designRequirementNote: 'Monitors rent tracking without fake payment gateways.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadRentals();
  }

  loadRentals(): void {
    this.loading = true;
    this.error = null;
    const params: any = {};
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.adminService.getRentals(params).subscribe({
      next: (res) => {
        this.rentals = res.data?.rentals || [];
        this.totalRentals = res.data?.total || this.rentals.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch rentals';
        this.loading = false;
      },
    });
  }
}
