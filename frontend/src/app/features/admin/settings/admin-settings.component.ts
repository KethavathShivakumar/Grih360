import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Platform Settings</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage MTA compliance, operating parameters, and system security configuration</p>
        </div>
        <button
          (click)="saveSettings()"
          [disabled]="isSaving || !isDirty"
          class="px-5 py-2.5 bg-[#2D7A5E] hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
        >
          {{ isSaving ? 'Saving...' : '💾 Save Changes' }}
        </button>
      </div>

      <div *ngIf="saveSuccess" class="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs font-bold">
        ✓ {{ saveSuccess }}
      </div>
      <div *ngIf="saveError" class="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 text-xs font-bold">
        ⚠️ {{ saveError }}
      </div>

      <app-loading-state *ngIf="loading" message="Loading platform configuration..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadSettings()"></app-error-state>

      <div *ngIf="!loading && !error && settings" class="space-y-6">

        <!-- General Platform Settings -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            General Platform Configuration
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Platform Name</label>
              <input
                type="text"
                [(ngModel)]="settings.platformName"
                (ngModelChange)="markDirty()"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] bg-slate-50"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Environment</label>
              <input
                type="text"
                [value]="settings.environment"
                readonly
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 cursor-not-allowed text-slate-500"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">Read-only. Set via NODE_ENV environment variable.</p>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Customer Care Hotline</label>
              <input
                type="text"
                [(ngModel)]="settings.customerCareHotline"
                (ngModelChange)="markDirty()"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] bg-slate-50"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Backup Schedule</label>
              <input
                type="text"
                [(ngModel)]="settings.backupSchedule"
                (ngModelChange)="markDirty()"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] bg-slate-50"
              />
            </div>
          </div>
        </div>

        <!-- MTA Compliance -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            MTA Compliance & Legal
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span class="font-bold text-slate-800 block">MTA Compliance Enforced</span>
                <span class="text-[11px] text-slate-500">Model Tenancy Act deposit limits enforced</span>
              </div>
              <button
                (click)="settings.mtaComplianceEnabled = !settings.mtaComplianceEnabled; markDirty()"
                [ngClass]="settings.mtaComplianceEnabled ? 'bg-emerald-600' : 'bg-slate-300'"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
              >
                <span
                  [ngClass]="settings.mtaComplianceEnabled ? 'translate-x-5' : 'translate-x-1'"
                  class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                ></span>
              </button>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Max Deposit (Months of Rent)</label>
              <input
                type="number"
                [(ngModel)]="settings.defaultDepositCapMonths"
                (ngModelChange)="markDirty()"
                min="1"
                max="12"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] bg-slate-50"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">MTA recommends 2 months maximum.</p>
            </div>
          </div>
        </div>

        <!-- Operating Coverage -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Operating States & Cities
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Operating States</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <span
                  *ngFor="let state of settings.operatingStates || []"
                  class="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg font-semibold"
                >
                  {{ state }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400">States coverage managed via platform backend.</p>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Operating Cities ({{ (settings.operatingCities || []).length }})</label>
              <div class="flex flex-wrap gap-1.5">
                <span
                  *ngFor="let city of settings.operatingCities || []"
                  class="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                >
                  📍 {{ city }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Security Parameters
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">JWT Token Expiry (Days)</label>
              <input
                type="number"
                [(ngModel)]="settings.jwtExpiryDays"
                (ngModelChange)="markDirty()"
                min="1"
                max="90"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] bg-slate-50"
              />
            </div>
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span class="font-bold text-slate-800 block">Admin Two-Factor Required</span>
                <span class="text-[11px] text-slate-500">Enforce 2FA for admin operations</span>
              </div>
              <button
                (click)="settings.requireAdminTwoFactor = !settings.requireAdminTwoFactor; markDirty()"
                [ngClass]="settings.requireAdminTwoFactor ? 'bg-emerald-600' : 'bg-slate-300'"
                class="relative w-11 h-6 rounded-full transition-colors duration-200"
              >
                <span
                  [ngClass]="settings.requireAdminTwoFactor ? 'translate-x-5' : 'translate-x-1'"
                  class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                ></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Maintenance Mode -->
        <div class="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs">
          <h3 class="text-sm font-black text-rose-800 uppercase tracking-wide border-b border-rose-100 pb-2 flex items-center space-x-2">
            <span>⚠️</span>
            <span>Maintenance Mode</span>
          </h3>
          <div class="mt-4 flex items-center justify-between">
            <div>
              <span class="font-bold text-slate-800 block text-sm">Maintenance Mode</span>
              <span class="text-xs text-slate-500">When enabled, platform shows maintenance page to all non-admin users.</span>
              <p *ngIf="settings.maintenanceMode" class="text-rose-600 font-bold text-xs mt-1">
                ⚠️ MAINTENANCE MODE IS CURRENTLY ACTIVE — Platform is inaccessible to tenants and owners.
              </p>
            </div>
            <button
              (click)="settings.maintenanceMode = !settings.maintenanceMode; markDirty()"
              [ngClass]="settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-300'"
              class="relative w-12 h-6 rounded-full transition-colors duration-200"
            >
              <span
                [ngClass]="settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'"
                class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              ></span>
            </button>
          </div>
        </div>

        <div class="text-[11px] text-slate-400 text-right">
          Configuration last updated: {{ settings.updatedAt | date:'medium' }}
        </div>
      </div>
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  settings: any = null;
  loading = true;
  error: string | null = null;
  isSaving = false;
  isDirty = false;
  saveSuccess: string | null = null;
  saveError: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getSettings().subscribe({
      next: (res) => { this.settings = res.data; this.isDirty = false; this.loading = false; },
      error: (err) => { this.error = err.message || 'Failed to load settings'; this.loading = false; },
    });
  }

  markDirty(): void {
    this.isDirty = true;
    this.saveSuccess = null;
    this.saveError = null;
  }

  saveSettings(): void {
    if (!this.isDirty || !this.settings) return;
    this.isSaving = true;
    this.saveSuccess = null;
    this.saveError = null;

    const payload = {
      platformName: this.settings.platformName,
      mtaComplianceEnabled: this.settings.mtaComplianceEnabled,
      defaultDepositCapMonths: this.settings.defaultDepositCapMonths,
      maintenanceMode: this.settings.maintenanceMode,
      jwtExpiryDays: this.settings.jwtExpiryDays,
      requireAdminTwoFactor: this.settings.requireAdminTwoFactor,
      customerCareHotline: this.settings.customerCareHotline,
      backupSchedule: this.settings.backupSchedule,
    };

    this.adminService.updateSettings(payload).subscribe({
      next: (res) => {
        this.settings = res.data;
        this.isDirty = false;
        this.saveSuccess = 'Platform settings updated and audit-logged successfully.';
        this.isSaving = false;
      },
      error: (err) => {
        this.saveError = err.message || 'Failed to save settings';
        this.isSaving = false;
      },
    });
  }
}
