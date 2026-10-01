import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-professional-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <a routerLink="/admin/dashboard" class="hover:text-slate-800">Admin Console</a>
        <span>/</span>
        <a routerLink="/admin/professionals" class="hover:text-slate-800">Professionals</a>
        <span>/</span>
        <span class="text-[#0F2937]">Professional Profile Inspection</span>
      </div>

      <!-- Header -->
      <div *ngIf="pro" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xl">
            {{ (pro.businessName || pro.user?.name || 'P')[0] }}
          </div>
          <div>
            <div class="flex items-center space-x-2 mb-0.5">
              <h1 class="text-2xl font-black text-[#0F2937]">{{ pro.businessName || pro.user?.name || 'Professional' }}</h1>
              <span
                [ngClass]="{
                  'bg-emerald-100 text-emerald-800': pro.verificationStatus === 'VERIFIED',
                  'bg-amber-100 text-amber-800': pro.verificationStatus === 'PENDING',
                  'bg-rose-100 text-rose-800': pro.verificationStatus === 'REJECTED',
                  'bg-slate-100 text-slate-700': pro.verificationStatus === 'NOT_VERIFIED' || !pro.verificationStatus
                }"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              >
                {{ pro.verificationStatus || 'NOT_VERIFIED' }}
              </span>
              <span
                [ngClass]="pro.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                class="px-2 py-0.5 rounded text-[10px] font-bold border"
              >
                {{ pro.isActive !== false ? 'ACTIVE' : 'INACTIVE' }}
              </span>
            </div>
            <p class="text-xs text-slate-500">{{ pro.user?.email || pro.userId?.email || 'No email' }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <a routerLink="/admin/professionals" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">
            ← Back
          </a>
          <button
            *ngIf="pro.verificationStatus !== 'VERIFIED'"
            (click)="setVerification('VERIFIED')"
            [disabled]="isUpdating"
            class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            ✓ Verify Professional
          </button>
          <button
            *ngIf="pro.verificationStatus === 'VERIFIED'"
            (click)="setVerification('NOT_VERIFIED')"
            [disabled]="isUpdating"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border transition disabled:opacity-50"
          >
            Revoke Verification
          </button>
          <button
            (click)="toggleStatus()"
            [disabled]="isUpdating"
            [ngClass]="pro.isActive !== false ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {{ pro.isActive !== false ? 'Deactivate' : 'Activate' }}
          </button>
        </div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading professional profile..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadProfessional()"></app-error-state>

      <!-- Bento Grid -->
      <div *ngIf="!loading && !error && pro" class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Business Profile -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Business Profile</h3>
          <div class="space-y-3 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1">Business Name</span>
              <span class="font-bold text-slate-800 text-sm">{{ pro.businessName || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Phone:</span>
              <span class="font-semibold text-slate-800">{{ pro.phone || pro.user?.phone || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Experience:</span>
              <span class="font-semibold text-slate-800">{{ pro.yearsOfExperience ? pro.yearsOfExperience + ' yrs' : 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Rating:</span>
              <span class="font-bold" [ngClass]="pro.reviewCount > 0 ? 'text-amber-600' : 'text-slate-400'">
                <ng-container *ngIf="pro.reviewCount > 0">⭐ {{ pro.rating?.toFixed(1) }} ({{ pro.reviewCount }} reviews)</ng-container>
                <ng-container *ngIf="!pro.reviewCount || pro.reviewCount === 0">No reviews yet</ng-container>
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1">Availability</span>
              <span class="font-semibold text-slate-800">{{ pro.availabilityStatus || 'AVAILABLE' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1">Bio</span>
              <p class="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {{ pro.bio || pro.description || 'No bio provided.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Service Categories & Areas -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Services & Coverage</h3>
          <div class="space-y-4 text-xs">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-2">Service Categories</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  *ngFor="let cat of pro.categories || pro.serviceCategories || []"
                  class="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-[10px] font-bold"
                >
                  {{ cat }}
                </span>
                <span *ngIf="!(pro.categories || pro.serviceCategories || []).length" class="text-slate-400 italic">No categories assigned</span>
              </div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-2">Service Areas</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  *ngFor="let area of pro.serviceAreas || []"
                  class="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold"
                >
                  📍 {{ area }}
                </span>
                <span *ngIf="!(pro.serviceAreas || []).length" class="text-slate-400 italic">All localities</span>
              </div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-2">Verification Status</span>
              <div class="flex items-center gap-2">
                <select
                  [(ngModel)]="newVerificationStatus"
                  class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
                >
                  <option value="NOT_VERIFIED">NOT_VERIFIED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <button
                  (click)="setVerification(newVerificationStatus)"
                  [disabled]="isUpdating || newVerificationStatus === pro.verificationStatus"
                  class="px-3 py-1.5 bg-[#0F2937] hover:bg-slate-800 text-white font-bold text-xs rounded-lg disabled:opacity-50 transition"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked User Account -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">Linked User Account</h3>
          <div class="space-y-3 text-xs">
            <div *ngIf="pro.user || pro.userId" class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div class="w-10 h-10 rounded-full bg-[#0F2937] text-white font-black flex items-center justify-center">
                {{ (pro.user?.name || pro.userId?.name || 'P')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-800 block truncate">{{ pro.user?.name || pro.userId?.name }}</span>
                <span class="text-[11px] text-slate-500 block truncate">{{ pro.user?.email || pro.userId?.email }}</span>
                <span class="text-[11px] text-slate-500 block">{{ pro.user?.phone || pro.userId?.phone }}</span>
              </div>
            </div>

            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Profile Member Since:</span>
              <span class="font-semibold text-slate-800">{{ pro.createdAt | date:'mediumDate' }}</span>
            </div>

            <a
              *ngIf="pro.user?._id || pro.user?.id || pro.userId"
              [routerLink]="['/admin/users', pro.user?._id || pro.user?.id || pro.userId]"
              class="block text-center py-2 bg-[#0F2937] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Inspect User Dossier →
            </a>

            <a
              routerLink="/admin/services"
              class="block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              View Service Requests →
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AdminProfessionalDetailsComponent implements OnInit {
  proId: string = '';
  pro: any = null;
  loading = true;
  error: string | null = null;
  isUpdating = false;
  newVerificationStatus = 'NOT_VERIFIED';

  constructor(private route: ActivatedRoute, private adminService: AdminService) {}

  ngOnInit(): void {
    this.proId = this.route.snapshot.paramMap.get('id') || '';
    if (this.proId) this.loadProfessional();
    else { this.error = 'No Professional ID specified'; this.loading = false; }
  }

  loadProfessional(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getProfessionalById(this.proId).subscribe({
      next: (res) => {
        this.pro = res.data;
        this.newVerificationStatus = this.pro?.verificationStatus || 'NOT_VERIFIED';
        this.loading = false;
      },
      error: (err) => { this.error = err.message || 'Failed to load professional'; this.loading = false; },
    });
  }

  setVerification(status: string): void {
    if (!this.pro) return;
    this.isUpdating = true;
    this.adminService.updateProfessionalVerification(this.proId, status).subscribe({
      next: () => { this.pro.verificationStatus = status; this.newVerificationStatus = status; this.isUpdating = false; },
      error: (err) => { alert(err.message || 'Failed to update verification'); this.isUpdating = false; },
    });
  }

  toggleStatus(): void {
    if (!this.pro) return;
    const newStatus = this.pro.isActive === false ? true : false;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this professional?`)) return;
    this.isUpdating = true;
    this.adminService.updateProfessionalStatus(this.proId, newStatus).subscribe({
      next: () => { this.pro.isActive = newStatus; this.isUpdating = false; },
      error: (err) => { alert(err.message || 'Failed to update status'); this.isUpdating = false; },
    });
  }
}
