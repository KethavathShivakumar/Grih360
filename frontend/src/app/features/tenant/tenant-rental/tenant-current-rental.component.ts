import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { AgreementService, RentalAgreement as AgreementDoc } from '../../../core/services/agreement.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-current-rental',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      

      <!-- Main Rental Overview Card -->
      <div *ngIf="loading" class="text-center py-12 text-slate-500">Loading current rental information...</div>

      <div *ngIf="!loading && !rental" class="bg-white rounded-xl shadow-sm border p-8 text-center space-y-4">
        <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          🏠
        </div>
        <h2 class="text-lg font-bold text-slate-800">No Active Rental Found</h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto">You do not currently have an active rental agreement. Search for available homes and submit an application to begin.</p>
        <a routerLink="/tenant/homes" class="inline-block px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700">Find Homes</a>
      </div>

      <div *ngIf="!loading && rental" class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Lease Agreement</span>
              <h1 class="text-2xl font-bold text-slate-800">Current Rental Details</h1>
            </div>
            <app-status-badge [status]="rental!.status"></app-status-badge>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
            <div>
              <span class="text-xs text-slate-500 block">Agreed Monthly Rent</span>
              <span class="text-lg font-bold text-slate-900">₹{{ rental!.monthlyRent | number }}</span>
            </div>
            <div>
              <span class="text-xs text-slate-500 block">Security Deposit Paid</span>
              <span class="text-lg font-bold text-slate-900">₹{{ rental!.depositPaid | number }}</span>
            </div>
            <div>
              <span class="text-xs text-slate-500 block">Agreement Version</span>
              <span class="text-sm font-semibold text-indigo-600">{{ rental!.agreementVersion || 'v1.0' }}</span>
            </div>
          </div>

          <!-- Lease Term Dates -->
          <div class="grid grid-cols-2 gap-4 text-xs border-t pt-4 text-slate-600">
            <div>
              <span class="font-semibold text-slate-700 block">Lease Start Date</span>
              {{ rental!.startDate | date:'mediumDate' }}
            </div>
            <div>
              <span class="font-semibold text-slate-700 block">Lease End Date</span>
              {{ rental!.endDate | date:'mediumDate' }}
            </div>
          </div>
        </div>

        <!-- Rent Payment Tracking -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 class="text-lg font-bold text-slate-800">Rent Payment Schedule</h2>
          <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
            <div>
              <div class="text-xs text-indigo-700 font-semibold uppercase">Next Rent Status</div>
              <div class="text-base font-bold text-indigo-900">Status: {{ rental!.rentStatus }}</div>
            </div>
            <span class="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-xs font-bold">Upcoming Cycle</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TenantCurrentRentalComponent implements OnInit {
  public rental: RentalAgreement | null = null;
  public loading = true;

  constructor(private rentalService: RentalService) {}

  ngOnInit(): void {
    this.rentalService.getRentals().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data && res.data.length > 0) {
          this.rental = res.data[0];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }
}
