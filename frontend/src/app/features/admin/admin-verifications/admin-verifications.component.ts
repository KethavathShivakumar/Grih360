import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationService, RentalVerification } from '../../../core/services/verification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">
      

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Identity Verification Queue</h1>
          <p class="text-sm text-slate-500">Authorized administrative verification review portal</p>
        </div>
        <button (click)="loadQueue()" class="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-200">Refresh Queue</button>
      </div>

      <div *ngIf="loading" class="text-center py-12 text-slate-500">Loading verification queue...</div>

      <div *ngIf="!loading && queue.length === 0" class="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-500">
        No verifications currently pending administrative review.
      </div>

      <div *ngIf="!loading && queue.length > 0" class="space-y-4">
        <div *ngFor="let item of queue" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <div>
              <span class="text-xs text-slate-400 block">Tenant ID: {{ item.tenantId }}</span>
              <span class="text-sm font-bold text-slate-800">Document Type: {{ item.documentType || 'Identity Doc' }}</span>
            </div>
            <app-status-badge [status]="item.status"></app-status-badge>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
            <div>
              <span class="font-semibold block text-slate-700">Masked ID</span>
              {{ item.maskedNumber || 'DOCUMENT-PROVIDED' }}
            </div>
            <div>
              <span class="font-semibold block text-slate-700">Submitted At</span>
              {{ item.submittedAt | date:'short' }}
            </div>
            <div>
              <span class="font-semibold block text-slate-700">Notes</span>
              {{ item.notes || 'No extra notes' }}
            </div>
          </div>

          <!-- Action Controls -->
          <div class="flex items-center justify-end space-x-3 pt-2">
            <button (click)="review(item, 'VERIFIED')" class="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-xs hover:bg-emerald-700">
              Approve (Mark Verified)
            </button>
            <button (click)="reject(item)" class="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg text-xs hover:bg-rose-700">
              Reject Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminVerificationsComponent implements OnInit {
  public queue: RentalVerification[] = [];
  public loading = true;

  constructor(private verificationService: VerificationService) {}

  ngOnInit(): void {
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.verificationService.getAdminQueue().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.queue = res.data;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  review(item: RentalVerification, status: 'VERIFIED' | 'REJECTED', reason?: string): void {
    const tenantId = typeof item.tenantId === 'object' ? (item.tenantId as any)._id : item.tenantId;
    this.verificationService.reviewVerification(tenantId, status, reason).subscribe({
      next: (res) => {
        if (res.success) {
          alert(`Verification marked as ${status}`);
          this.loadQueue();
        }
      },
      error: (err) => alert(err.error?.message || 'Review action failed'),
    });
  }

  reject(item: RentalVerification): void {
    const reason = prompt('Please enter rejection reason for tenant:');
    if (reason === null) return;
    this.review(item, 'REJECTED', reason);
  }
}
