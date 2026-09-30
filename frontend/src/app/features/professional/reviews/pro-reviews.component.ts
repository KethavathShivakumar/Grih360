import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile } from '../../../core/services/professional.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-pro-reviews',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B] mb-1">
            <a routerLink="/professional/dashboard" class="hover:text-[#0F2937]">Professional Dashboard</a>
            <span>/</span>
            <span class="text-[#0F2937]">Client Reviews</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Customer Reviews & Ratings</h1>
          <p class="text-xs text-slate-500">Verified feedback and star ratings submitted by tenants after completed jobs.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/history"
            class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl shadow-xs transition"
          >
            📋 Job History
          </a>
          <app-customer-care></app-customer-care>
        </div>
      </div>

      <app-loading-state *ngIf="isLoading" message="Fetching customer reviews..."></app-loading-state>
      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadReviews()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage" class="space-y-6">
        <!-- Rating Metrics Bento Card -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <!-- Overall Score -->
            <div class="text-center md:text-left space-y-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Aggregate Rating</span>
              <div class="flex items-baseline justify-center md:justify-start gap-2">
                <span class="text-4xl sm:text-5xl font-black text-[#0F2937]">
                  {{ profile?.rating ? profile?.rating : '5.0' }}
                </span>
                <span class="text-xs font-bold text-slate-400">/ 5.0</span>
              </div>
              <div class="flex items-center justify-center md:justify-start text-amber-400 text-lg">
                ⭐⭐⭐⭐⭐
              </div>
              <p class="text-xs text-slate-500 font-medium">
                Based on {{ reviews.length }} verified completed service reviews
              </p>
            </div>

            <!-- Breakdown Bars -->
            <div class="md:col-span-2 space-y-2">
              <div *ngFor="let star of [5, 4, 3, 2, 1]" class="flex items-center gap-3 text-xs">
                <span class="w-12 font-bold text-slate-600">{{ star }} Stars</span>
                <div class="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-400 rounded-full transition-all"
                    [style.width.%]="getStarPercentage(star)"
                  ></div>
                </div>
                <span class="w-8 text-right font-semibold text-slate-400">{{ getStarCount(star) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="reviews.length === 0">
          <app-empty-state
            title="No Reviews Yet"
            message="As you complete service jobs and provide quality craftsmanship, verified client reviews will appear here."
            actionText="View Active Jobs →"
            actionRoute="/professional/active-job"
          ></app-empty-state>
        </div>

        <!-- Reviews Feed -->
        <div *ngIf="reviews.length > 0" class="space-y-4">
          <h2 class="text-base font-black text-[#0F2937]">Recent Customer Reviews</h2>

          <div
            *ngFor="let rev of reviews"
            class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-3"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-[#0F2937] text-white flex items-center justify-center font-black text-sm">
                  {{ (rev.reviewerId?.name || 'T')[0] }}
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0F2937]">
                    {{ rev.reviewerId?.name || 'Tenant Resident' }}
                  </h3>
                  <div class="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold">
                    <span>Verified Home Tenant</span>
                    <span>&bull;</span>
                    <span>{{ rev.createdAt | date: 'mediumDate' }}</span>
                  </div>
                </div>
              </div>

              <!-- Star Rating -->
              <div class="flex items-center space-x-1 text-sm text-amber-500 font-bold">
                <span>{{ '★'.repeat(rev.rating) }}{{ '☆'.repeat(5 - rev.rating) }}</span>
                <span class="text-xs font-black text-slate-800 ml-1">({{ rev.rating }}.0)</span>
              </div>
            </div>

            <p class="text-xs text-slate-700 leading-relaxed font-medium bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E8E6DF]">
              "{{ rev.comment }}"
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProReviewsComponent implements OnInit {
  public profile?: ProfessionalProfile;
  public reviews: any[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(private proService: ProfessionalService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  public loadReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.proService.getMyProfile().subscribe({
      next: (profileRes) => {
        this.profile = profileRes.data;
        this.proService.getMyReviews().subscribe({
          next: (revRes) => {
            this.reviews = revRes.data || [];
            this.isLoading = false;
          },
          error: () => {
            // Fallback: try by profile.userId
            const uid = this.profile?.userId?._id || this.profile?.userId;
            if (uid) {
              this.proService.getReviews(uid).subscribe({
                next: (rRes) => {
                  this.reviews = rRes.data || [];
                  this.isLoading = false;
                },
                error: (err) => {
                  this.errorMessage = err.error?.message || 'Failed to fetch reviews';
                  this.isLoading = false;
                },
              });
            } else {
              this.isLoading = false;
            }
          },
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load profile';
        this.isLoading = false;
      },
    });
  }

  public getStarCount(stars: number): number {
    return this.reviews.filter((r) => Math.round(Number(r.rating)) === stars).length;
  }

  public getStarPercentage(stars: number): number {
    if (this.reviews.length === 0) return 0;
    return Math.round((this.getStarCount(stars) / this.reviews.length) * 100);
  }
}
