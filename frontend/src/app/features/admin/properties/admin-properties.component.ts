import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Property Listings Moderation</h1>
          <p class="text-xs text-slate-500">Monitor, inspect, and moderate property listings across Tier-2 and Tier-3 cities</p>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            [(ngModel)]="search"
            (ngModelChange)="onFilterChange()"
            placeholder="Search property title, locality, address..."
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none w-full sm:w-64"
          />
          <select
            [(ngModel)]="selectedStatus"
            (change)="onFilterChange()"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="VACANT">Vacant / Available</option>
            <option value="RENTED">Rented / Occupied</option>
            <option value="FLAGGED">Flagged</option>
            <option value="REMOVED">Removed</option>
          </select>
        </div>
        <div class="text-xs font-bold text-slate-500">Total Listings: {{ totalProperties }}</div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading properties..."></app-loading-state>


      <app-error-state *ngIf="error" [message]="error" (retry)="loadProperties()"></app-error-state>

      <!-- Properties Grid -->
      <div *ngIf="!loading && !error" class="space-y-4">
        <div *ngIf="properties.length === 0" class="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#E8E6DF]">
          No properties match the selected criteria.
        </div>

        <div *ngFor="let p of properties" class="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-sm flex flex-col md:flex-row justify-between gap-4">
          <div class="space-y-2 max-w-2xl">
            <div class="flex items-center space-x-3">
              <h3 class="text-base font-black text-[#0F2937]">{{ p.title }}</h3>
              <span
                [ngClass]="{
                  'bg-emerald-100 text-emerald-800': p.availabilityStatus === 'VACANT' || p.status === 'AVAILABLE',
                  'bg-blue-100 text-blue-800': p.availabilityStatus === 'RENTED' || p.status === 'RENTED',
                  'bg-amber-100 text-amber-800': p.availabilityStatus === 'FLAGGED' || p.status === 'FLAGGED',
                  'bg-red-100 text-red-800': p.availabilityStatus === 'REMOVED' || p.status === 'REMOVED'
                }"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              >
                {{ p.availabilityStatus || p.status }}
              </span>
            </div>
            <p class="text-xs text-slate-600 line-clamp-2">{{ p.description }}</p>
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span>📍 {{ p.propertyLocation?.address || p.location?.address }}, {{ p.propertyLocation?.city || p.location?.city }}</span>
              <span>•</span>
              <span>💰 ₹{{ p.rentAmount }}/mo</span>
              <span>•</span>
              <span>🏠 {{ p.bhk }} BHK {{ p.propertyType }}</span>
            </div>
          </div>

          <div class="flex flex-col justify-between items-end gap-3 min-w-[160px]">
            <span class="text-[11px] text-slate-400">Created: {{ p.createdAt | date: 'mediumDate' }}</span>
            <div class="flex flex-wrap gap-2">
              <button
                *ngIf="p.availabilityStatus !== 'FLAGGED'"
                (click)="updateStatus(p, 'FLAGGED')"
                class="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded text-xs font-bold transition-colors"
              >
                🚩 Flag
              </button>
              <button
                *ngIf="p.availabilityStatus !== 'VACANT'"
                (click)="updateStatus(p, 'VACANT')"
                class="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition-colors"
              >
                ✅ Approve/Vacant
              </button>
              <button
                *ngIf="p.availabilityStatus !== 'REMOVED'"
                (click)="updateStatus(p, 'REMOVED')"
                class="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-bold transition-colors"
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminPropertiesComponent implements OnInit {
  loading = true;
  error: string | null = null;
  properties: any[] = [];
  totalProperties = 0;

  search = '';
  selectedStatus = '';

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Property Moderation',
    route: '/admin/properties',
    role: 'Admin',
    purpose: 'Administrative control panel to monitor, inspect, flag, or remove property listings',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['Property list', 'Rent amount', 'Locality', 'Moderation status'],
    requiredActions: ['Search Properties', 'Flag Listing', 'Approve Listing', 'Remove Listing'],
    requiredComponents: ['Property cards', 'Status badges', 'Action buttons'],
    requiredStates: ['Loading', 'Normal', 'Empty', 'Error'],
    responsiveRequirements: {
      desktop: 'Stacked property moderation cards',
      tablet: 'Stacked layout',
      mobile: 'Dense mobile cards',
    },
    designRequirementNote: 'All property status changes trigger audit log events.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  onFilterChange(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.error = null;
    const params: any = {};
    if (this.search) params.search = this.search;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.adminService.getProperties(params).subscribe({
      next: (res) => {
        this.properties = res.data?.properties || [];
        this.totalProperties = res.data?.total || this.properties.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch properties';
        this.loading = false;
      },
    });
  }

  updateStatus(prop: any, newStatus: string): void {
    if (!confirm(`Are you sure you want to set property status to ${newStatus}?`)) return;
    const id = prop._id || prop.id;
    this.adminService.updatePropertyStatus(id, newStatus).subscribe({
      next: () => {
        prop.availabilityStatus = newStatus;
        prop.status = newStatus;
      },
      error: (err) => {
        alert(err.message || 'Failed to update property status');
      },
    });
  }
}
