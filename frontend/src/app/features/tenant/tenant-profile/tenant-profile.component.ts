import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PropertyService } from '../../../core/services/property.service';
import { ApplicationService } from '../../../core/services/application.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-[#0F2937] tracking-tight">Tenant Account & Profile</h1>
          <p class="text-xs text-slate-500">Manage your profile details, photo, security settings, and verified tenancy documents.</p>
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

      <!-- Success / Error Banners -->
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
        <!-- Hero Card with Photo Management -->
        <div class="bg-white p-6 sm:p-8 rounded-xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <!-- Profile Photo with Default Placeholder and Upload Actions -->
            <div class="relative group">
              <div class="w-24 h-24 rounded-full bg-navy text-n-0 flex items-center justify-center font-semibold text-3xl shadow-md border-4 border-white overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 class="text-xl sm:text-2xl font-semibold text-slate-900">{{ userName }}</h2>
                <span
                  *ngIf="verificationState === 'verified'"
                  class="inline-flex items-center text-[10px] font-semibold text-[#2D7A5E] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide"
                >
                  Verified Tenant
                </span>
                <span
                  *ngIf="verificationState !== 'verified'"
                  class="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide"
                >
                  Tenant
                </span>
              </div>
              <p class="text-xs text-slate-500">{{ user?.email }} • +91 {{ user?.phone || 'Not set' }}</p>
              <p class="text-xs text-slate-600 font-medium pt-1">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {{ user?.city || 'Hyderabad, Telangana' }} • <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> {{ user?.occupation || 'Software Professional' }}
              </p>
            </div>
          </div>

          <!-- Photo Action Buttons -->
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

        <!-- Tenancy Portfolio Stats Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Saved Homes -->
          <div routerLink="/tenant/saved" class="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bookmarked Homes</span>
              <span class="text-xl  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></span>
            </div>
            <span class="text-3xl font-semibold text-[#0F2937] mt-2 block">{{ savedCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">View Saved Listings →</span>
          </div>

          <!-- Applications Summary -->
          <div routerLink="/tenant/applications" class="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted Applications</span>
              <span class="text-xl  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
            </div>
            <span class="text-3xl font-semibold text-[#0F2937] mt-2 block">{{ applicationCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">Track Applications →</span>
          </div>

          <!-- Active Rental Agreement Summary -->
          <div routerLink="/tenant/rental" class="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rental Agreements</span>
              <span class="text-xl  transition-transform"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg></span>
            </div>
            <span class="text-3xl font-semibold text-[#0F2937] mt-2 block">1</span>
            <span class="text-xs text-slate-400 font-bold mt-1 block">Model Tenancy Act Compliant</span>
          </div>
        </div>

        <!-- Mobile Workspace Quick Navigation Grid -->
        <div class="bg-white p-6 rounded-xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-semibold text-[#0F2937] uppercase tracking-wider flex items-center gap-2">
              <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></span>
              <span>All Tenant Tools & Features</span>
            </h3>
            <p class="text-[11px] text-slate-500">Access your complete tenancy suite and digital services</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              routerLink="/tenant/applications"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#2D7A5E] flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Applications</span>
                <span class="text-[10px] text-slate-400 block">Status & History</span>
              </div>
            </a>

            <a
              routerLink="/tenant/verification"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">KYC Verification</span>
                <span class="text-[10px] text-slate-400 block">Government ID</span>
              </div>
            </a>

            <a
              routerLink="/tenant/rent"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Rent Payments</span>
                <span class="text-[10px] text-slate-400 block">Tracking & Receipts</span>
              </div>
            </a>

            <a
              routerLink="/tenant/documents"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#2D7A5E] flex items-center justify-center text-sm font-bold  transition-transform">
                
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Document Vault</span>
                <span class="text-[10px] text-slate-400 block">Leases & Receipts</span>
              </div>
            </a>

            <a
              routerLink="/tenant/handover"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Handover Check</span>
                <span class="text-[10px] text-slate-400 block">Move-in Inventory</span>
              </div>
            </a>

            <a
              routerLink="/tenant/condition"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Property State</span>
                <span class="text-[10px] text-slate-400 block">Inspection Log</span>
              </div>
            </a>

            <a
              routerLink="/tenant/services"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-700 flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Home Services</span>
                <span class="text-[10px] text-slate-400 block">Repairs & Pro Services</span>
              </div>
            </a>

            <a
              routerLink="/tenant/settings"
              class="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all flex flex-col justify-between gap-2 group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-700 flex items-center justify-center text-sm font-bold  transition-transform">
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block group-hover:text-[#2D7A5E]">Settings</span>
                <span class="text-[10px] text-slate-400 block">Preferences & Security</span>
              </div>
            </a>
          </div>
        </div>

        <!-- Identity & Document Verification Section -->
        <div class="bg-white p-6 rounded-xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-xs font-semibold text-[#0F2937] uppercase tracking-wider flex items-center gap-2">
              <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></span>
              <span>Identity & Document Verification</span>
            </h3>
            <span [ngClass]="verificationBadgeClass" class="text-xs font-semibold px-2.5 py-1 rounded-full border">
              {{ verificationStateLabel }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <!-- Government ID Status Card -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Government Photo ID</span>
                <span class="font-bold text-slate-800 text-sm block">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'" class="text-emerald-700"> ID Verified</span>
                    <span *ngSwitchCase="'pending_review'" class="text-amber-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> ID Document Under Review</span>
                    <span *ngSwitchCase="'rejected'" class="text-rose-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> ID Document Rejected</span>
                    <span *ngSwitchDefault class="text-slate-600">ID Document: Not Submitted</span>
                  </ng-container>
                </span>
                <p class="text-[11px] text-slate-500 pt-0.5">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'">Verified for digital tenancy agreements.</span>
                    <span *ngSwitchCase="'pending_review'">Document received and pending administrative compliance check.</span>
                    <span *ngSwitchCase="'rejected'">Your submission was rejected. Please re-upload a valid government ID.</span>
                    <span *ngSwitchDefault>Passport, Voter ID, or Driving License.</span>
                  </ng-container>
                </p>
              </div>
              <div *ngIf="verificationState === 'not_submitted' || verificationState === 'rejected'">
                <a
                  routerLink="/tenant/verification"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-[11px] font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
                  <span>Upload Document</span>
                </a>
              </div>
            </div>

            <!-- Employment / Income Proof Status Card -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Employment & Income Proof</span>
                <span class="font-bold text-slate-800 text-sm block">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'" class="text-emerald-700"> Income Proof Verified</span>
                    <span *ngSwitchCase="'pending_review'" class="text-amber-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Income Proof Under Review</span>
                    <span *ngSwitchCase="'rejected'" class="text-rose-700"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Income Proof Rejected</span>
                    <span *ngSwitchDefault class="text-slate-600">Income Proof: Not Submitted</span>
                  </ng-container>
                </span>
                <p class="text-[11px] text-slate-500 pt-0.5">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'">Salary slip / employment status verified.</span>
                    <span *ngSwitchCase="'pending_review'">Salary slip or bank statement under review.</span>
                    <span *ngSwitchCase="'rejected'">Document was rejected. Please re-upload a valid salary slip.</span>
                    <span *ngSwitchDefault>Upload salary slip or offer letter to verify rent eligibility.</span>
                  </ng-container>
                </p>
              </div>
              <div *ngIf="verificationState === 'not_submitted' || verificationState === 'rejected'">
                <a
                  routerLink="/tenant/verification"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-[11px] font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
                  <span>Upload Document</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: EDIT PROFILE -->
      <div *ngIf="activeTab === 'edit'" class="bg-white p-6 sm:p-8 rounded-xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-semibold text-[#0F2937]">Edit Tenant Information</h2>
          <p class="text-xs text-slate-500">Update your public contact info, occupation, and preferred residential city.</p>
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
              <label class="text-xs font-bold text-slate-700 block">Current City / Locality</label>
              <input
                type="text"
                [(ngModel)]="editCity"
                name="city"
                placeholder="e.g. Hyderabad / Warangal"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Occupation / Organization</label>
              <input
                type="text"
                [(ngModel)]="editOccupation"
                name="occupation"
                placeholder="e.g. Software Engineer / Consultant"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">About / Tenant Bio</label>
            <textarea
              [(ngModel)]="editBio"
              name="bio"
              rows="3"
              placeholder="Brief details for property owners (family size, move-in preferences, non-smoker, etc.)..."
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            ></textarea>
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
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {{ isSaving ? 'Saving Changes...' : 'Save Profile Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 3: SECURITY & PASSWORD -->
      <div *ngIf="activeTab === 'security'" class="bg-white p-6 sm:p-8 rounded-xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-semibold text-[#0F2937]">Password & Authentication</h2>
          <p class="text-xs text-slate-500">Manage your sign-in methods and account credentials.</p>
        </div>

        <!-- Linked Sign-in Methods -->
        <div class="space-y-2">
          <label class="font-bold text-slate-700 block text-xs">Linked Sign-in Methods</label>
          <div class="flex flex-wrap gap-2">
            <span *ngIf="hasGoogleLinked" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              Google Sign-in: Active
            </span>
            <span *ngIf="hasPasswordAccount" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              Email & Password: Set
            </span>
            <span *ngIf="!hasPasswordAccount" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Password: Not Set (Google Only)
            </span>
          </div>
        </div>

        <!-- Section A: When user HAS password -> Show CHANGE PASSWORD -->
        <form *ngIf="hasPasswordAccount" (ngSubmit)="onChangePassword()" class="space-y-4 max-w-md pt-2">
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
              placeholder="Minimum 8 characters"
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
              class="px-6 py-2.5 bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {{ isSavingPassword ? 'Updating Password...' : 'Change Password' }}
            </button>
          </div>
        </form>

        <!-- Section B: When user is GOOGLE-ONLY -> Show SET PASSWORD with OTP -->
        <div *ngIf="!hasPasswordAccount" class="space-y-4 max-w-md pt-2">
          <h3 class="text-xs font-semibold text-[#0F2937] uppercase tracking-wider">Set Account Password</h3>
          <p class="text-xs text-slate-600">
            Your account currently signs in through Google. Set a password to also log in with your email and password. A verification code will be sent to your email ({{ user?.email }}).
          </p>

          <div *ngIf="!setPasswordOtpSent" class="pt-2">
            <button
              (click)="sendSetPasswordOtp()"
              [disabled]="isSendingSetPasswordOtp"
              type="button"
              class="w-full px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg *ngIf="isSendingSetPasswordOtp" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSendingSetPasswordOtp ? 'Sending OTP...' : 'Send Verification OTP to Email' }}</span>
            </button>
          </div>

          <div *ngIf="setPasswordOtpSent" class="space-y-4">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
              Verification code sent to <strong>{{ user?.email }}</strong>. Please check your inbox.
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">6-Digit Verification Code *</label>
              <input
                type="text"
                [(ngModel)]="setOtp"
                placeholder="Enter 6-digit OTP"
                maxlength="6"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono tracking-widest text-center text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">New Password *</label>
              <input
                type="password"
                [(ngModel)]="newPassword"
                placeholder="Minimum 8 characters (upper, lower, num, sym)"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Confirm New Password *</label>
              <input
                type="password"
                [(ngModel)]="confirmPassword"
                placeholder="Re-enter new password"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="flex items-center justify-between pt-2">
              <button
                (click)="sendSetPasswordOtp()"
                [disabled]="isSendingSetPasswordOtp"
                type="button"
                class="text-xs font-semibold text-[#2D7A5E] hover:underline cursor-pointer"
              >
                Resend code
              </button>
              <button
                (click)="submitSetPassword()"
                [disabled]="isSavingPassword || !setOtp || !newPassword || !confirmPassword"
                type="button"
                class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <svg *ngIf="isSavingPassword" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isSavingPassword ? 'Saving...' : 'Set Password' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Actions (Logout) -->
      <div class="p-6 bg-rose-50/60 rounded-xl border border-rose-200/80 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold text-rose-900">Sign Out of Account</h4>
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
        <p class="text-[11px] font-mono font-bold text-slate-700">
          Grih360 App v{{ appVersion }} (Commit: {{ commitHash }})
        </p>
        <p class="text-[10px] font-mono text-slate-500">
          API Base URL: {{ apiUrl }}
        </p>
        <p class="text-[10px] font-mono text-slate-400">
          Build Time: {{ buildTimestamp }}
        </p>
      </div>
    </div>
  `,
})
export class TenantProfileComponent implements OnInit {
  appVersion: string = (environment as any).appVersion || '1.4.8';
  commitHash: string = (environment as any).commitHash || 'ebb30e1';
  apiUrl: string = environment.apiUrl;
  buildTimestamp: string = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  user: any = null;
  activeTab: 'overview' | 'edit' | 'security' = 'overview';

  savedCount: number = 0;
  applicationCount: number = 0;

  editName: string = '';
  editPhone: string = '';
  editCity: string = '';
  editOccupation: string = '';
  editBio: string = '';

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  setOtp: string = '';
  setPasswordOtpSent: boolean = false;
  isSendingSetPasswordOtp: boolean = false;

  get hasPasswordAccount(): boolean {
    return Boolean(this.user?.hasPassword);
  }

  get hasGoogleLinked(): boolean {
    return Boolean(
      Array.isArray(this.user?.authProviders) &&
      this.user.authProviders.includes('GOOGLE')
    );
  }

  isSaving: boolean = false;
  isSavingPassword: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private propertyService: PropertyService,
    private applicationService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.populateEditFields();
    this.loadStats();
    this.loadRealProfile();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Tenant User';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'T';
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
      this.editCity = this.user.city || 'Hyderabad';
      this.editOccupation = this.user.occupation || 'Software Professional';
      this.editBio = this.user.bio || '';
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

  private loadStats(): void {
    this.propertyService.getSavedProperties().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.savedCount = res.data.length;
        }
      },
    });

    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.applicationCount = res.data.length;
        }
      },
    });
  }

  onPhotoFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, WebP).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Profile photo file size must be less than 5MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.userService.updateProfile({ profileImage: base64 }).subscribe({
        next: (res: any) => {
          this.user.profileImage = base64;
          this.successMessage = 'Profile photo updated successfully!';
          this.errorMessage = '';
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to upload photo.';
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
          this.successMessage = 'Profile photo removed.';
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
      bio: this.editBio,
    };

    this.userService.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.user = { ...this.user, ...payload };
        this.successMessage = 'Profile updated successfully!';
        this.activeTab = 'overview';
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to update profile.';
      },
    });
  }

  sendSetPasswordOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSendingSetPasswordOtp = true;
    this.userService.sendSetPasswordOtp().subscribe({
      next: (res: any) => {
        this.isSendingSetPasswordOtp = false;
        this.setPasswordOtpSent = true;
        this.successMessage = res?.message || 'Verification code sent to your registered email.';
        setTimeout(() => (this.successMessage = ''), 4000);
      },
      error: (err: any) => {
        this.isSendingSetPasswordOtp = false;
        this.errorMessage = err?.error?.message || 'Failed to send verification code. Please try again.';
      },
    });
  }

  submitSetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const cleanOtp = (this.setOtp || '').trim();
    if (cleanOtp.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code.';
      return;
    }
    if (!this.newPassword) {
      this.errorMessage = 'Please enter your new password.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage = 'New password must be at least 8 characters long.';
      return;
    }
    if (
      !/[A-Z]/.test(this.newPassword) ||
      !/[a-z]/.test(this.newPassword) ||
      !/[0-9]/.test(this.newPassword) ||
      !/[^A-Za-z0-9]/.test(this.newPassword)
    ) {
      this.errorMessage = 'Password must include uppercase, lowercase, number, and special character.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirmation password do not match.';
      return;
    }

    this.isSavingPassword = true;
    this.userService.setPassword({ otp: cleanOtp, newPassword: this.newPassword }).subscribe({
      next: (res: any) => {
        this.isSavingPassword = false;
        this.successMessage = res?.message || 'Password created successfully! Both Google and email sign-in are now active.';
        if (this.user) {
          this.user.hasPassword = true;
          const providers = Array.isArray(this.user.authProviders) ? [...this.user.authProviders] : [];
          if (!providers.includes('LOCAL')) providers.push('LOCAL');
          this.user.authProviders = providers;
          this.authService.updateCurrentUser(this.user);
        }
        this.setPasswordOtpSent = false;
        this.setOtp = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => (this.successMessage = ''), 5000);
      },
      error: (err: any) => {
        this.isSavingPassword = false;
        this.errorMessage = err?.error?.message || 'Failed to set password. Please check the code and try again.';
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

    if (this.newPassword.length < 8) {
      this.errorMessage = 'New password must be at least 8 characters.';
      return;
    }

    this.isSavingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.successMessage = 'Password changed successfully!';
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
