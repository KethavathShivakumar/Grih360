import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VerificationService, RentalVerification } from '../../../core/services/verification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">

      <!-- Status Timeline Bar -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Rental Lifecycle Timeline</h2>
        <div class="grid grid-cols-5 text-center text-xs font-medium">
          <div class="text-emerald-600 font-bold">1. Applied ✓</div>
          <div [ngClass]="{'text-emerald-600 font-bold': verification?.status === 'VERIFIED', 'text-indigo-600 font-bold': verification?.status === 'UNDER_REVIEW', 'text-slate-400': verification?.status === 'NOT_STARTED'}">
            2. Verification {{ verification?.status === 'VERIFIED' ? '✓' : '' }}
          </div>
          <div class="text-slate-400">3. Under Review</div>
          <div class="text-slate-400">4. Agreement</div>
          <div class="text-slate-400">5. Active Rental</div>
        </div>
      </div>

      <!-- Main Verification Card -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div class="flex items-center justify-between border-b pb-4">
          <div>
            <h1 class="text-xl font-bold text-slate-800">Identity Verification</h1>
            <p class="text-sm text-slate-500">Required for official lease agreement processing</p>
          </div>
          <app-status-badge [status]="verification?.status || 'NOT_STARTED'"></app-status-badge>
        </div>

        <!-- Privacy Shield Notice -->
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start space-x-3 text-sm text-indigo-900">
          <svg class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 002-2H4a2 2 0 00-2 2v6a2 2 0 002 2zm8-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <div>
            <span class="font-bold">Protected Sensitive Storage:</span> Identity verification details are kept strictly in isolated, encrypted storage. Raw identity documents are <span class="font-bold underline">NEVER</span> exposed to property owners or stored in public image repositories.
          </div>
        </div>

        <!-- Current Status Banner -->
        <div *ngIf="verification?.status === 'VERIFIED'" class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center justify-between">
          <div class="flex items-center space-x-2 font-medium">
            <span>✅ Identity Verified Successfully!</span>
          </div>
          <a routerLink="/tenant/applications" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">Back to Applications</a>
        </div>

        <div *ngIf="verification?.status === 'UNDER_REVIEW'" class="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg space-y-1">
          <div class="font-bold text-sm">⏳ Verification Under Administrative Review</div>
          <p class="text-xs">Your verification details have been received. Administrative verification is in progress. No further action is required from you at this time.</p>
        </div>

        <div *ngIf="verification?.status === 'REJECTED'" class="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-lg space-y-1">
          <div class="font-bold text-sm">❌ Verification Review Action Required</div>
          <p class="text-xs">Reason: {{ verification?.rejectionReason || 'Verification document invalid or unreadable.' }}</p>
          <p class="text-xs font-medium">Please re-submit valid identification details below.</p>
        </div>

        <!-- Submission Form (Visible when NOT_STARTED or REJECTED) -->
        <form *ngIf="!verification || verification.status === 'NOT_STARTED' || verification.status === 'REJECTED'" (ngSubmit)="submit()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Select Identity Document Type</label>
            <select [(ngModel)]="documentType" name="documentType" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="DRIVING_LICENSE">Driving License</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Document Identifier Number (Masked)</label>
            <input type="text" [(ngModel)]="documentNumber" name="documentNumber" placeholder="e.g. XXXX-XXXX-5678" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"/>
            <p class="text-xs text-slate-500 mt-1">For your security, only the last 4 digits are retained for audit logs.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Additional Notes / Information</label>
            <textarea [(ngModel)]="notes" name="notes" rows="2" placeholder="Optional notes for verification officer..." class="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <button type="submit" [disabled]="submitting" class="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
            {{ submitting ? 'Submitting Verification...' : 'Submit Verification Information' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class TenantVerificationComponent implements OnInit {
  public verification: RentalVerification | null = null;
  public documentType = 'AADHAAR';
  public documentNumber = '';
  public notes = '';
  public submitting = false;

  constructor(
    private verificationService: VerificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVerification();
  }

  loadVerification(): void {
    this.verificationService.getTenantVerification().subscribe({
      next: (res) => {
        if (res.success) {
          this.verification = res.data;
        }
      },
      error: (err) => console.error(err),
    });
  }

  submit(): void {
    if (!this.documentType) return;
    this.submitting = true;
    this.verificationService.submitVerification(this.documentType, this.documentNumber, this.notes).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.verification = res.data;
        }
      },
      error: (err) => {
        this.submitting = false;
        alert(err.error?.message || 'Submission failed');
      },
    });
  }
}
