import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../../core/services/rental.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-rent-tracking',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Back Navigation -->
      <button
        (click)="goBack()"
        type="button"
        class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Property Details
      </button>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching rent tracking records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Unable to load rent tracking"
        [message]="errorMessage"
        (retry)="loadRentRecords()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && records.length === 0"
        title="No rent tracking records for this property"
        message="Rent tracking cycles are generated automatically when a tenant agreement is activated."
      ></app-empty-state>

      <!-- Rent Records Table -->
      <div *ngIf="!isLoading && !isError && records.length > 0" class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h1 class="text-lg font-extrabold text-[#0F2937]">Monthly Rent Collection Records</h1>
          <span class="text-xs text-slate-400 font-semibold">Payment Status Architecture</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-extrabold">
                <th class="py-3 px-4">Cycle / Due Date</th>
                <th class="py-3 px-4">Amount</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Payment Date</th>
                <th class="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-semibold">
              <tr *ngFor="let rec of records" class="hover:bg-slate-50/60 transition-colors">
                <td class="py-3 px-4 text-slate-900 font-bold">
                  {{ rec.dueDate | date: 'mediumDate' }}
                </td>
                <td class="py-3 px-4 text-[#0F2937] font-extrabold">
                  {{ formatRent(rec.amount) }}
                </td>
                <td class="py-3 px-4">
                  <app-status-badge [status]="rec.status"></app-status-badge>
                </td>
                <td class="py-3 px-4 text-slate-600">
                  {{ rec.paidDate ? (rec.paidDate | date: 'mediumDate') : '—' }}
                </td>
                <td class="py-3 px-4 text-slate-500">
                  {{ rec.notes || 'Monthly rent cycle' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class OwnerRentTrackingComponent implements OnInit {
  propertyId: string = '';
  records: any[] = [];

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rentalService: RentalService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadRentRecords();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid property ID.';
      this.isLoading = false;
    }
  }

  loadRentRecords(): void {
    this.isLoading = true;
    this.isError = false;

    this.rentalService.getRentRecordsByPropertyId(this.propertyId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.records = res.data;
        } else {
          this.records = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load rent tracking records.';
      },
    });
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  goBack(): void {
    this.router.navigate(['/owner/properties', this.propertyId]);
  }
}
