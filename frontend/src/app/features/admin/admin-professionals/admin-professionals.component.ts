import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile, VerificationStatus } from '../../../core/services/professional.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-professionals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/admin/dashboard" class="hover:text-[#0F2937]">Admin Console</a>
        <span>/</span>
        <span class="text-[#0F2937]">Professional Network Management</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Admin Professional Network Control</h1>
          <p class="text-xs text-[#64748B]">Review registered professionals, update verification states, and manage active status.</p>
        </div>
        <span class="px-3 py-1 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs font-bold rounded-full">
          ADMIN ACCESS ONLY
        </span>
      </div>

      

      <app-loading-state *ngIf="isLoading" message="Loading professional network..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadProfessionals()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-4">
        <h2 class="text-base font-bold text-[#0F2937]">Registered Professionals ({{ professionals.length }})</h2>

        <div *ngIf="professionals.length === 0" class="text-xs text-[#64748B] text-center py-6">
          No registered professionals on platform yet.
        </div>

        <div *ngIf="professionals.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-[#0F2937]">
            <thead class="bg-[#FAF9F5] border-b border-[#E8E6DF] text-[#64748B] font-bold uppercase text-[10px]">
              <tr>
                <th class="p-3">Business / Name</th>
                <th class="p-3">Categories</th>
                <th class="p-3">Service Areas</th>
                <th class="p-3">Rating</th>
                <th class="p-3">Verification</th>
                <th class="p-3">Active Status</th>
                <th class="p-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E8E6DF]">
              <tr *ngFor="let pro of professionals" class="hover:bg-[#FAF9F5] transition">
                <td class="p-3">
                  <strong class="text-xs font-bold text-[#0F2937] block">{{ pro.businessName }}</strong>
                  <span class="text-[11px] text-[#64748B]">{{ pro.userId?.name || 'Pro User' }} ({{ pro.phone || 'No phone' }})</span>
                </td>
                <td class="p-3">
                  <span *ngFor="let c of pro.categories" class="inline-block px-2 py-0.5 mr-1 mb-1 bg-[#FAF9F5] border border-[#E8E6DF] text-[10px] font-bold rounded">
                    {{ c }}
                  </span>
                </td>
                <td class="p-3 font-medium">{{ (pro.serviceAreas || []).join(', ') || 'All Localities' }}</td>
                <td class="p-3 font-bold text-[#2D7A5E]">⭐ {{ pro.rating || 'New' }} ({{ pro.reviewCount || 0 }})</td>
                <td class="p-3">
                  <span [class]="getVerificationClass(pro.verificationStatus)">
                    {{ pro.verificationStatus }}
                  </span>
                </td>
                <td class="p-3">
                  <span [class]="pro.isActive !== false ? 'text-[#2D7A5E] font-bold' : 'text-[#B91C1C] font-bold'">
                    {{ pro.isActive !== false ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="p-3 space-x-2">
                  <button
                    *ngIf="pro.verificationStatus !== 'VERIFIED'"
                    (click)="verifyPro(pro._id || pro.id, 'VERIFIED')"
                    class="px-2.5 py-1 bg-[#2D7A5E] hover:bg-[#206f54] text-white font-bold rounded text-[10px]"
                  >
                    ✓ Verify
                  </button>
                  <button
                    *ngIf="pro.verificationStatus === 'VERIFIED'"
                    (click)="verifyPro(pro._id || pro.id, 'NOT_VERIFIED')"
                    class="px-2.5 py-1 bg-[#FAF9F5] border text-[#64748B] font-bold rounded text-[10px]"
                  >
                    Unverify
                  </button>
                  <button
                    (click)="toggleStatus(pro._id || pro.id, !(pro.isActive !== false))"
                    class="px-2.5 py-1 bg-white border border-[#E8E6DF] text-[#0F2937] font-bold rounded text-[10px]"
                  >
                    {{ pro.isActive !== false ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminProfessionalsComponent implements OnInit {
  public professionals: ProfessionalProfile[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(private proService: ProfessionalService) {}

  ngOnInit(): void {
    this.loadProfessionals();
  }

  public loadProfessionals(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.proService.adminGetAllProfessionals().subscribe({
      next: (res) => {
        this.professionals = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch professionals';
        this.isLoading = false;
      },
    });
  }

  public getVerificationClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'px-2 py-0.5 bg-[#EBF5F0] text-[#2D7A5E] font-bold rounded-full';
      case 'PENDING': return 'px-2 py-0.5 bg-[#FFF7ED] text-[#C2410C] font-bold rounded-full';
      default: return 'px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full';
    }
  }

  public verifyPro(profileId?: string, status?: VerificationStatus): void {
    if (!profileId || !status) return;
    this.proService.adminVerifyProfessional(profileId, status).subscribe({
      next: () => {
        this.loadProfessionals();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update verification');
      },
    });
  }

  public toggleStatus(profileId?: string, isActive?: boolean): void {
    if (!profileId || isActive === undefined) return;
    this.proService.adminToggleStatus(profileId, isActive).subscribe({
      next: () => {
        this.loadProfessionals();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update status');
      },
    });
  }
}
