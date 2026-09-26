import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div>
        <h1 class="text-2xl font-black text-[#0F2937]">Rental Applications Operations</h1>
        <p class="text-xs text-slate-500">Monitor tenant rental applications across all platform properties</p>
      </div>

      <div class="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <select
          [(ngModel)]="selectedStatus"
          (change)="loadApplications()"
          class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="">All Application Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <div class="text-xs font-bold text-slate-500">Total Applications: {{ totalApps }}</div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading rental applications..."></app-loading-state>


      <app-error-state *ngIf="error" [message]="error" (retry)="loadApplications()"></app-error-state>

      <div *ngIf="!loading && !error" class="bg-white rounded-xl border border-[#E8E6DF] shadow-sm overflow-hidden">
        <div *ngIf="applications.length === 0" class="p-8 text-center text-xs text-slate-500">
          No rental applications found.
        </div>

        <div *ngIf="applications.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F4F3EE] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E8E6DF]">
              <tr>
                <th class="px-4 py-3">Application ID</th>
                <th class="px-4 py-3">Tenant ID</th>
                <th class="px-4 py-3">Property ID</th>
                <th class="px-4 py-3">Proposed Move-In</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr *ngFor="let a of applications" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-mono text-slate-600 font-bold">{{ a._id || a.id }}</td>
                <td class="px-4 py-3 text-slate-700">{{ a.tenantId }}</td>
                <td class="px-4 py-3 text-slate-700">{{ a.propertyId }}</td>
                <td class="px-4 py-3">{{ a.moveInDate | date: 'shortDate' }}</td>
                <td class="px-4 py-3">
                  <span
                    [ngClass]="{
                      'bg-blue-100 text-blue-800': a.status === 'SUBMITTED',
                      'bg-amber-100 text-amber-800': a.status === 'UNDER_REVIEW',
                      'bg-emerald-100 text-emerald-800': a.status === 'APPROVED',
                      'bg-rose-100 text-rose-800': a.status === 'REJECTED'
                    }"
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  >
                    {{ a.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-400 text-[11px]">{{ a.createdAt | date: 'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminApplicationsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  applications: any[] = [];
  totalApps = 0;
  selectedStatus = '';

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Applications Oversight',
    route: '/admin/applications',
    role: 'Admin',
    purpose: 'Administrative monitoring panel for rental applications across platform properties',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['Application list', 'Move-in dates', 'Status timeline'],
    requiredActions: ['Filter status'],
    requiredComponents: ['Data table', 'Status badge'],
    requiredStates: ['Loading', 'Normal', 'Empty', 'Error'],
    responsiveRequirements: { desktop: 'Data table layout', tablet: 'Scrollable table', mobile: 'Card list' },
    designRequirementNote: 'Read-only operational oversight.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.error = null;
    const params: any = {};
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.adminService.getApplications(params).subscribe({
      next: (res) => {
        this.applications = res.data?.applications || [];
        this.totalApps = res.data?.total || this.applications.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch applications';
        this.loading = false;
      },
    });
  }
}
