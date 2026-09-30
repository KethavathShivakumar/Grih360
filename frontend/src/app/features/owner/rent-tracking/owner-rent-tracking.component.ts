import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RentalService } from '../../../core/services/rental.service';
import { PropertyService } from '../../../core/services/property.service';
import { MoneyService } from '../../../core/services/money.service';
import { Property } from '../../../shared/models/property.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-rent-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Back Navigation & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          (click)="goBack()"
          type="button"
          class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {{ isSpecificProperty ? 'Back to Property Details' : 'Back to Dashboard' }}
        </button>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500">Automated UPI & Bank Reconciliation</span>
        </div>
      </div>

      <!-- Header Title -->
      <div>
        <div class="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-0.5 rounded-full text-xs font-bold border border-amber-200 mb-1.5">
          <span>💰 Rent Collection & Financial Ledger</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Rent Tracking & Records</h1>
        <p class="text-xs text-slate-500">Track monthly billing cycles, digital rent payments, auto-invoicing, and tenant payment receipts.</p>
      </div>

      <!-- Property Selector (when in portfolio-wide view) -->
      <div *ngIf="!isSpecificProperty && properties.length > 1" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span class="text-xs font-bold text-slate-700">Select Property Listing:</span>
        <select
          [(ngModel)]="selectedPropertyId"
          (ngModelChange)="onPropertyChange()"
          class="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#2D7A5E]"
        >
          <option *ngFor="let p of properties" [value]="p.id">
            {{ p.title }} ({{ p.propertyLocation.locality || p.propertyLocation.city }})
          </option>
        </select>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching rent collection records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Unable to load rent tracking"
        [message]="errorMessage"
        (retry)="loadData()"
      ></app-error-state>

      <!-- Empty State: No Properties -->
      <app-empty-state
        *ngIf="!isLoading && !isError && properties.length === 0 && !isSpecificProperty"
        title="No properties listed yet"
        message="List your residential property to activate automated rent collection schedules."
        actionText="Add Property"
        (action)="navigateToAddProperty()"
      ></app-empty-state>

      <!-- Main Content Container -->
      <div *ngIf="!isLoading && !isError && (records.length > 0 || selectedPropertyId)" class="space-y-6">

        <!-- Financial Summary KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed</span>
            <span class="text-xl sm:text-2xl font-black text-[#0F2937] mt-1 block">{{ formatCurrency(totalBilled) }}</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-gradient-to-b from-emerald-50/40 to-white">
            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Collected</span>
            <span class="text-xl sm:text-2xl font-black text-emerald-800 mt-1 block">{{ formatCurrency(totalCollected) }}</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-gradient-to-b from-amber-50/40 to-white">
            <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending / Due</span>
            <span class="text-xl sm:text-2xl font-black text-amber-800 mt-1 block">{{ formatCurrency(totalPending) }}</span>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collection Rate</span>
            <span class="text-xl sm:text-2xl font-black text-[#0F2937] mt-1 block">{{ collectionRate }}%</span>
          </div>
        </div>

        <!-- Empty State: Property has no records yet -->
        <app-empty-state
          *ngIf="records.length === 0"
          title="No rent cycles generated yet"
          message="Rent collection cycles are automatically scheduled on the 1st of every month when a tenant lease agreement is activated."
          actionText="View Active Tenancies"
          (action)="navigateToRentals()"
        ></app-empty-state>

        <!-- Rent Records Table -->
        <div *ngIf="records.length > 0" class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-base font-extrabold text-[#0F2937]">Monthly Rent Collection Ledger</h2>
              <p class="text-xs text-slate-400 font-semibold">Model Tenancy Act compliant rent receipts & payment stamps</p>
            </div>

            <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
              {{ records.length }} Payment Cycles
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                  <th class="py-3 px-4">Cycle / Due Date</th>
                  <th class="py-3 px-4">Rent Amount</th>
                  <th class="py-3 px-4">Payment Status</th>
                  <th class="py-3 px-4">Settlement Date</th>
                  <th class="py-3 px-4">Transaction / Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr *ngFor="let rec of records" class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-3.5 px-4 text-slate-900 font-bold">
                    <span>📅 {{ rec.dueDate | date: 'mediumDate' }}</span>
                  </td>
                  <td class="py-3.5 px-4 text-[#0F2937] font-black text-sm">
                    {{ formatCurrency(rec.amount) }}
                  </td>
                  <td class="py-3.5 px-4">
                    <app-status-badge [status]="rec.status"></app-status-badge>
                  </td>
                  <td class="py-3.5 px-4 text-slate-600">
                    {{ rec.paidDate ? (rec.paidDate | date: 'mediumDate') : 'Pending settlement' }}
                  </td>
                  <td class="py-3.5 px-4 text-slate-500">
                    <span *ngIf="rec.status === 'PAID'" class="text-emerald-700 font-mono text-[11px] font-bold">
                      ✓ REC-{{ rec.id ? rec.id.slice(-6).toUpperCase() : 'ONLINE' }}
                    </span>
                    <span *ngIf="rec.status !== 'PAID'" class="text-slate-400 text-[11px]">
                      Awaiting payment
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerRentTrackingComponent implements OnInit {
  propertyId: string = '';
  selectedPropertyId: string = '';
  isSpecificProperty: boolean = false;

  properties: Property[] = [];
  records: any[] = [];

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rentalService: RentalService,
    private propertyService: PropertyService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.isSpecificProperty = Boolean(this.propertyId);

    if (this.isSpecificProperty) {
      this.selectedPropertyId = this.propertyId;
      this.loadRentRecordsForProperty(this.propertyId);
    } else {
      this.loadAllOwnerProperties();
    }
  }

  loadAllOwnerProperties(): void {
    this.isLoading = true;
    this.isError = false;

    this.propertyService.getOwnerProperties().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.properties = res.data;
          this.selectedPropertyId = this.properties[0].id;
          this.loadRentRecordsForProperty(this.selectedPropertyId);
        } else {
          this.isLoading = false;
          this.properties = [];
          this.records = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load owner properties.';
      },
    });
  }

  loadRentRecordsForProperty(propId: string): void {
    this.isLoading = true;
    this.isError = false;

    this.rentalService.getRentRecordsByPropertyId(propId).subscribe({
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

  onPropertyChange(): void {
    if (this.selectedPropertyId) {
      this.loadRentRecordsForProperty(this.selectedPropertyId);
    }
  }

  loadData(): void {
    if (this.isSpecificProperty) {
      this.loadRentRecordsForProperty(this.propertyId);
    } else {
      this.loadAllOwnerProperties();
    }
  }

  get totalBilled(): number {
    return this.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  get totalCollected(): number {
    return this.records
      .filter((r) => r.status === 'PAID')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  get totalPending(): number {
    return this.records
      .filter((r) => r.status !== 'PAID')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  get collectionRate(): number {
    if (this.totalBilled === 0) return 100;
    return Math.round((this.totalCollected / this.totalBilled) * 100);
  }

  formatCurrency(amount: number): string {
    return this.moneyService.formatINR(amount || 0);
  }

  goBack(): void {
    if (this.isSpecificProperty) {
      this.router.navigate(['/owner/properties', this.propertyId]);
    } else {
      this.router.navigate(['/owner/dashboard']);
    }
  }

  navigateToAddProperty(): void {
    this.router.navigate(['/owner/properties/new']);
  }

  navigateToRentals(): void {
    this.router.navigate(['/owner/rentals']);
  }
}
