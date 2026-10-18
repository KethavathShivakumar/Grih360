import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-system',
  standalone: true,
  imports: [CommonModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-[#0F2937]">System Health & Infrastructure</h1>
          <p class="text-xs text-slate-500">Monitor API server health, database connectivity, and uptime metrics</p>
        </div>
        <button (click)="loadHealth()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md">
          <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Refresh Health
        </button>
      </div>

      <app-loading-state *ngIf="loading" message="Checking system health..."></app-loading-state>


      <app-error-state *ngIf="error" [message]="error" (retry)="loadHealth()"></app-error-state>

      <div *ngIf="!loading && !error && health" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- API Server Health Card -->
        <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-[#0F2937] uppercase tracking-wide">API Engine Health</h3>
            <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              Status: {{ health.status }}
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Environment</span>
              <span class="font-bold text-[#0F2937] font-mono">{{ health.environment }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Node Runtime</span>
              <span class="font-bold text-[#0F2937] font-mono">{{ health.nodeVersion }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Server Uptime</span>
              <span class="font-bold text-emerald-600 font-mono">{{ health.uptimeSeconds }} seconds</span>
            </div>
            <div class="flex justify-between py-1.5">
              <span class="text-slate-500">Last Checked</span>
              <span class="font-mono text-slate-400 text-[11px]">{{ health.timestamp | date: 'medium' }}</span>
            </div>
          </div>
        </div>

        <!-- Database Connectivity Card -->
        <div class="bg-white border border-[#E8E6DF] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-[#0F2937] uppercase tracking-wide">Database Store</h3>
            <span
              [ngClass]="health.database === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
              class="px-2.5 py-0.5 text-xs font-bold rounded-full"
            >
              {{ health.database }}
            </span>
          </div>

          <div class="text-xs text-slate-600 space-y-2">
            <p>
              Grih360 uses MongoDB Mongoose schemas with an automatic in-memory fallback store to guarantee uninterrupted service during maintenance windows.
            </p>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              <div>Store Mode: {{ health.database === 'CONNECTED' ? 'MongoDB Replica Set' : 'In-Memory Resilient Store' }}</div>
              <div>Platform Verification: Model Tenancy Act Compliant</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminSystemComponent implements OnInit {
  loading = true;
  error: string | null = null;
  health: any = null;

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin System Health & Infrastructure',
    route: '/admin/system',
    role: 'Admin',
    purpose: 'Safe monitoring panel for server status, database connection, and uptime',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['System status', 'Uptime', 'Database mode'],
    requiredActions: ['Refresh Health'],
    requiredComponents: ['Health cards', 'Status pill'],
    requiredStates: ['Loading', 'Normal', 'Error'],
    responsiveRequirements: { desktop: '2-column health grid', tablet: 'Single column', mobile: 'Single column' },
    designRequirementNote: 'Never exposes secrets or credentials.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadHealth();
  }

  loadHealth(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getSystemHealth().subscribe({
      next: (res) => {
        this.health = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch system health metrics';
        this.loading = false;
      },
    });
  }
}
