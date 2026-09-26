import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-tenant-applications',
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
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Rental Applications</h1>
          <p class="text-xs text-slate-500">Track application statuses and owner updates in real-time.</p>
        </div>
        <button
          (click)="goToFindHomes()"
          type="button"
          class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          Find New Home
        </button>
      </div>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Retrieving your applications..."></app-loading-state>

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
        title="No rental applications submitted"
        message="You haven't submitted any rental applications yet. Discover available homes and click 'Apply Now'."
        actionText="Discover Homes"
        (action)="goToFindHomes()"
      ></app-empty-state>

      <!-- Applications List Grid -->
      <div *ngIf="!isLoading && !isError && applications.length > 0" class="space-y-4">
        <div
          *ngFor="let app of applications"
          (click)="viewApplicationDetails(app.id)"
          class="bento-card bg-white p-5 border border-[#E8E6DF] hover:border-[#2D7A5E] transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
              <img
                [src]="getPropertyImage(app)"
                [alt]="getPropertyTitle(app)"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <app-status-badge [status]="app.status"></app-status-badge>
                <span class="text-[11px] text-slate-400 font-semibold">Submitted {{ getAppDate(app) | date: 'mediumDate' }}</span>
              </div>
              <h3 class="text-base font-bold text-slate-900 mt-1">{{ getPropertyTitle(app) }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ getPropertyLocation(app) }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div class="text-left md:text-right">
              <span class="block text-[10px] text-slate-400 font-bold uppercase">Proposed Rent</span>
              <span class="text-sm font-extrabold text-[#0F2937]">{{ formatRent(app.proposedRent) }}</span>
            </div>
            <div class="text-left md:text-right">
              <span class="block text-[10px] text-slate-400 font-bold uppercase">Move-In Date</span>
              <span class="text-xs font-bold text-slate-700">{{ app.moveInDate | date: 'mediumDate' }}</span>
            </div>
            <button
              (click)="viewApplicationDetails(app.id); $event.stopPropagation()"
              type="button"
              class="px-3 py-1.5 bg-slate-100 hover:bg-[#2D7A5E] hover:text-white text-slate-700 text-xs font-bold rounded-md transition-colors"
            >
              Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TenantApplicationsComponent implements OnInit {
  applications: RentalApplication[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private applicationService: ApplicationService,
    private moneyService: MoneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.isError = false;

    this.applicationService.getApplications().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.applications = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load rental applications.';
      },
    });
  }

  getAppDate(app: RentalApplication): string {
    return app.createdAt || new Date().toISOString();
  }

  getPropertyTitle(app: RentalApplication): string {
    return (app as any)?.propertyId?.title || 'Rental Property';
  }

  getPropertyLocation(app: RentalApplication): string {
    const loc = (app as any)?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address}, ${loc.city}` : 'Nivas360 Location';
  }

  getPropertyImage(app: RentalApplication): string {
    const images = (app as any)?.propertyId?.images;
    return images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  viewApplicationDetails(id: string): void {
    this.router.navigate(['/tenant/applications', id]);
  }

  goToFindHomes(): void {
    this.router.navigate(['/tenant/homes']);
  }
}
