import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-property-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <a routerLink="/admin/dashboard" class="hover:text-slate-800">Admin Console</a>
        <span>/</span>
        <a routerLink="/admin/properties" class="hover:text-slate-800">Properties</a>
        <span>/</span>
        <span class="text-[#0F2937]">Property Inspection</span>
      </div>

      <!-- Header & Status Bar -->
      <div *ngIf="property" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 mb-1">
            <span
              [ngClass]="{
                'bg-emerald-100 text-emerald-800': property.availabilityStatus === 'VACANT' || property.availabilityStatus === 'AVAILABLE',
                'bg-blue-100 text-blue-800': property.availabilityStatus === 'RENTED' || property.availabilityStatus === 'OCCUPIED',
                'bg-amber-100 text-amber-800': property.availabilityStatus === 'FLAGGED',
                'bg-rose-100 text-rose-800': property.availabilityStatus === 'REMOVED' || property.availabilityStatus === 'INACTIVE'
              }"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
            >
              {{ property.availabilityStatus || property.status }}
            </span>
            <span class="text-xs text-slate-400 font-mono">ID: {{ property._id || property.id }}</span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937]">{{ property.title }}</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            📍 {{ property.propertyLocation?.address || property.location?.address || 'Address not listed' }},
            {{ property.propertyLocation?.city || property.location?.city || 'Hyderabad' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <a
            routerLink="/admin/properties"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            ← Back
          </a>
          <button
            *ngIf="property.availabilityStatus !== 'VACANT'"
            (click)="updateStatus('VACANT')"
            [disabled]="isUpdating"
            class="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            ✓ Approve (VACANT)
          </button>
          <button
            *ngIf="property.availabilityStatus !== 'FLAGGED'"
            (click)="updateStatus('FLAGGED')"
            [disabled]="isUpdating"
            class="px-3.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            🚩 Flag Listing
          </button>
          <button
            *ngIf="property.availabilityStatus !== 'REMOVED'"
            (click)="updateStatus('REMOVED')"
            [disabled]="isUpdating"
            class="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            🗑️ Remove Listing
          </button>
        </div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading property inspection data..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadProperty()"></app-error-state>

      <!-- Details Content (Bento Grid) -->
      <div *ngIf="!loading && !error && property" class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Column 1: Financial & Core Specs -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Specifications & Pricing
          </h3>
          <div class="space-y-3 text-xs">
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <span class="text-slate-500 font-bold">Monthly Rent</span>
              <span class="text-lg font-black text-[#0F2937]">₹{{ property.rentAmount?.toLocaleString('en-IN') }}/mo</span>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <span class="text-slate-500 font-bold">Security Deposit</span>
              <span class="text-sm font-bold text-slate-700">₹{{ property.securityDeposit?.toLocaleString('en-IN') || (property.rentAmount * 2)?.toLocaleString('en-IN') }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Configuration:</span>
              <span class="font-bold text-slate-800">{{ property.bhk }} BHK {{ property.propertyType }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Furnishing:</span>
              <span class="font-bold text-slate-800">{{ property.furnishingStatus || property.furnishing || 'SEMI_FURNISHED' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Square Footage:</span>
              <span class="font-bold text-slate-800">{{ property.carpetArea || property.areaSqFt || '1200' }} sq.ft</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Listed State:</span>
              <span class="font-bold" [ngClass]="property.isListed !== false ? 'text-emerald-600' : 'text-rose-600'">
                {{ property.isListed !== false ? 'Publicly Listed' : 'Unlisted / Hidden' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Column 2: Owner & Governance -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Property Owner
          </h3>
          <div class="space-y-3 text-xs">
            <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                {{ (property.owner?.name || property.ownerId?.name || 'O')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Landlord / Owner</span>
                <span class="font-bold text-slate-800 block truncate">{{ property.owner?.name || property.ownerId?.name || 'Property Owner' }}</span>
                <span class="text-[11px] text-slate-500 block truncate">{{ property.owner?.email || property.ownerId?.email || 'N/A' }}</span>
              </div>
            </div>

            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Phone:</span>
              <span class="font-semibold text-slate-800">{{ property.owner?.phone || property.ownerId?.phone || 'Not provided' }}</span>
            </div>

            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Owner Verification:</span>
              <span class="font-bold text-indigo-700">
                {{ property.owner?.identityVerificationStatus || property.ownerId?.identityVerificationStatus || 'VERIFIED' }}
              </span>
            </div>

            <div class="pt-2">
              <a
                *ngIf="property.owner?._id || property.owner?.id || property.ownerId"
                [routerLink]="['/admin/users', property.owner?._id || property.owner?.id || property.ownerId]"
                class="block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Inspect Owner Dossier →
              </a>
            </div>
          </div>
        </div>

        <!-- Column 3: Amenities & Description -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Description & Amenities
          </h3>
          <div class="space-y-3 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1">Description</span>
              <p class="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                {{ property.description || 'No description provided by the landlord.' }}
              </p>
            </div>

            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1">Amenities</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  *ngFor="let am of property.amenities || ['Parking', 'Water Supply', 'Security', 'Power Backup']"
                  class="px-2 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] text-slate-700 rounded text-[10px] font-semibold"
                >
                  ✓ {{ am }}
                </span>
              </div>
            </div>

            <div class="pt-2 text-[11px] text-slate-400">
              Listing Created: {{ property.createdAt | date: 'medium' }}
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AdminPropertyDetailsComponent implements OnInit {
  propertyId: string = '';
  property: any = null;
  loading: boolean = true;
  error: string | null = null;
  isUpdating: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadProperty();
    } else {
      this.error = 'No Property ID specified';
      this.loading = false;
    }
  }

  loadProperty(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getPropertyById(this.propertyId).subscribe({
      next: (res) => {
        this.property = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load property details';
        this.loading = false;
      },
    });
  }

  updateStatus(status: string): void {
    if (!this.property) return;
    if (!confirm(`Are you sure you want to update property status to ${status}?`)) return;

    this.isUpdating = true;
    this.adminService.updatePropertyStatus(this.propertyId, status).subscribe({
      next: (res) => {
        this.property.availabilityStatus = status;
        this.property.status = status;
        this.isUpdating = false;
      },
      error: (err) => {
        alert(err.message || 'Failed to update property status');
        this.isUpdating = false;
      },
    });
  }
}
