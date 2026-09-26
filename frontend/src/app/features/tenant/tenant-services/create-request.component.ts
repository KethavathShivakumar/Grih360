import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceCategoryCode } from '../../../core/services/service-request.service';
import { RentalService } from '../../../core/services/rental.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-create-service-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomerCareComponent, LoadingStateComponent],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/tenant/services" class="hover:text-[#0F2937]">Home Services</a>
        <span>/</span>
        <span class="text-[#0F2937]">New Service Request</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Submit Home Service Request</h1>
          <p class="text-xs text-[#64748B]">Provide your issue description and preferred time window to match with a verified professional.</p>
        </div>
        <app-customer-care></app-customer-care>
      </div>

      

      <!-- Booking Form Bento Container -->
      <div class="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-6">
        <div *ngIf="activeRentalNotice" class="p-4 bg-[#EBF5F0] border border-[#D1EADF] rounded-xl flex items-center justify-between">
          <div class="flex items-center space-x-3 text-xs text-[#2D7A5E] font-medium">
            <span>🏠</span>
            <span>Auto-linked to your current rental: <strong>{{ activeRentalNotice }}</strong></span>
          </div>
          <span class="px-2 py-0.5 bg-[#2D7A5E] text-white text-[10px] font-bold rounded-md">VERIFIED RENTAL</span>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div *ngIf="formError" class="p-4 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs font-bold rounded-xl">
            {{ formError }}
          </div>

          <!-- Category Selection -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Service Category *</label>
            <select
              [(ngModel)]="categoryCode"
              name="categoryCode"
              required
              class="w-full px-4 py-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-sm text-[#0F2937] font-semibold focus:outline-none focus:border-[#0F2937]"
            >
              <option value="PLUMBING">🔧 Plumbing Services</option>
              <option value="ELECTRICAL">⚡ Electrical Services</option>
              <option value="CARPENTRY">🪵 Carpentry & Woodwork</option>
              <option value="PAINTING">🎨 Painting & Wall Touchup</option>
              <option value="CLEANING">✨ Home & Sofa Cleaning</option>
              <option value="AC_APPLIANCE">❄️ AC & Appliance Repair</option>
              <option value="WATER_FILTER">💧 Water Filter & RO</option>
              <option value="GENERAL_MAINTENANCE">⚙️ General Property Maintenance</option>
            </select>
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Issue Description *</label>
            <textarea
              [(ngModel)]="description"
              name="description"
              rows="4"
              required
              placeholder="Describe the issue in detail (e.g. Bathroom washbasin pipe leaking water continuously since morning...)"
              class="w-full px-4 py-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-sm text-[#0F2937] focus:outline-none focus:border-[#0F2937]"
            ></textarea>
          </div>

          <!-- Schedule Date & Time Window -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Preferred Service Date *</label>
              <input
                type="date"
                [(ngModel)]="scheduledDate"
                name="scheduledDate"
                required
                class="w-full px-4 py-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-sm text-[#0F2937] font-medium focus:outline-none focus:border-[#0F2937]"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Preferred Time Window</label>
              <select
                [(ngModel)]="preferredTimeWindow"
                name="preferredTimeWindow"
                class="w-full px-4 py-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-sm text-[#0F2937] font-medium focus:outline-none focus:border-[#0F2937]"
              >
                <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                <option value="12:00 PM - 04:00 PM">Afternoon (12:00 PM - 04:00 PM)</option>
                <option value="04:00 PM - 08:00 PM">Evening (04:00 PM - 08:00 PM)</option>
                <option value="Flexible">Flexible / Any Time</option>
              </select>
            </div>
          </div>

          <!-- Location -->
          <div class="space-y-3 pt-3 border-t border-[#E8E6DF]">
            <h3 class="text-xs font-bold text-[#0F2937] uppercase tracking-wider">Service Location Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2 space-y-1">
                <label class="text-[11px] text-[#64748B]">Street Address</label>
                <input
                  type="text"
                  [(ngModel)]="address"
                  name="address"
                  placeholder="Flat No / House No, Street"
                  class="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E6DF] rounded-lg text-xs text-[#0F2937]"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-[#64748B]">City</label>
                <input
                  type="text"
                  [(ngModel)]="city"
                  name="city"
                  placeholder="Hyderabad / Warangal"
                  class="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E6DF] rounded-lg text-xs text-[#0F2937]"
                />
              </div>
            </div>
          </div>

          <!-- Issue Photo URL -->
          <div class="space-y-2 pt-3 border-t border-[#E8E6DF]">
            <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Optional Photo URL</label>
            <input
              type="text"
              [(ngModel)]="photoUrl"
              name="photoUrl"
              placeholder="https://..."
              class="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E6DF] rounded-lg text-xs text-[#0F2937]"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4">
            <a routerLink="/tenant/services" class="text-xs font-bold text-[#64748B] hover:text-[#0F2937]">Cancel</a>
            <button
              type="submit"
              [disabled]="isSubmitting"
              class="px-8 py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {{ isSubmitting ? 'Submitting & Matching...' : 'Submit Service Request' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CreateServiceRequestComponent implements OnInit {
  public categoryCode: ServiceCategoryCode = 'PLUMBING';
  public description: string = '';
  public scheduledDate: string = '';
  public preferredTimeWindow: string = 'Flexible';
  public address: string = '';
  public city: string = 'Hyderabad';
  public photoUrl: string = '';

  public activeRentalNotice: string = '';
  public formError: string = '';
  public isSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceReqService: ServiceRequestService,
    private rentalService: RentalService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    this.scheduledDate = today.toISOString().split('T')[0];

    this.route.queryParams.subscribe((params) => {
      if (params['category']) this.categoryCode = params['category'] as ServiceCategoryCode;
      if (params['description']) this.description = params['description'];
    });

    this.checkActiveRental();
  }

  private checkActiveRental(): void {
    this.rentalService.getCurrentRental().subscribe({
      next: (res: any) => {
        if (res.data && res.data.propertyId) {
          const prop = res.data.propertyId;
          this.activeRentalNotice = prop.title || 'Current Rental Property';
          if (prop.propertyLocation) {
            this.address = prop.propertyLocation.address || '';
            this.city = prop.propertyLocation.city || 'Hyderabad';
          }
        }
      },
      error: () => {},
    });
  }


  public onSubmit(): void {
    this.formError = '';
    if (!this.description || this.description.trim() === '') {
      this.formError = 'Please provide an issue description.';
      return;
    }
    if (!this.scheduledDate) {
      this.formError = 'Please select a preferred service date.';
      return;
    }

    this.isSubmitting = true;

    const payload = {
      categoryCode: this.categoryCode,
      description: this.description,
      scheduledDate: new Date(this.scheduledDate).toISOString(),
      preferredTimeWindow: this.preferredTimeWindow,
      serviceLocation: {
        address: this.address || 'Service Location',
        city: this.city || 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
      images: this.photoUrl ? [this.photoUrl] : [],
    };

    this.serviceReqService.createRequest(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        const reqId = res.data?._id || res.data?.id;
        if (reqId) {
          this.router.navigate(['/tenant/services/requests', reqId]);
        } else {
          this.router.navigate(['/tenant/services/requests']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err.error?.message || 'Failed to submit service request';
      },
    });
  }
}
