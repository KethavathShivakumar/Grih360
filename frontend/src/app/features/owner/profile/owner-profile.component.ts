import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { OwnerService, OwnerDashboardMetrics } from '../../../core/services/owner.service';

@Component({
  selector: 'app-owner-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Property Owner Profile</h1>
          <p class="text-xs text-slate-500">Manage your landlord credentials, business contact info, and portfolio security settings.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            (click)="activeTab = 'overview'"
            type="button"
            [class]="activeTab === 'overview' ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            (click)="activeTab = 'edit'"
            type="button"
            [class]="activeTab === 'edit' ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            (click)="activeTab = 'security'"
            type="button"
            [class]="activeTab === 'security' ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Security & Password
          </button>
        </div>
      </div>

      <!-- Feedback Banners -->
      <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span> {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer"></button>
      </div>
      <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer"></button>
      </div>

      <!-- TAB 1: OVERVIEW -->
      <div *ngIf="activeTab === 'overview'" class="space-y-6">
        <!-- Hero Card with Photo -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <!-- Profile Photo -->
            <div class="relative group">
              <div class="w-24 h-24 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-extrabold text-3xl shadow-md border-4 border-white overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ ownerInitial }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">{{ userName }}</h2>
                <span
                  *ngIf="verificationState === 'verified'"
                  class="inline-flex items-center text-[10px] font-extrabold text-[#E26D46] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide"
                >
                  Verified Owner
                </span>
                <span
                  *ngIf="verificationState !== 'verified'"
                  class="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide"
                >
                  Property Owner
                </span>
              </div>
              <p class="text-xs text-slate-500">{{ user?.email }} • +91 {{ user?.phone || '9876543210' }}</p>
              <p class="text-xs text-slate-600 font-medium pt-1">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Operating Zone: {{ user?.city || 'Warangal & Hyderabad, Telangana' }}
              </p>
            </div>
          </div>

          <!-- Photo Actions -->
          <div class="flex sm:flex-col items-center gap-2">
            <label class="px-3 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1">
              <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg></span>
              <span>{{ user?.profileImage ? 'Replace Photo' : 'Upload Photo' }}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onPhotoFileChange($event)" class="hidden" />
            </label>
            <button
              *ngIf="user?.profileImage"
              (click)="removePhoto()"
              type="button"
              class="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Remove Photo
            </button>
          </div>
        </div>

        <!-- Portfolio Stats Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Total Properties -->
          <div routerLink="/owner/properties" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Properties</span>
              <span class="text-xl  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ metrics?.totalProperties || 0 }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">Manage Properties →</span>
          </div>

          <!-- Active Rentals -->
          <div routerLink="/owner/rentals" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Leases</span>
              <span class="text-xl  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg></span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ metrics?.activeRentals || 0 }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">View Agreements →</span>
          </div>

          <!-- Pending Applications -->
          <div routerLink="/owner/applicants" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Applicants</span>
              <span class="text-xl  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ metrics?.pendingApplications || 0 }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">Review Applicants →</span>
          </div>
        </div>

        <!-- Verification Credentials -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider flex items-center gap-2">
              <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></span>
              <span>Landlord Verification & Ownership Documents</span>
            </h3>
            <span [ngClass]="verificationBadgeClass" class="text-xs font-extrabold px-2.5 py-1 rounded-full border">
              {{ verificationStateLabel }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Property Title Deed Verification</span>
              <span class="font-bold text-slate-800 text-sm block">
                <ng-container [ngSwitch]="verificationState">
                  <span *ngSwitchCase="'verified'" class="text-emerald-700"> Title Deed Verified</span>
                  <span *ngSwitchCase="'pending_review'" class="text-amber-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Title Deed Under Review</span>
                  <span *ngSwitchCase="'rejected'" class="text-rose-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Title Deed Rejected</span>
                  <span *ngSwitchDefault class="text-slate-600">Verification Coming Soon</span>
                </ng-container>
              </span>
              <p class="text-[11px] text-slate-500 pt-0.5">
                Government registry sync and title deed verification pipeline is coming soon.
              </p>
            </div>

            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Rent Settlement Account</span>
              <span class="font-bold text-slate-800 text-sm block">
                <ng-container [ngSwitch]="verificationState">
                  <span *ngSwitchCase="'verified'" class="text-emerald-700"> Bank Account Verified</span>
                  <span *ngSwitchCase="'pending_review'" class="text-amber-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Bank Details Pending</span>
                  <span *ngSwitchCase="'rejected'" class="text-rose-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Bank Details Rejected</span>
                  <span *ngSwitchDefault class="text-slate-600">Bank Account: Not Submitted</span>
                </ng-container>
              </span>
              <p class="text-[11px] text-slate-500 pt-0.5">
                Direct digital rent collection account configuration.
              </p>
            </div>
          </div>
        </div>

        <!-- Workspace Navigation & Quick Access Menu (Requirement: 100% reachability) -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider flex items-center gap-2">
              <span></span>
              <span>Owner Console Quick Navigation Menu</span>
            </h3>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              routerLink="/owner/properties/new"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg></span>
              <span>Add Property</span>
            </a>
            <a
              routerLink="/owner/properties"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></span>
              <span>My Properties</span>
            </a>
            <a
              routerLink="/owner/applicants"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
              <span>Applicants</span>
            </a>
            <a
              routerLink="/owner/rentals"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"></span>
              <span>Rental Leases</span>
            </a>
            <a
              routerLink="/owner/rent-tracking"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg></span>
              <span>Rent Tracking</span>
            </a>
            <a
              routerLink="/owner/notifications"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></span>
              <span>Notifications</span>
            </a>
            <a
              routerLink="/owner/settings"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></span>
              <span>Settings</span>
            </a>
            <button
              (click)="activeTab = 'security'"
              type="button"
              class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white rounded-2xl border border-slate-200/80 transition-all font-bold text-xs flex items-center gap-2.5 group cursor-pointer text-left"
            >
              <span class="text-lg  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></span>
              <span>Security</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: EDIT PROFILE -->
      <div *ngIf="activeTab === 'edit'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-extrabold text-[#0F2937]">Edit Owner Profile Details</h2>
          <p class="text-xs text-slate-500">Update your public contact info, operating cities, and landlord business details.</p>
        </div>

        <form (ngSubmit)="onSaveProfile()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Full Name</label>
              <input
                type="text"
                [(ngModel)]="editName"
                name="name"
                required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Mobile Phone Number</label>
              <input
                type="text"
                [(ngModel)]="editPhone"
                name="phone"
                required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Operating City / Region</label>
              <input
                type="text"
                [(ngModel)]="editCity"
                name="city"
                placeholder="e.g. Warangal / Hyderabad"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Property Management Organization</label>
              <input
                type="text"
                [(ngModel)]="editOccupation"
                name="occupation"
                placeholder="e.g. Individual Owner / Sharma Realties"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-3">
            <button
              (click)="activeTab = 'overview'"
              type="button"
              class="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="isSaving"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              {{ isSaving ? 'Saving Changes...' : 'Save Profile Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 3: SECURITY & PASSWORD -->
      <div *ngIf="activeTab === 'security'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-extrabold text-[#0F2937]">Change Owner Account Password</h2>
          <p class="text-xs text-slate-500">Protect your property portfolio and sensitive tenancy agreements.</p>
        </div>

        <form (ngSubmit)="onChangePassword()" class="space-y-4 max-w-md">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Current Password <span class="text-rose-500">*</span></label>
            <input
              type="password"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">New Password <span class="text-rose-500">*</span></label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              minlength="6"
              placeholder="At least 6 characters"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Confirm New Password <span class="text-rose-500">*</span></label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div class="pt-2">
            <button
              type="submit"
              [disabled]="isSavingPassword"
              class="px-6 py-2.5 bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              {{ isSavingPassword ? 'Updating Password...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Account Actions (Logout) -->
      <div class="p-6 bg-rose-50/60 rounded-3xl border border-rose-200/80 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold text-rose-900">Sign Out of Owner Console</h4>
          <p class="text-[11px] text-rose-700/80">End your active session securely on this device.</p>
        </div>
        <button
          (click)="onLogout()"
          type="button"
          class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Logout Now
        </button>
      </div>

      <!-- Legal & Privacy Section -->
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <span class="text-xs font-bold text-slate-800">Legal & Privacy Documents</span>
          <p class="text-[11px] text-slate-500">Read our terms of service and DPDP Act 2023 compliant privacy framework.</p>
        </div>
        <div class="flex items-center gap-3 text-xs font-bold shrink-0">
          <a routerLink="/privacy" class="text-[#2D7A5E] hover:underline">Privacy Policy</a>
          <span class="text-slate-300">•</span>
          <a routerLink="/terms" class="text-[#2D7A5E] hover:underline">Terms & Conditions</a>
        </div>
      </div>

      <!-- Build Stamp Footer -->
      <div class="mt-8 pt-4 border-t border-slate-200 text-center space-y-1">
        <p class="text-[11px] font-mono font-bold text-slate-500">
          Grih360 Android App v1.3.0 (Build 7)
        </p>
        <p class="text-[10px] font-mono text-slate-400">
          Build Time: {{ buildTimestamp }}
        </p>
      </div>
    </div>
  `,
})
export class OwnerProfileComponent implements OnInit {
  buildTimestamp: string = '2026-10-10 14:55:00 IST';
  user: any = null;
  activeTab: 'overview' | 'edit' | 'security' = 'overview';
  metrics: OwnerDashboardMetrics | null = null;

  editName: string = '';
  editPhone: string = '';
  editCity: string = '';
  editOccupation: string = '';

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  isSaving: boolean = false;
  isSavingPassword: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private ownerService: OwnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.populateEditFields();
    this.loadOwnerMetrics();
    this.loadRealProfile();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Property Owner';
  }

  get ownerInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'O';
  }

  get verificationState(): 'not_submitted' | 'pending_review' | 'verified' | 'rejected' {
    const rawStatus = (this.user?.identityVerificationStatus || '').toUpperCase();
    if (rawStatus === 'VERIFIED') return 'verified';
    if (rawStatus === 'PENDING' || rawStatus === 'UNDER_REVIEW') return 'pending_review';
    if (rawStatus === 'REJECTED') return 'rejected';
    return 'not_submitted';
  }

  get verificationStateLabel(): string {
    switch (this.verificationState) {
      case 'verified':
        return 'Verified';
      case 'pending_review':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Submitted';
    }
  }

  get verificationBadgeClass(): string {
    switch (this.verificationState) {
      case 'verified':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'pending_review':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'rejected':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  }

  private populateEditFields(): void {
    if (this.user) {
      this.editName = this.user.fullName || this.user.name || '';
      this.editPhone = this.user.phone || '';
      this.editCity = this.user.city || 'Warangal & Hyderabad';
      this.editOccupation = this.user.occupation || 'Property Investor';
    }
  }

  private loadRealProfile(): void {
    this.userService.getProfile().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.user = { ...this.user, ...res.data };
          this.populateEditFields();
        }
      },
      error: () => {},
    });
  }

  private loadOwnerMetrics(): void {
    this.ownerService.getDashboardMetrics().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.metrics = res.data;
        }
      },
      error: () => {},
    });
  }

  onPhotoFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, WebP).';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.userService.updateProfile({ profileImage: base64 }).subscribe({
        next: () => {
          this.user.profileImage = base64;
          this.successMessage = 'Owner photo updated successfully!';
          this.errorMessage = '';
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to update photo.';
        },
      });
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      this.userService.updateProfile({ profileImage: '' }).subscribe({
        next: () => {
          if (this.user) this.user.profileImage = null;
          this.successMessage = 'Photo removed.';
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to remove photo.';
        },
      });
    }
  }

  onSaveProfile(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.editName,
      phone: this.editPhone,
      city: this.editCity,
      occupation: this.editOccupation,
    };

    this.userService.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.user = { ...this.user, ...payload };
        this.successMessage = 'Owner profile updated successfully!';
        this.activeTab = 'overview';
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to update profile.';
      },
    });
  }

  onChangePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.errorMessage = 'Please provide both current and new passwords.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters.';
      return;
    }

    this.isSavingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.successMessage = 'Password updated successfully!';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.activeTab = 'overview';
      },
      error: (err: any) => {
        this.isSavingPassword = false;
        this.errorMessage = err?.error?.message || 'Incorrect current password or change failed.';
      },
    });
  }

  onLogout(): void {
    if (confirm('Are you sure you want to log out?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }
}
