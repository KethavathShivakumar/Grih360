import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ServiceRequestService, ServiceCategory } from '../../../core/services/service-request.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-tenant-services',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingStateComponent,
    ErrorStateComponent,
    SafeHtmlPipe,
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
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> My Service Requests
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
              <div class="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] flex items-center justify-center text-[#0F2937] group-hover:bg-[#0F2937] group-hover:text-white transition">
                <span [innerHTML]="getCategoryIcon(cat.code) | safeHtml" class="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[1.8]"></span>
              </div>
              <div>
                <h3 class="text-base font-bold text-[#0F2937] group-hover:text-[#2D7A5E] transition">{{ cat.name }}</h3>
                <p class="text-xs text-[#64748B] mt-1 leading-relaxed">{{ cat.description }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-[#E8E6DF] flex items-center justify-between text-xs font-bold text-[#E26D46] group-hover:text-amber-700 transition-colors">
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
      case 'PLUMBING': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
      case 'ELECTRICAL': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
      case 'CARPENTRY': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>';
      case 'PAINTING': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.7 0 1.34.18 1.9.5L18 4.6a2 2 0 012.8 2.8L11.9 16.3c.3.56.5 1.2.5 1.9a4 4 0 01-4 4z"/></svg>';
      case 'CLEANING': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>';
      case 'AC_APPLIANCE': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
      case 'WATER_FILTER': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>';
      case 'GENERAL_MAINTENANCE': return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
      default: return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
    }
  }
}
