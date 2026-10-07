import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  VerificationService,
  RentalVerification,
  VerificationStep,
  VerificationDocumentItem,
} from '../../../core/services/verification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-verification-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- Breadcrumbs & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <a routerLink="/admin/verifications" class="hover:text-indigo-600">Verification Queue</a>
            <span>/</span>
            <span class="text-slate-800 font-semibold">Record #{{ verificationId.slice(-6) }}</span>
          </div>
          <h1 class="text-2xl font-extrabold text-[#0F2937] tracking-tight">Administrative Verification Dossier</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Compliance officer verification inspection and tenancy eligibility determination
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <app-status-badge [status]="verification?.status || 'PENDING'"></app-status-badge>
          <a
            routerLink="/admin/verifications"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            ← Back to Queue
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
        <div class="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p class="text-sm font-semibold text-slate-600">Loading verification dossier...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && errorMsg" class="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-rose-900 space-y-3">
        <div class="flex items-center space-x-2 font-bold text-sm">
          <span>⚠️</span>
          <span>{{ errorMsg }}</span>
        </div>
        <div class="flex gap-3">
          <button (click)="loadDetails()" class="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700">
            Retry
          </button>
          <a routerLink="/admin/verifications" class="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-300">
            Back to Queue
          </a>
        </div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && verification" class="space-y-6">

        <!-- Status & Review Action Callout Bar -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Current Verification Status</span>
            <div class="flex items-center space-x-3">
              <span class="text-lg font-black text-slate-900">{{ verification.status }}</span>
              <span *ngIf="verification.reviewedAt" class="text-xs text-slate-400">
                (Reviewed on {{ verification.reviewedAt | date:'medium' }})
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Next Action: <strong class="text-slate-700">{{ verification.nextAction || 'Pending Officer Review' }}</strong>
            </p>
          </div>

          <!-- Quick Decision Actions -->
          <div class="flex flex-wrap items-center gap-2.5">
            <button
              *ngIf="verification.status !== 'UNDER_REVIEW'"
              (click)="updateStatus('UNDER_REVIEW')"
              [disabled]="isUpdating"
              class="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 disabled:opacity-50"
            >
              Mark Under Review
            </button>
            <button
              *ngIf="verification.status !== 'VERIFIED'"
              (click)="updateStatus('VERIFIED')"
              [disabled]="isUpdating"
              class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              ✓ Approve (VERIFIED)
            </button>
            <button
              *ngIf="verification.status !== 'REJECTED'"
              (click)="promptReject()"
              [disabled]="isUpdating"
              class="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              ✕ Reject Verification
            </button>
          </div>
        </div>

        <!-- Rejection Notice (if rejected) -->
        <div *ngIf="verification.status === 'REJECTED'" class="bg-rose-50 border border-rose-200 p-5 rounded-3xl flex items-start space-x-3 text-rose-950">
          <span class="text-lg">❌</span>
          <div class="space-y-1">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-rose-900">Rejection Reason</h4>
            <p class="text-xs text-rose-800 font-medium leading-relaxed">
              {{ verification.rejectionReason || 'Documents or identity credentials failed verification standards.' }}
            </p>
          </div>
        </div>

        <!-- 3-Column Dossier Summary: Applicant / Target Property / Application -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Applicant Profile Card -->
          <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
            <div class="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                {{ (tenantUser?.name || 'T')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Applicant</span>
                <h3 class="text-sm font-bold text-slate-900 truncate">{{ tenantUser?.name || 'Applicant' }}</h3>
                <span class="text-[11px] text-slate-500 truncate block">{{ tenantUser?.email || 'No email' }}</span>
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400">Phone:</span>
                <span class="font-semibold text-slate-800">{{ tenantUser?.phone || 'Not provided' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Profile KYC:</span>
                <span class="font-bold text-indigo-700">{{ tenantUser?.identityVerificationStatus || 'NOT_STARTED' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Tenant ID:</span>
                <span class="font-mono text-[11px] text-slate-500">{{ tenantIdStr.slice(-8) }}</span>
              </div>
            </div>
          </div>

          <!-- Target Property Card -->
          <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
            <div class="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div class="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                <img [src]="propertyImage" [alt]="propertyTitle" class="w-full h-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Target Property</span>
                <h3 class="text-sm font-bold text-slate-900 truncate">{{ propertyTitle }}</h3>
                <span class="text-[11px] text-slate-500 truncate block">📍 {{ propertyLocation }}</span>
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400">Listed Rent:</span>
                <span class="font-extrabold text-[#2D7A5E]">₹{{ (propertyObj?.rentAmount || 0).toLocaleString('en-IN') }}/mo</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Owner Name:</span>
                <span class="font-semibold text-slate-800">{{ ownerUser?.name || 'Property Owner' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Owner Contact:</span>
                <span class="text-slate-600">{{ ownerUser?.phone || ownerUser?.email || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Application Terms Card -->
          <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
            <div class="border-b border-slate-100 pb-3">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Application</span>
              <h3 class="text-sm font-bold text-slate-900">
                Application #{{ (applicationObj?._id || applicationObj?.id || '').slice(-6) }}
              </h3>
              <span class="text-[11px] text-indigo-700 font-semibold">Status: {{ applicationObj?.status || 'SUBMITTED' }}</span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400">Offered Rent:</span>
                <span class="font-extrabold text-slate-900">₹{{ (applicationObj?.proposedRent || 0).toLocaleString('en-IN') }}/mo</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Target Move-In:</span>
                <span class="font-semibold text-slate-800">
                  {{ applicationObj?.moveInDate ? (applicationObj.moveInDate | date:'mediumDate') : 'Immediate' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Submitted:</span>
                <span class="text-slate-600">{{ verification.submittedAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Verification Steps & Integration Requirements -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Required Verification Step Audits</h3>
            <p class="text-xs text-slate-500 mt-0.5">Automated provider states & compliance checks</p>
          </div>

          <div class="space-y-3">
            <div *ngFor="let step of verification.steps" class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-bold text-slate-900">{{ step.name }}</span>
                  <span *ngIf="step.isExternalProvider" class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md">
                    {{ step.providerNotice || 'Verification provider integration required' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500">
                  Category: <span class="font-semibold text-slate-700">{{ step.category }}</span>
                  <span *ngIf="step.completedAt">• Submitted on {{ step.completedAt | date:'short' }}</span>
                </p>
              </div>

              <div>
                <span [class]="getStepBadgeClass(step.status)" class="px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {{ step.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sensitive Document Vault (Authorized Admin View) -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Authorized Document Vault</h3>
              <p class="text-xs text-slate-500 mt-0.5">Sensitive credentials strictly accessible to administrative compliance personnel</p>
            </div>
            <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold rounded-lg">
              🛡️ Admin Privilege Level
            </span>
          </div>

          <div *ngIf="!verification.documents || verification.documents.length === 0" class="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl">
            No document files uploaded yet for this verification record.
          </div>

          <div *ngIf="verification.documents && verification.documents.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            <div *ngFor="let doc of verification.documents" class="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center space-x-3.5">
                <span class="p-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-base">📄</span>
                <div>
                  <span class="font-bold text-slate-900 block text-sm">{{ doc.documentName || doc.documentType }}</span>
                  <div class="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                    <span class="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                      Masked Identifier: {{ doc.maskedIdentifier || 'XXXX-XXXX-****' }}
                    </span>
                    <span>•</span>
                    <span>Uploaded: {{ doc.uploadedAt | date:'medium' }}</span>
                  </div>
                  <span *ngIf="doc.notes" class="text-[11px] text-slate-400 italic block mt-1">"{{ doc.notes }}"</span>
                </div>
              </div>

              <div class="flex items-center space-x-2 shrink-0">
                <a
                  *ngIf="doc.storageKey"
                  [href]="'/api/v1/verifications/document/' + doc.storageKey"
                  target="_blank"
                  class="px-3 py-1 bg-[#0F2937] hover:bg-[#164E63] text-white text-[11px] font-bold rounded-xl shadow-2xs flex items-center gap-1"
                >
                  👁️ View File
                </a>
                <span [class]="getStepBadgeClass(doc.status)" class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                  {{ doc.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submitted Tenancy Details -->
        <div *ngIf="verification.submittedInfo" class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Submitted Residential & Reference Details</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Current Residential Address</span>
              <span class="font-medium text-slate-800 mt-0.5 block">{{ verification.submittedInfo.currentAddress || 'Not provided' }}</span>
            </div>
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Previous Landlord Contact</span>
              <span class="font-medium text-slate-800 mt-0.5 block">{{ verification.submittedInfo.previousLandlordContact || 'None' }}</span>
            </div>
          </div>
        </div>

        <!-- Compliance Notes & Audit Determination Panel -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Administrative Determination</h3>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Compliance Officer Audit Notes</label>
            <textarea
              [(ngModel)]="adminNotes"
              rows="3"
              placeholder="Record notes on document validity, cross-checks performed, or reasons for decision..."
              class="w-full border border-slate-300 rounded-2xl p-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
            ></textarea>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100">
            <span class="text-xs text-slate-400">All determination decisions trigger automated notifications to tenant and owner.</span>
            <div class="flex items-center space-x-3">
              <button
                (click)="promptReject()"
                [disabled]="isUpdating"
                class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                Reject Verification
              </button>
              <button
                (click)="updateStatus('VERIFIED')"
                [disabled]="isUpdating"
                class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                Confirm Approval (VERIFIED)
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
})
export class AdminVerificationDetailsComponent implements OnInit {
  public verificationId: string = '';
  public verification: RentalVerification | null = null;
  public loading: boolean = true;
  public isUpdating: boolean = false;
  public errorMsg: string = '';
  public adminNotes: string = '';

  constructor(
    private verificationService: VerificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.verificationId = params.get('id') || '';
      if (this.verificationId) {
        this.loadDetails();
      } else {
        this.errorMsg = 'No verification ID provided.';
        this.loading = false;
      }
    });
  }

  loadDetails(): void {
    this.loading = true;
    this.errorMsg = '';

    this.verificationService.getVerificationById(this.verificationId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.verification = res.data;
          this.adminNotes = this.verification.adminNotes || '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to load verification record.';
      },
    });
  }

  get tenantUser(): any {
    return this.verification?.tenantId || null;
  }

  get tenantIdStr(): string {
    const t = this.verification?.tenantId;
    return (t && typeof t === 'object' ? t._id : t) || '';
  }

  get propertyObj(): any {
    return this.verification?.propertyId || null;
  }

  get propertyTitle(): string {
    return this.propertyObj?.title || 'Rental Listing';
  }

  get propertyLocation(): string {
    const loc = this.propertyObj?.propertyLocation;
    return loc ? `${loc.locality || loc.address || ''}, ${loc.city || ''}` : 'Property Address';
  }

  get propertyImage(): string {
    const images = this.propertyObj?.images;
    return images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  get ownerUser(): any {
    return this.verification?.ownerId || null;
  }

  get applicationObj(): any {
    return this.verification?.applicationId || null;
  }

  getStepBadgeClass(status: string): string {
    if (status === 'VERIFIED') return 'bg-emerald-100 text-emerald-800';
    if (status === 'PENDING' || status === 'UNDER_REVIEW') return 'bg-amber-100 text-amber-800';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-600';
  }

  updateStatus(status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW', rejectionReason?: string): void {
    if (!this.verificationId) return;
    this.isUpdating = true;

    this.verificationService
      .reviewVerification(this.verificationId, status, rejectionReason, this.adminNotes)
      .subscribe({
        next: (res) => {
          this.isUpdating = false;
          if (res.success) {
            alert(`Verification decision successfully updated to ${status}`);
            this.loadDetails();
          }
        },
        error: (err) => {
          this.isUpdating = false;
          alert(err.error?.message || 'Failed to update review status.');
        },
      });
  }

  promptReject(): void {
    const reason = prompt('Please enter the compliance reason for rejecting this verification:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('A valid rejection reason is required.');
      return;
    }
    this.updateStatus('REJECTED', reason.trim());
  }
}
