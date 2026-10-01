import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { StitchDesignRequest } from '../../../shared/models/stitch-request.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingStateComponent, ErrorStateComponent],
  template: `
    <div class="space-y-6">
      

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">User Account Management</h1>
          <p class="text-xs text-slate-500">Monitor and manage platform user roles, account activation, and profile data</p>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            [(ngModel)]="search"
            (ngModelChange)="onFilterChange()"
            placeholder="Search name, email, or phone..."
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none w-full sm:w-64"
          />
          <select
            [(ngModel)]="selectedRole"
            (change)="onFilterChange()"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">All Roles</option>
            <option value="TENANT">Tenant</option>
            <option value="OWNER">Owner</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            [(ngModel)]="selectedStatus"
            (change)="onFilterChange()"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
        <div class="text-xs font-bold text-slate-500">Total Users: {{ totalUsers }}</div>
      </div>

      <app-loading-state *ngIf="loading" message="Loading users list..."></app-loading-state>


      <app-error-state *ngIf="error" [message]="error" (retry)="loadUsers()"></app-error-state>

      <!-- Users Table -->
      <div *ngIf="!loading && !error" class="bg-white rounded-xl border border-[#E8E6DF] shadow-sm overflow-hidden">
        <div *ngIf="users.length === 0" class="p-8 text-center text-xs text-slate-500">
          No users match the selected filters.
        </div>

        <div *ngIf="users.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#F4F3EE] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E8E6DF]">
              <tr>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Contact</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Verification</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Created</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr *ngFor="let u of users" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-bold text-[#0F2937]">
                  {{ u.name }}
                  <div class="text-[10px] text-slate-400 font-mono font-normal">ID: {{ u._id || u.id }}</div>
                </td>
                <td class="px-4 py-3">
                  <div>{{ u.email }}</div>
                  <div class="text-[10px] text-slate-500">{{ u.phone }}</div>
                </td>
                <td class="px-4 py-3">
                  <span
                    [ngClass]="{
                      'bg-blue-100 text-blue-800': u.role === 'TENANT',
                      'bg-emerald-100 text-emerald-800': u.role === 'OWNER',
                      'bg-purple-100 text-purple-800': u.role === 'PROFESSIONAL',
                      'bg-red-100 text-red-800': u.role === 'ADMIN'
                    }"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  >
                    {{ u.role }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': u.identityVerificationStatus === 'VERIFIED',
                      'bg-amber-50 text-amber-700 border border-amber-200': u.identityVerificationStatus === 'UNDER_REVIEW' || u.identityVerificationStatus === 'PENDING',
                      'bg-red-50 text-red-700 border border-red-200': u.identityVerificationStatus === 'REJECTED',
                      'bg-slate-50 text-slate-500 border border-slate-200': u.identityVerificationStatus === 'NOT_STARTED' || !u.identityVerificationStatus
                    }"
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                  >
                    {{ u.identityVerificationStatus || 'NOT_STARTED' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    [ngClass]="u.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'"
                    class="px-2 py-0.5 rounded font-bold text-[10px]"
                  >
                    {{ u.isActive ? 'ACTIVE' : 'INACTIVE' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">
                  {{ u.createdAt | date: 'shortDate' }}
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <a
                    [routerLink]="['/admin/users', u._id || u.id]"
                    class="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold transition-colors"
                  >
                    View Details →
                  </a>
                  <button
                    (click)="toggleStatus(u)"
                    [ngClass]="u.isActive ? 'hover:bg-rose-100 text-rose-700' : 'hover:bg-emerald-100 text-emerald-700'"
                    class="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold transition-colors"
                  >
                    {{ u.isActive ? 'Deactivate' : 'Activate' }}
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
export class AdminUsersComponent implements OnInit {
  loading = true;
  error: string | null = null;
  users: any[] = [];
  totalUsers = 0;

  search = '';
  selectedRole = '';
  selectedStatus = '';

  public stitchRequest: StitchDesignRequest = {
    pageName: 'Admin Users Management',
    route: '/admin/users',
    role: 'Admin',
    purpose: 'Administrative control panel to search, filter, and manage platform user accounts and status',
    userEntersFrom: 'Admin Dashboard',
    userCanNavigateTo: ['/admin/dashboard'],
    existingStitchReferences: [],
    requiredInformation: ['User list', 'Role badges', 'Contact details', 'Account status'],
    requiredActions: ['Search Users', 'Filter Role', 'Activate/Deactivate Account'],
    requiredComponents: ['Data table', 'Search & filter bar', 'Role pills'],
    requiredStates: ['Loading', 'Normal', 'Empty', 'Error'],
    responsiveRequirements: {
      desktop: 'Full management data table',
      tablet: 'Horizontal scroll table',
      mobile: 'Card list representation',
    },
    designRequirementNote: 'Strict authorization required. Password hashes stripped.',
    status: 'DESIGN_REQUIRED',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  onFilterChange(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    const params: any = {};
    if (this.search) params.search = this.search;
    if (this.selectedRole) params.role = this.selectedRole;
    if (this.selectedStatus) params.isActive = this.selectedStatus;

    this.adminService.getUsers(params).subscribe({
      next: (res) => {
        this.users = res.data?.users || [];
        this.totalUsers = res.data?.total || this.users.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch users';
        this.loading = false;
      },
    });
  }

  toggleStatus(user: any): void {
    const newStatus = !user.isActive;
    const confirmMsg = `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} user ${user.name}?`;
    if (!confirm(confirmMsg)) return;

    const id = user._id || user.id;
    this.adminService.updateUserStatus(id, newStatus).subscribe({
      next: () => {
        user.isActive = newStatus;
      },
      error: (err) => {
        alert(err.message || 'Failed to update user status');
      },
    });
  }
}
