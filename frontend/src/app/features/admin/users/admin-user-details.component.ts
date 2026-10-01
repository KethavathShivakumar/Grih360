import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <a routerLink="/admin/dashboard" class="hover:text-slate-800">Admin Console</a>
        <span>/</span>
        <a routerLink="/admin/users" class="hover:text-slate-800">Users</a>
        <span>/</span>
        <span class="text-[#0F2937]">User Dossier</span>
      </div>

      <!-- Top Header / Profile Bar -->
      <div *ngIf="user" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 rounded-2xl bg-[#0F2937] text-white flex items-center justify-center font-black text-2xl shadow-sm">
            {{ user.name ? user.name[0].toUpperCase() : 'U' }}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-black text-[#0F2937]">{{ user.name }}</h1>
              <span
                [ngClass]="{
                  'bg-blue-100 text-blue-800': user.role === 'TENANT',
                  'bg-emerald-100 text-emerald-800': user.role === 'OWNER',
                  'bg-purple-100 text-purple-800': user.role === 'PROFESSIONAL',
                  'bg-red-100 text-red-800': user.role === 'ADMIN'
                }"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
              >
                {{ user.role }}
              </span>
              <span
                [ngClass]="user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                class="px-2 py-0.5 rounded text-[10px] font-bold"
              >
                {{ user.isActive ? 'ACTIVE' : 'INACTIVE' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-mono mt-1">UUID: {{ user._id || user.id }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <a
            routerLink="/admin/users"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            ← Back to Users
          </a>
          <button
            (click)="toggleStatus()"
            [disabled]="isUpdating"
            [ngClass]="user.isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'"
            class="px-4 py-2 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {{ user.isActive ? 'Deactivate Account' : 'Activate Account' }}
          </button>
        </div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading user dossier..."></app-loading-state>
      <app-error-state *ngIf="error" [message]="error" (retry)="loadUser()"></app-error-state>

      <!-- Details Content (Bento Grid) -->
      <div *ngIf="!loading && !error && user" class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Column 1: Identity & Credentials -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Identity & Contact
          </h3>
          <div class="space-y-3 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Full Legal Name</span>
              <span class="font-bold text-slate-800 text-sm">{{ user.name }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
              <span class="font-semibold text-slate-800">{{ user.email }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
              <span class="font-semibold text-slate-800">{{ user.phone || 'Not provided' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Identity Verification</span>
              <span
                [ngClass]="{
                  'text-emerald-700 font-bold': user.identityVerificationStatus === 'VERIFIED',
                  'text-amber-700 font-bold': user.identityVerificationStatus === 'UNDER_REVIEW' || user.identityVerificationStatus === 'PENDING',
                  'text-rose-700 font-bold': user.identityVerificationStatus === 'REJECTED',
                  'text-slate-500 font-semibold': !user.identityVerificationStatus || user.identityVerificationStatus === 'NOT_STARTED'
                }"
              >
                {{ user.identityVerificationStatus || 'NOT_STARTED' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Account Registration</span>
              <span class="text-slate-600">{{ user.createdAt | date: 'medium' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Last Updated</span>
              <span class="text-slate-600">{{ user.updatedAt | date: 'medium' }}</span>
            </div>
          </div>
        </div>

        <!-- Column 2: Governance & Permissions -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Governance & Role
          </h3>
          <div class="space-y-4 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Change System Role</span>
              <div class="flex items-center space-x-2">
                <select
                  [(ngModel)]="newRole"
                  class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
                >
                  <option value="TENANT">TENANT</option>
                  <option value="OWNER">OWNER</option>
                  <option value="PROFESSIONAL">PROFESSIONAL</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button
                  (click)="updateRole()"
                  [disabled]="isUpdating || newRole === user.role"
                  class="px-3 py-1.5 bg-[#0F2937] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                >
                  Apply Role
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Changes are logged in the administrative audit ledger.</p>
            </div>

            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span class="text-[10px] font-bold text-slate-600 uppercase">Privacy & Data Security</span>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Password credentials and cryptographic salts are cryptographically protected and never exposed to the administrative interface.
              </p>
            </div>

            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Permissions Tier</span>
              <span class="font-bold text-slate-700">
                {{ user.role === 'ADMIN' ? 'Full Platform Operations & Moderation' : user.role === 'OWNER' ? 'Listing & Tenancy Management' : user.role === 'PROFESSIONAL' ? 'Service Order Fulfillment' : 'Tenant Exploration & Applications' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Column 3: Platform Relationships -->
        <div class="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wide border-b border-slate-100 pb-2">
            Operations & Navigation
          </h3>
          <div class="space-y-3 text-xs">
            <p class="text-slate-500 text-[11px]">
              Inspect related records associated with this account across Nivas360 subsystems:
            </p>
            <div class="space-y-2">
              <a
                routerLink="/admin/verifications"
                class="flex items-center justify-between p-2.5 bg-[#FAF9F5] hover:bg-slate-100 rounded-xl border border-[#E8E6DF] transition"
              >
                <span class="font-bold text-slate-800">🛡️ Verification Queue</span>
                <span class="text-slate-400 text-xs">→</span>
              </a>
              <a
                routerLink="/admin/properties"
                class="flex items-center justify-between p-2.5 bg-[#FAF9F5] hover:bg-slate-100 rounded-xl border border-[#E8E6DF] transition"
              >
                <span class="font-bold text-slate-800">🏠 Properties Listed</span>
                <span class="text-slate-400 text-xs">→</span>
              </a>
              <a
                routerLink="/admin/applications"
                class="flex items-center justify-between p-2.5 bg-[#FAF9F5] hover:bg-slate-100 rounded-xl border border-[#E8E6DF] transition"
              >
                <span class="font-bold text-slate-800">📄 Rental Applications</span>
                <span class="text-slate-400 text-xs">→</span>
              </a>
              <a
                routerLink="/admin/rentals"
                class="flex items-center justify-between p-2.5 bg-[#FAF9F5] hover:bg-slate-100 rounded-xl border border-[#E8E6DF] transition"
              >
                <span class="font-bold text-slate-800">🔑 Rental Agreements</span>
                <span class="text-slate-400 text-xs">→</span>
              </a>
              <a
                *ngIf="user.role === 'PROFESSIONAL'"
                routerLink="/admin/professionals"
                class="flex items-center justify-between p-2.5 bg-[#FAF9F5] hover:bg-slate-100 rounded-xl border border-[#E8E6DF] transition"
              >
                <span class="font-bold text-slate-800">👷 Professional Profile</span>
                <span class="text-slate-400 text-xs">→</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AdminUserDetailsComponent implements OnInit {
  userId: string = '';
  user: any = null;
  loading: boolean = true;
  error: string | null = null;
  isUpdating: boolean = false;
  newRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    } else {
      this.error = 'No User ID specified';
      this.loading = false;
    }
  }

  loadUser(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getUserById(this.userId).subscribe({
      next: (res) => {
        this.user = res.data;
        this.newRole = this.user?.role || 'TENANT';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load user details';
        this.loading = false;
      },
    });
  }

  toggleStatus(): void {
    if (!this.user) return;
    const targetStatus = !this.user.isActive;
    const action = targetStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this user account?`)) return;

    this.isUpdating = true;
    this.adminService.updateUserStatus(this.userId, targetStatus).subscribe({
      next: () => {
        this.user.isActive = targetStatus;
        this.isUpdating = false;
      },
      error: (err) => {
        alert(err.message || 'Failed to update user status');
        this.isUpdating = false;
      },
    });
  }

  updateRole(): void {
    if (!this.user || this.newRole === this.user.role) return;
    if (!confirm(`Are you sure you want to change user role to ${this.newRole}?`)) return;

    this.isUpdating = true;
    this.adminService.updateUserRole(this.userId, this.newRole).subscribe({
      next: () => {
        this.user.role = this.newRole;
        this.isUpdating = false;
      },
      error: (err) => {
        alert(err.message || 'Failed to update user role');
        this.isUpdating = false;
      },
    });
  }
}
