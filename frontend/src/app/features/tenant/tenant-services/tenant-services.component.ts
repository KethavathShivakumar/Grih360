import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ServiceRequestService, ServiceCategory } from '../../../core/services/service-request.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-tenant-services',
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
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <!-- Header Banner -->
      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 bg-[#EBF5F0] text-[#2D7A5E] text-xs font-bold rounded-full">Home Maintenance Ecosystem</span>
            <span class="text-xs text-[#64748B] font-medium">Grih360 Verified Network</span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937] mt-1">Home Services</h1>
          <p class="text-xs text-[#64748B]">Book verified local professionals for plumbing, electrical, carpentry, cleaning & appliance repair.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a routerLink="/tenant/services/requests" class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl transition">
            📋 My Service Requests
          </a>
          <a routerLink="/tenant/services/request" class="px-4 py-2 bg-[#E26D46] hover:bg-[#d05c35] text-white text-xs font-bold rounded-xl shadow-sm transition">
            + Request Service
          </a>
        </div>
      </div>

      <!-- Stitch Design Required Banner -->
      

      <!-- Category Grid Section -->
      <div class="space-y-4">
        <h2 class="text-lg font-bold text-[#0F2937]">Service Categories</h2>

        <app-loading-state *ngIf="isLoading" message="Loading service categories..."></app-loading-state>

        <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadCategories()"></app-error-state>

        <div *ngIf="!isLoading && !errorMessage" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            *ngFor="let cat of categories"
            (click)="selectCategory(cat.code)"
            class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div class="space-y-3">
              <div class="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] flex items-center justify-center text-xl text-[#0F2937] group-hover:bg-[#0F2937] group-hover:text-white transition">
                <span>{{ getCategoryIcon(cat.code) }}</span>
              </div>
              <div>
                <h3 class="text-base font-bold text-[#0F2937] group-hover:text-[#2D7A5E] transition">{{ cat.name }}</h3>
                <p class="text-xs text-[#64748B] mt-1 leading-relaxed">{{ cat.description }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-[#E8E6DF] flex items-center justify-between text-xs font-bold text-[#E26D46] group-hover:translate-x-1 transition">
              <span>View Services</span>
              <span>&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TenantServicesComponent implements OnInit {
  public categories: ServiceCategory[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(private serviceReqService: ServiceRequestService, private router: Router) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  public loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.serviceReqService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load service categories';
        this.isLoading = false;
      },
    });
  }

  public selectCategory(code: string): void {
    this.router.navigate(['/tenant/services', code]);
  }

  public getCategoryIcon(code: string): string {
    switch (code) {
      case 'PLUMBING': return '🔧';
      case 'ELECTRICAL': return '⚡';
      case 'CARPENTRY': return '🪵';
      case 'PAINTING': return '🎨';
      case 'CLEANING': return '✨';
      case 'AC_APPLIANCE': return '❄️';
      case 'WATER_FILTER': return '💧';
      case 'GENERAL_MAINTENANCE': return '⚙️';
      default: return '🛠️';
    }
  }
}
