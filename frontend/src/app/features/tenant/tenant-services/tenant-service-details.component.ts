import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestItem } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-service-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/tenant/services" class="hover:text-[#0F2937]">Home Services</a>
        <span>/</span>
        <a routerLink="/tenant/services/requests" class="hover:text-[#0F2937]">My Requests</a>
        <span>/</span>
        <span class="text-[#0F2937]">Request Details</span>
      </div>

      <app-loading-state *ngIf="isLoading" message="Loading request details..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadDetails()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage && request" class="space-y-6 max-w-5xl mx-auto">
        <!-- Header Container -->
        <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center space-x-3">
              <span class="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] text-[#0F2937] text-xs font-bold rounded-md uppercase">
                {{ request.categoryCode }}
              </span>
              <app-status-badge [status]="request.status"></app-status-badge>
            </div>
            <h1 class="text-xl font-black text-[#0F2937] mt-2">{{ request.description }}</h1>
            <p class="text-xs text-[#64748B]">Scheduled Date: <strong>{{ request.scheduledDate | date: 'fullDate' }}</strong> ({{ request.preferredTimeWindow || 'Flexible' }})</p>
          </div>
          <app-customer-care></app-customer-care>
        </div>

        <!-- Service Timeline Bento Card -->
        <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-4">
          <h2 class="text-sm font-bold text-[#0F2937]">Service Lifecycle Progress</h2>
          <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-bold">
            <div [class]="getTimelineClass('REQUESTED')" class="p-3 rounded-xl border">
              1. Submitted
            </div>
            <div [class]="getTimelineClass('MATCHING')" class="p-3 rounded-xl border">
              2. Matching
            </div>
            <div [class]="getTimelineClass('ASSIGNED')" class="p-3 rounded-xl border">
              3. Assigned
            </div>
            <div [class]="getTimelineClass('ACCEPTED')" class="p-3 rounded-xl border">
              4. Accepted
            </div>
            <div [class]="getTimelineClass('IN_PROGRESS')" class="p-3 rounded-xl border">
              5. In Progress
            </div>
            <div [class]="getTimelineClass('COMPLETED')" class="p-3 rounded-xl border">
              6. Completed
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Request Information -->
          <div class="md:col-span-2 bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-4">
            <h2 class="text-base font-bold text-[#0F2937]">Request Details</h2>
            <div class="space-y-3 text-xs text-[#0F2937]">
              <div>
                <strong class="text-[#64748B] block">Service Category:</strong>
                <span>{{ request.categoryCode }}</span>
              </div>
              <div>
                <strong class="text-[#64748B] block">Issue Description:</strong>
                <p class="mt-1 p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] text-xs leading-relaxed">{{ request.description }}</p>
              </div>
              <div>
                <strong class="text-[#64748B] block">Service Address:</strong>
                <span>📍 {{ request.serviceLocation?.address }}, {{ request.serviceLocation?.city }}, {{ request.serviceLocation?.state }} - {{ request.serviceLocation?.pincode }}</span>
              </div>
              <div>
                <strong class="text-[#64748B] block">Estimated Cost:</strong>
                <span class="text-[#2D7A5E] font-bold">
                  {{ request.estimatedCost ? ('₹' + request.estimatedCost) : 'Price will be confirmed by the service provider' }}
                </span>
              </div>
              <div *ngIf="request.completion">
                <strong class="text-[#64748B] block">Completion Notes:</strong>
                <p class="mt-1 p-3 bg-[#EBF5F0] border border-[#D1EADF] text-[#2D7A5E] rounded-xl font-medium">
                  {{ request.completion.notes || 'Job completed successfully' }} (Completed at {{ request.completion.completedAt | date: 'short' }})
                </p>
              </div>
              <div *ngIf="request.cancellation" class="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] rounded-xl space-y-1">
                <strong>Request Cancelled</strong>
                <p>Reason: {{ request.cancellation.reason }}</p>
              </div>
            </div>

            <!-- Cancel Action -->
            <div *ngIf="canCancel()" class="pt-4 border-t border-[#E8E6DF]">
              <div *ngIf="!showCancelBox">
                <button (click)="showCancelBox = true" class="px-4 py-2 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2] text-xs font-bold rounded-xl transition">
                  Cancel Service Request
                </button>
              </div>
              <div *ngIf="showCancelBox" class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl space-y-3">
                <h3 class="text-xs font-bold text-[#0F2937]">Specify Cancellation Reason</h3>
                <textarea
                  [(ngModel)]="cancelReason"
                  rows="2"
                  placeholder="Reason for cancellation..."
                  class="w-full p-2 border border-[#E8E6DF] rounded-lg text-xs"
                ></textarea>
                <div class="flex items-center space-x-2">
                  <button (click)="cancelRequest()" [disabled]="isActionLoading" class="px-4 py-1.5 bg-[#B91C1C] text-white text-xs font-bold rounded-lg disabled:opacity-50">
                    Confirm Cancellation
                  </button>
                  <button (click)="showCancelBox = false" class="px-4 py-1.5 bg-white border border-[#E8E6DF] text-xs font-bold rounded-lg">
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Professional Summary Sidebar & Review Section -->
          <div class="space-y-6">
            <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-4">
              <h2 class="text-base font-bold text-[#0F2937]">Assigned Professional</h2>

              <div *ngIf="!request.professionalId" class="p-4 bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-medium rounded-xl">
                ⚙️ Matching in progress. We are finding available professionals in your area.
              </div>

              <div *ngIf="request.professionalId" class="space-y-3 text-xs">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full bg-[#0F2937] text-white font-bold flex items-center justify-center text-sm">
                    {{ (request.professionalId.name || 'P')[0] }}
                  </div>
                  <div>
                    <h3 class="font-bold text-[#0F2937] text-sm">{{ request.professionalId.name || 'Assigned Professional' }}</h3>
                    <p class="text-[#64748B] text-[11px]">{{ proProfile?.businessName || 'Nivas360 Verified Specialist' }}</p>
                  </div>
                </div>

                <div class="p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[#64748B]">Rating:</span>
                    <span *ngIf="proProfile && proProfile.reviewCount > 0" class="font-bold text-[#2D7A5E]">
                      ⭐ {{ proProfile.rating.toFixed(1) }} ({{ proProfile.reviewCount }} verified {{ proProfile.reviewCount === 1 ? 'review' : 'reviews' }})
                    </span>
                    <span *ngIf="!proProfile || proProfile.reviewCount === 0" class="font-semibold text-slate-400">
                      No reviews yet
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[#64748B]">Experience:</span>
                    <span class="font-semibold text-[#0F2937]">{{ proProfile?.experienceYears || 1 }} Years</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Existing Submitted Review Card -->
            <div *ngIf="myReview" class="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
                  ✓ Your Verified Review
                </span>
                <div class="flex items-center space-x-1 text-sm text-amber-500 font-bold">
                  <span>{{ '★'.repeat(myReview.rating) }}{{ '☆'.repeat(5 - myReview.rating) }}</span>
                  <span class="text-xs font-black text-slate-800 ml-1">({{ myReview.rating }}.0)</span>
                </div>
              </div>
              <p class="text-xs text-slate-700 font-medium bg-[#FAF9F5] p-3 rounded-xl border border-slate-200 leading-relaxed">
                "{{ myReview.comment }}"
              </p>
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Submitted on {{ myReview.createdAt | date: 'mediumDate' }}</span>
                <span class="text-emerald-700 font-bold">Verified Database Record</span>
              </div>
            </div>

            <!-- Review Submission Form (Only when COMPLETED and not yet reviewed) -->
            <div *ngIf="request.status === 'COMPLETED' && !myReview" class="bg-white p-6 rounded-2xl border border-[#D1EADF] shadow-sm space-y-4">
              <div class="flex items-center space-x-2">
                <span class="text-lg">⭐</span>
                <h2 class="text-base font-bold text-[#0F2937]">Leave Service Review</h2>
              </div>
              <p class="text-xs text-slate-500">
                Share your real feedback for the completed service. Only verified customers can submit reviews.
              </p>

              <div *ngIf="reviewSuccess" class="p-3 bg-[#EBF5F0] text-[#2D7A5E] text-xs font-bold rounded-xl">
                Thank you! Your verified review was recorded and updated the specialist's aggregate rating.
              </div>

              <div *ngIf="!reviewSuccess" class="space-y-3">
                <div *ngIf="reviewError" class="p-2 bg-[#FEF2F2] text-[#B91C1C] text-xs font-bold rounded-lg">
                  {{ reviewError }}
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#0F2937] mb-1">Rating (1 to 5 Stars)</label>
                  <select [(ngModel)]="reviewRating" class="w-full p-2 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs font-bold text-[#0F2937]">
                    <option [value]="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                    <option [value]="4">⭐⭐⭐⭐ 4 - Very Good</option>
                    <option [value]="3">⭐⭐⭐ 3 - Satisfactory</option>
                    <option [value]="2">⭐⭐ 2 - Poor</option>
                    <option [value]="1">⭐ 1 - Very Poor</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#0F2937] mb-1">Your Feedback</label>
                  <textarea [(ngModel)]="reviewComment" rows="3" placeholder="Share your experience with the service..." class="w-full p-2 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs text-[#0F2937]"></textarea>
                </div>

                <button (click)="submitReview()" [disabled]="isSubmittingReview" class="w-full py-2.5 bg-[#2D7A5E] hover:bg-[#206f54] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50">
                  {{ isSubmittingReview ? 'Submitting...' : 'Submit Verified Review' }}
                </button>
              </div>
            </div>

            <!-- Informational Note for In-Progress / Pending Requests -->
            <div *ngIf="request.status !== 'COMPLETED' && !myReview" class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl text-xs text-slate-500 font-medium">
              ℹ️ Customer reviews can only be submitted after the service request is marked <strong>COMPLETED</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TenantServiceDetailsComponent implements OnInit {
  public requestId: string = '';
  public request?: ServiceRequestItem;
  public proProfile?: any;
  public isLoading: boolean = true;
  public errorMessage: string = '';

  public showCancelBox: boolean = false;
  public cancelReason: string = '';
  public isActionLoading: boolean = false;

  public reviewRating: number = 5;
  public reviewComment: string = '';
  public isSubmittingReview: boolean = false;
  public reviewError: string = '';
  public reviewSuccess: boolean = false;

  public existingReviews: any[] = [];
  public myReview: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceReqService: ServiceRequestService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.requestId = params['id'];
      if (this.requestId) {
        this.loadDetails();
      }
    });
  }

  public loadDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.serviceReqService.getRequestById(this.requestId).subscribe({
      next: (res) => {
        this.request = res.data?.request;
        this.proProfile = res.data?.professionalProfile;
        this.isLoading = false;

        // Fetch verified reviews for this service request
        this.loadReviews();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load service request details';
        this.isLoading = false;
      },
    });
  }

  public loadReviews(): void {
    if (!this.requestId) return;
    this.serviceReqService.getServiceReviews(this.requestId).subscribe({
      next: (rRes) => {
        this.existingReviews = rRes.data || [];
        this.checkMyReview();
      },
      error: () => {
        this.existingReviews = [];
      },
    });
  }

  private checkMyReview(): void {
    const user = this.authService.getCurrentUser();
    const currentUserId = user?.id || (user as any)?._id;
    if (!currentUserId || !this.existingReviews.length) {
      this.myReview = null;
      return;
    }

    this.myReview = this.existingReviews.find((r) => {
      const revId =
        r.reviewerId?._id ||
        r.reviewerId?.id ||
        r.reviewerId ||
        r.reviewer?._id ||
        r.reviewer?.id ||
        r.reviewer;
      return revId === currentUserId;
    });
  }

  public getTimelineClass(stepStatus: string): string {
    const statuses = ['REQUESTED', 'MATCHING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    const currentIdx = statuses.indexOf(this.request?.status || '');
    const stepIdx = statuses.indexOf(stepStatus);

    if (this.request?.status === stepStatus) {
      return 'bg-[#2D7A5E] text-white border-[#2D7A5E] shadow-sm';
    } else if (currentIdx > stepIdx && currentIdx !== -1) {
      return 'bg-[#EBF5F0] text-[#2D7A5E] border-[#D1EADF]';
    } else {
      return 'bg-[#FAF9F5] text-[#64748B] border-[#E8E6DF]';
    }
  }

  public canCancel(): boolean {
    return ['REQUESTED', 'MATCHING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(this.request?.status || '');
  }

  public cancelRequest(): void {
    if (!this.cancelReason || this.cancelReason.trim() === '') {
      alert('Please enter a reason for cancellation.');
      return;
    }
    this.isActionLoading = true;
    this.serviceReqService.cancelRequest(this.requestId, this.cancelReason).subscribe({
      next: () => {
        this.isActionLoading = false;
        this.showCancelBox = false;
        this.loadDetails();
      },
      error: (err) => {
        this.isActionLoading = false;
        alert(err.error?.message || 'Failed to cancel request');
      },
    });
  }

  public submitReview(): void {
    if (!this.reviewComment || this.reviewComment.trim() === '') {
      this.reviewError = 'Please enter a review comment.';
      return;
    }
    this.reviewError = '';
    this.isSubmittingReview = true;

    this.serviceReqService.submitReview(this.requestId, Number(this.reviewRating), this.reviewComment).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        this.reviewSuccess = true;
        this.loadDetails();
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.reviewError = err.error?.message || 'Failed to submit review';
      },
    });
  }
}
