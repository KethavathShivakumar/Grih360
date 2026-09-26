import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div>
        <h1 class="text-2xl font-black text-[#0F2937]">Platform Audit & Security Log</h1>
        <p class="text-xs text-slate-500">Immutable operational audit trail recording administrative mutations and security events</p>
      </div>

      <div class="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <select
            [(ngModel)]="selectedEntityType"
            (change)="loadLogs()"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">All Entities</option>
            <option value="USER">User Account</option>
            <option value="PROPERTY">Property</option>
            <option value="VERIFICATION">Verification</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="SERVICE_REQUEST">Service Request</option>
            <option value="SYSTEM">System Broadcast</option>
          </select>
        </div>
        <button (click)="loadLogs()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md">
          🔄 Refresh Log
        </button>
      </div>

      <app-loading-state *ngIf="loading" message="Loading operations audit log..."></app-loading-state>


      <app-error-state *ngIf="error" [message]="error" (retry)="loadLogs()"></app-error-state>

      <div *ngIf="!loading && !error" class="bg-white rounded-xl border border-[#E8E6DF] shadow-sm overflow-hidden">
        <div *ngIf="logs.length === 0" class="p-8 text-center text-xs text-slate-500">
          No audit log events recorded for selected criteria.
        </div>

        <div *ngIf="logs.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F4F3EE] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E8E6DF]">
              <tr>
                <th class="px-4 py-3">Action</th>
                <th class="px-4 py-3">Actor</th>
                <th class="px-4 py-3">Entity Type</th>
                <th class="px-4 py-3">Entity ID</th>
                <th class="px-4 py-3">Metadata</th>
                <th class="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr *ngFor="let l of logs" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[10px] font-bold rounded">
                    {{ l.action }}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-[#0F2937]">
                  {{ l.actorName }}
                  <span class="text-[10px] font-normal text-slate-400 font-mono ml-1">({{ l.actorRole }})</span>
                </td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ l.entityType }}</td>
                <td class="px-4 py-3 font-mono text-slate-500 text-[11px]">{{ l.entityId }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px] font-mono">
                  {{ l.metadata | json }}
                </td>
                <td class="px-4 py-3 text-right text-slate-400 text-[11px]">
                  {{ l.createdAt | date: 'medium' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminAuditComponent implements OnInit {
  loading = true;
  error: string | null = null;
  logs: any[] = [];
  selectedEntityType = '';

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Operational Audit Log',
    route: '/admin/audit',
    role: 'Admin',
    purpose: 'Immutable audit log viewer for administrative actions and security events',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['Action list', 'Actor identity', 'Entity references', 'Timestamps'],
    requiredActions: ['Filter Entity Type', 'Refresh Log'],
    requiredComponents: ['Data table', 'Action badges', 'Metadata viewer'],
    requiredStates: ['Loading', 'Normal', 'Empty', 'Error'],
    responsiveRequirements: { desktop: 'Data table layout', tablet: 'Scrollable table', mobile: 'Card log list' },
    designRequirementNote: 'Append-only audit trail.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = null;
    const params: any = {};
    if (this.selectedEntityType) params.entityType = this.selectedEntityType;

    this.adminService.getAuditLogs(params).subscribe({
      next: (res) => {
        this.logs = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch audit logs';
        this.loading = false;
      },
    });
  }
}
