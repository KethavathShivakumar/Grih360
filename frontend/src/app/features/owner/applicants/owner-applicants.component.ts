import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-applicants',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header Bar -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Tenant Applicants</h1>
          <p class="text-xs text-slate-500">Review rental applications submitted for your properties.</p>
        </div>
        <button
          *ngIf="propertyId"
          (click)="goBackToProperties()"
          type="button"
          class="text-xs font-bold text-[#0F2937] hover:text-[#2D7A5E]"
        >
          ← Back to Properties
        </button>
      </div>

      <!-- Stitch Request Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading tenant applications..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load applications"
        [message]="errorMessage"
        (retry)="loadApplications()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && applications.length === 0"
        title="No tenant applications received yet"
        message="Applications submitted by prospective tenants will appear here for review."
      ></app-empty-state>

      <!-- Applications List -->
      <div *ngIf="!isLoading && !isError && applications.length > 0" class="space-y-4">
        <div
          *ngFor="let app of applications"
          (click)="viewApplicantDetails(app)"
          class="bento-card bg-white p-5 border border-[#E8E6DF] hover:border-[#2D7A5E] transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 rounded-full bg-[#0F2937] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
              {{ getApplicantInitial(app) }}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <app-status-badge [status]="app.status"></app-status-badge>
                <span class="text-[11px] text-slate-400 font-semibold">Submitted {{ getAppDate(app) | date: 'mediumDate' }}</span>
              </div>
              <h3 class="text-base font-bold text-slate-900 mt-1">{{ getApplicantName(app) }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">Property: {{ getPropertyTitle(app) }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div>
              <span class="block text-[10px] text-slate-400 font-bold uppercase">Proposed Rent</span>
              <span class="text-sm font-extrabold text-[#0F2937]">{{ formatRent(app.proposedRent) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 font-bold uppercase">Move-In Date</span>
              <span class="text-xs font-bold text-slate-700">{{ app.moveInDate | date: 'mediumDate' }}</span>
            </div>
            <button
              (click)="viewApplicantDetails(app); $event.stopPropagation()"
              type="button"
              class="px-3.5 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Review Applicant →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerApplicantsComponent implements OnInit {
  propertyId: string = '';
  applications: RentalApplication[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.isError = false;

    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          if (this.propertyId) {
            this.applications = res.data.filter((a: any) => {
              const pId = a.propertyId?._id || a.propertyId?.id || a.propertyId;
              return pId === this.propertyId;
            });
          } else {
            this.applications = res.data;
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load applications.';
      },
    });
  }

  getApplicantName(app: RentalApplication): string {
    const tenant = (app as any)?.tenantId;
    return tenant?.name || tenant?.fullName || 'Applicant User';
  }

  getApplicantInitial(app: RentalApplication): string {
    return this.getApplicantName(app).charAt(0).toUpperCase();
  }

  getPropertyTitle(app: RentalApplication): string {
    return (app as any)?.propertyId?.title || 'Rental Listing';
  }

  getAppDate(app: RentalApplication): string {
    return app.createdAt || new Date().toISOString();
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  viewApplicantDetails(app: RentalApplication): void {
    const pId = (app as any)?.propertyId?._id || (app as any)?.propertyId?.id || this.propertyId || 'all';
    this.router.navigate(['/owner/properties', pId, 'applicants', app.id]);
  }

  goBackToProperties(): void {
    this.router.navigate(['/owner/properties']);
  }
}
