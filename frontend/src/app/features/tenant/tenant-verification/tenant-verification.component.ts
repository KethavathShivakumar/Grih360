import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  VerificationService,
  RentalVerification,
  VerificationStep,
  VerificationDocumentItem,
  VerificationSubmittedInfo,
} from '../../../core/services/verification.service';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">

      <!-- Breadcrumbs & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <a routerLink="/tenant/applications" class="hover:text-indigo-600">My Applications</a>
            <span>/</span>
            <span *ngIf="applicationId">App #{{ applicationId.slice(-6) }}</span>
            <span>/</span>
            <span class="text-slate-800 font-semibold">Verification</span>
          </div>
          <h1 class="text-2xl font-extrabold text-[#0F2937] tracking-tight">Identity & Rental Verification</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Model Tenancy Act compliant verification workflow and background assessment
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <app-status-badge [status]="verification?.status || 'NOT_STARTED'"></app-status-badge>
          <a
            *ngIf="applicationId"
            [routerLink]="['/tenant/applications', applicationId]"
            class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            ← Application Details
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
        <div class="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p class="text-sm font-semibold text-slate-600">Loading verification details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && errorMsg" class="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-rose-900 space-y-3">
        <div class="flex items-center space-x-2 font-bold text-sm">
          <span>⚠️</span>
          <span>{{ errorMsg }}</span>
        </div>
        <div class="flex gap-3">
          <button (click)="loadVerification()" class="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700">
            Retry
          </button>
          <a routerLink="/tenant/applications" class="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-300">
            Back to Applications
          </a>
        </div>
      </div>

      <!-- Main Content when Loaded -->
      <div *ngIf="!loading && !errorMsg" class="space-y-6">

        <!-- Property & Application Snapshot Header -->
        <div class="bg-white rounded-3xl p-5 border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
              <img
                [src]="propertyImage"
                [alt]="propertyTitle"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Target Listing</span>
              <h2 class="text-base font-bold text-slate-900">{{ propertyTitle }}</h2>
              <p class="text-xs text-slate-500">📍 {{ propertyLocation }}</p>
            </div>
          </div>

          <div class="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 text-xs">
            <div>
              <span class="text-slate-400 block font-semibold text-[11px]">Proposed Rent</span>
              <span class="font-extrabold text-[#0F2937] text-sm">₹{{ (application?.proposedRent || 0).toLocaleString('en-IN') }}/mo</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[11px]">Move-In Date</span>
              <span class="font-bold text-slate-800">{{ application?.moveInDate ? (application.moveInDate | date:'mediumDate') : 'Immediate' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[11px]">Application Status</span>
              <span class="font-bold text-indigo-700">{{ application?.status || 'SUBMITTED' }}</span>
            </div>
          </div>
        </div>

        <!-- Verification Progress & Lifecycle Bar -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Verification Workflow Progress</h3>
              <p class="text-sm font-bold text-slate-900 mt-0.5">{{ progressLabel }}</p>
            </div>
            <span class="text-sm font-black text-indigo-600">{{ progressPercentage }}%</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-500 rounded-full"
              [ngClass]="progressBarClass"
              [style.width.%]="progressPercentage"
            ></div>
          </div>

          <!-- 5-Step Flow Indicator -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center text-xs font-semibold">
            <div class="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span class="block text-[10px] text-emerald-600 uppercase">Step 1</span>
              <span>1. Applied ✓</span>
            </div>
            <div
              class="p-2.5 rounded-2xl border"
              [ngClass]="getStepIndicatorClass(['PENDING', 'UNDER_REVIEW', 'VERIFIED'])"
            >
              <span class="block text-[10px] uppercase">Step 2</span>
              <span>2. Requested</span>
            </div>
            <div
              class="p-2.5 rounded-2xl border"
              [ngClass]="getStepIndicatorClass(['PENDING', 'UNDER_REVIEW', 'VERIFIED'])"
            >
              <span class="block text-[10px] uppercase">Step 3</span>
              <span>3. Details Submitted</span>
            </div>
            <div
              class="p-2.5 rounded-2xl border"
              [ngClass]="getStepIndicatorClass(['UNDER_REVIEW', 'VERIFIED'])"
            >
              <span class="block text-[10px] uppercase">Step 4</span>
              <span>4. Under Review</span>
            </div>
            <div
              class="p-2.5 rounded-2xl border"
              [ngClass]="getStepIndicatorClass(['VERIFIED'])"
            >
              <span class="block text-[10px] uppercase">Step 5</span>
              <span>5. Verified ✓</span>
            </div>
          </div>
        </div>

        <!-- Dynamic Status Notification Banner -->
        <div *ngIf="verification?.status === 'VERIFIED'" class="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex items-start space-x-3.5 text-emerald-950">
          <div class="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-bold">✓</div>
          <div class="space-y-1">
            <h4 class="text-sm font-extrabold text-emerald-900">Verification Approved by Compliance Officer</h4>
            <p class="text-xs text-emerald-800">
              Your identity and rental verification have been reviewed and verified. Your application is ready for the tenancy lease agreement.
            </p>
          </div>
        </div>

        <div *ngIf="verification?.status === 'PENDING'" class="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-start space-x-3.5 text-amber-950">
          <div class="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 font-bold">⏳</div>
          <div class="space-y-1">
            <h4 class="text-sm font-extrabold text-amber-900">Verification Pending Administrative Review</h4>
            <p class="text-xs text-amber-800 leading-relaxed">
              Your verification details have been received and recorded. The administrative compliance officer will review your documents. No further action is required from you at this stage.
            </p>
          </div>
        </div>

        <div *ngIf="verification?.status === 'UNDER_REVIEW'" class="bg-indigo-50 border border-indigo-200 p-5 rounded-3xl flex items-start space-x-3.5 text-indigo-950">
          <div class="w-8 h-8 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center shrink-0 font-bold">🔍</div>
          <div class="space-y-1">
            <h4 class="text-sm font-extrabold text-indigo-900">Administrative Assessment in Progress</h4>
            <p class="text-xs text-indigo-800 leading-relaxed">
              A verification officer is actively examining the submitted identity and employment documents. You will receive an immediate notification once review is concluded.
            </p>
          </div>
        </div>

        <div *ngIf="verification?.status === 'REJECTED'" class="bg-rose-50 border border-rose-200 p-5 rounded-3xl flex items-start space-x-3.5 text-rose-950">
          <div class="w-8 h-8 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 font-bold">✕</div>
          <div class="space-y-1 flex-1">
            <h4 class="text-sm font-extrabold text-rose-900">Verification Requires Resubmission</h4>
            <p class="text-xs text-rose-800">
              Reason: <span class="font-semibold">{{ verification?.rejectionReason || 'Uploaded documents were unreadable or failed verification checks.' }}</span>
            </p>
            <p class="text-xs text-rose-700 mt-1 font-medium">
              Please correct the requested information and re-submit using the form below.
            </p>
          </div>
        </div>

        <div *ngIf="verification?.status === 'NOT_STARTED'" class="bg-blue-50 border border-blue-200 p-5 rounded-3xl flex items-start space-x-3.5 text-blue-950">
          <div class="w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 font-bold">ℹ️</div>
          <div class="space-y-1">
            <h4 class="text-sm font-extrabold text-blue-900">Verification Steps Required</h4>
            <p class="text-xs text-blue-800">
              Please complete the identity and employment verification details below to advance your rental application.
            </p>
          </div>
        </div>

        <!-- Privacy & Protection Shield Notice -->
        <div class="bg-slate-900 text-white rounded-3xl p-5 shadow-xs flex items-start space-x-3.5">
          <span class="text-xl">🛡️</span>
          <div class="space-y-1 text-xs">
            <span class="font-extrabold text-white text-sm block">Isolated & Encrypted Identity Vault</span>
            <p class="text-slate-300 leading-relaxed">
              In strict accordance with data privacy regulations, full unmasked identity documents are <strong class="text-white">NEVER exposed to property owners</strong>. Property owners receive only verified/unverified high-level status confirmations. Only authorized Nivas360 compliance officers access audit files.
            </p>
          </div>
        </div>

        <!-- Required Verification Steps Checklist -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Required Verification Steps</h3>
            <p class="text-xs text-slate-500 mt-0.5">Mandatory verification checks required prior to lease agreement execution</p>
          </div>

          <div class="space-y-3">
            <!-- Step 1: ID Verification -->
            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-bold text-slate-900">1. Government Photo ID (Passport / Voter ID / Driving License)</span>
                  <span class="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded-md">
                    Manual review active
                  </span>
                </div>
                <p class="text-xs text-slate-500">
                  Direct government registry sync coming soon. Manual document upload and compliance officer review currently active.
                </p>
              </div>
              <div class="shrink-0">
                <span [class]="getStepBadgeClass(getStepStatus('ID_VERIFICATION'))" class="px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {{ getStepStatus('ID_VERIFICATION') }}
                </span>
              </div>
            </div>

            <!-- Step 2: Income Verification -->
            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-bold text-slate-900">2. Employment & Income Proof</span>
                </div>
                <p class="text-xs text-slate-500">
                  Salary slips, bank statement, or employment offer letter to verify rent-to-income ratio.
                </p>
              </div>
              <div class="shrink-0">
                <span [class]="getStepBadgeClass(getStepStatus('INCOME_VERIFICATION'))" class="px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {{ getStepStatus('INCOME_VERIFICATION') }}
                </span>
              </div>
            </div>

            <!-- Step 3: Rental History -->
            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-bold text-slate-900">3. Rental History & Tenancy References</span>
                </div>
                <p class="text-xs text-slate-500">
                  Previous landlord contact and current residential address confirmation.
                </p>
              </div>
              <div class="shrink-0">
                <span [class]="getStepBadgeClass(getStepStatus('RENTAL_HISTORY'))" class="px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {{ getStepStatus('RENTAL_HISTORY') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submitted Information Summary (if already submitted) -->
        <div *ngIf="hasSubmittedInfo || hasSubmittedDocs" class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Submitted Information Snapshot</h3>
              <p class="text-xs text-slate-500 mt-0.5">Recorded on {{ verification?.submittedAt | date:'medium' }}</p>
            </div>
            <span class="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              Audit Record #{{ (verification?._id || verification?.id || '').slice(-6) }}
            </span>
          </div>

          <!-- Submitted Info Grid -->
          <div *ngIf="verification?.submittedInfo" class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Full Legal Name</span>
              <span class="font-bold text-slate-800 text-sm mt-0.5 block">{{ verification?.submittedInfo?.fullName || 'Not provided' }}</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Mobile Phone</span>
              <span class="font-bold text-slate-800 text-sm mt-0.5 block">{{ verification?.submittedInfo?.phone || 'Not provided' }}</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Email Address</span>
              <span class="font-bold text-slate-800 text-sm mt-0.5 block truncate">{{ verification?.submittedInfo?.email || 'Not provided' }}</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Employer / Company</span>
              <span class="font-semibold text-slate-800 mt-0.5 block">{{ verification?.submittedInfo?.employerName || 'Employed' }}</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Designation</span>
              <span class="font-semibold text-slate-800 mt-0.5 block">{{ verification?.submittedInfo?.designation || 'Professional' }}</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span class="text-slate-400 font-bold block text-[11px]">Declared Monthly Income</span>
              <span class="font-extrabold text-[#2D7A5E] mt-0.5 block">
                {{ verification?.submittedInfo?.monthlyIncome ? ('₹' + verification?.submittedInfo?.monthlyIncome?.toLocaleString('en-IN') + '/mo') : 'Verified' }}
              </span>
            </div>
          </div>

          <!-- Documents List -->
          <div *ngIf="hasSubmittedDocs" class="space-y-2 pt-2">
            <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Submitted Verification Documents</span>
            <div class="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              <div *ngFor="let doc of submittedDocuments" class="p-3 bg-white flex items-center justify-between text-xs">
                <div class="flex items-center space-x-3">
                  <span class="p-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold">📄</span>
                  <div>
                    <span class="font-bold text-slate-800 block">{{ doc.documentName || doc.documentType }}</span>
                    <span class="text-slate-400 text-[11px]">Masked ID: {{ doc.maskedIdentifier || 'XXXX-XXXX-****' }} • Uploaded: {{ doc.uploadedAt | date:'shortDate' }}</span>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase"
                  [ngClass]="{
                    'bg-emerald-50 text-emerald-700 border border-emerald-200': doc.status === 'VERIFIED',
                    'bg-amber-50 text-amber-700 border border-amber-200': doc.status === 'PENDING' || doc.status === 'UNDER_REVIEW',
                    'bg-rose-50 text-rose-700 border border-rose-200': doc.status === 'REJECTED'
                  }"
                >
                  {{ doc.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Steps Submission Form -->
        <!-- Only shown when NOT_STARTED, REJECTED, or when user opts to update/resubmit -->
        <div
          *ngIf="canSubmitForm"
          class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs space-y-6"
        >
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-base font-extrabold text-slate-900">
              {{ verification?.status === 'REJECTED' ? 'Resubmit Verification Documents' : 'Complete Verification Steps' }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Enter your identity and employment details. Submitting transitions your verification status to PENDING for review.
            </p>
          </div>

          <form (ngSubmit)="submit()" class="space-y-6">

            <!-- Section 1: Government Identity Document -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Step 1 — Government Identity Document
                </h4>
                <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                  Required
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Document Type</label>
                  <select
                    [(ngModel)]="documentType"
                    name="documentType"
                    class="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID Card</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="PAN">PAN Card</option>
                    <option value="AADHAAR">Government ID (Masked)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Document Number (Last 4 Digits or ID)</label>
                  <input
                    type="text"
                    [(ngModel)]="documentNumber"
                    name="documentNumber"
                    placeholder="e.g. Last 4 digits or ID number"
                    class="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Only masked reference is stored. Never enter full Aadhaar numbers.</span>
                </div>
              </div>

              <!-- Real Document Upload Control -->
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-slate-700">Identity Document File (Image or PDF, Max 5 MB)</label>

                <!-- File Select / Photo Dropzone -->
                <div *ngIf="!selectedFile && !uploadedDocumentRecord" class="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    (change)="onFileSelected($event)"
                    accept="image/*,application/pdf"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div class="space-y-1 pointer-events-none">
                    <span class="text-3xl block">📸</span>
                    <span class="text-xs font-extrabold text-[#0F2937] block">Choose file or Take photo</span>
                    <span class="text-[11px] text-slate-500 block">Supports JPG, PNG or PDF (Max ~5 MB). Camera & gallery enabled on Android.</span>
                  </div>
                </div>

                <!-- Selected File Preview & Upload Status -->
                <div *ngIf="selectedFile" class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center space-x-3 min-w-0">
                      <!-- Image Thumbnail Preview -->
                      <div *ngIf="previewUrl" class="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                        <img [src]="previewUrl" alt="Document preview" class="w-full h-full object-cover" />
                      </div>
                      <!-- PDF Icon -->
                      <div *ngIf="!previewUrl" class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200">
                        PDF
                      </div>

                      <div class="min-w-0">
                        <p class="text-xs font-bold text-slate-900 truncate">{{ selectedFile.name }}</p>
                        <p class="text-[10px] text-slate-500">{{ (selectedFile.size / 1024).toFixed(0) }} KB • {{ selectedFile.type || 'Document' }}</p>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-2 shrink-0">
                      <button
                        *ngIf="!uploadedDocumentRecord && !isUploading"
                        (click)="uploadDocument()"
                        type="button"
                        class="px-3 py-1.5 bg-[#0F2937] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#164E63] cursor-pointer"
                      >
                        Upload Now
                      </button>

                      <button
                        (click)="removeSelectedFile()"
                        type="button"
                        class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <!-- Upload Progress Bar -->
                  <div *ngIf="isUploading" class="space-y-1">
                    <div class="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>Encrypting & Storing in Vault...</span>
                      <span>{{ uploadProgress }}%</span>
                    </div>
                    <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-indigo-600 h-full transition-all duration-300" [style.width.%]="uploadProgress"></div>
                    </div>
                  </div>

                  <!-- Confirmed Upload Badge (Shows only after backend confirmation) -->
                  <div *ngIf="uploadedDocumentRecord" class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <span class="text-emerald-700 font-extrabold text-sm">✓</span>
                    <span>Document uploaded & confirmed by backend (Key: {{ uploadedDocumentRecord.storageKey }})</span>
                  </div>
                </div>

                <div *ngIf="uploadError" class="text-xs text-rose-600 font-bold">
                  ⚠️ {{ uploadError }}
                </div>
              </div>
            </div>

            <!-- Section 3: Contact & Rental History -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Step 3 — Address & References
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Current Residential Address</label>
                  <textarea
                    [(ngModel)]="formData.currentAddress"
                    name="currentAddress"
                    rows="2"
                    placeholder="House/Flat No, Street, Locality, City, PIN"
                    class="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Previous Landlord / Reference Contact (Optional)</label>
                  <textarea
                    [(ngModel)]="formData.previousLandlordContact"
                    name="previousLandlordContact"
                    rows="2"
                    placeholder="Landlord Name & Phone Number"
                    class="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Statutory Declaration Checkbox -->
            <div class="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-start space-x-3">
              <input
                type="checkbox"
                [(ngModel)]="declarationAccepted"
                name="declarationAccepted"
                id="declarationAccepted"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label for="declarationAccepted" class="text-xs text-indigo-950 leading-relaxed cursor-pointer">
                <strong>Statutory Tenant Declaration:</strong> I hereby certify that the information and identity details provided are true, correct, and complete. I authorize Nivas360 compliance personnel to verify the submitted documents for tenancy eligibility in accordance with the Model Tenancy Act.
              </label>
            </div>

            <!-- Action Submission Buttons -->
            <div class="flex items-center justify-end space-x-3 pt-2">
              <button
                type="submit"
                [disabled]="submitting || !declarationAccepted"
                class="px-6 py-3 bg-[#0F2937] hover:bg-[#1E3E52] text-white text-xs font-extrabold rounded-2xl shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span *ngIf="submitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ submitting ? 'Submitting for Review...' : 'Submit Verification (Set Status to PENDING)' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Next Action Summary Card -->
        <div class="bg-white rounded-3xl p-6 border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Next Action</span>
            <h4 class="text-sm font-extrabold text-slate-800">{{ nextActionText }}</h4>
            <p class="text-xs text-slate-500">{{ nextActionDescription }}</p>
          </div>

          <div class="shrink-0">
            <a
              *ngIf="verification?.status === 'VERIFIED'"
              routerLink="/tenant/rentals"
              class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition inline-block"
            >
              View Lease Agreement →
            </a>
            <a
              *ngIf="verification?.status !== 'VERIFIED'"
              [routerLink]="['/tenant/applications', applicationId]"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition inline-block"
            >
              Return to Application
            </a>
          </div>
        </div>

      </div>

    </div>
  `,
})
export class TenantVerificationComponent implements OnInit {
  public applicationId: string = '';
  public verification: RentalVerification | null = null;
  public application: RentalApplication | any = null;
  public property: any = null;

  public loading: boolean = true;
  public submitting: boolean = false;
  public errorMsg: string = '';

  // Form Fields
  public documentType: string = 'PASSPORT';
  public documentNumber: string = '';
  public declarationAccepted: boolean = false;
  public formData: VerificationSubmittedInfo = {
    fullName: '',
    phone: '',
    email: '',
    currentAddress: '',
    employerName: '',
    designation: '',
    monthlyIncome: undefined,
    previousLandlordContact: '',
  };

  constructor(
    private verificationService: VerificationService,
    private applicationService: ApplicationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.applicationId = params.get('applicationId') || params.get('id') || '';
      if (this.applicationId) {
        this.loadVerification();
      } else {
        // If no applicationId provided in URL, look up the tenant's latest application
        this.loadLatestApplicationVerification();
      }
    });
  }

  loadLatestApplicationVerification(): void {
    this.loading = true;
    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        const apps = res.data || [];
        if (apps.length > 0) {
          // Find an application requiring verification or most recent
          const appWithVerif = apps.find((a: any) =>
            ['VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'UNDER_REVIEW', 'SUBMITTED'].includes(a.status)
          ) || apps[0];

          this.applicationId = appWithVerif._id || appWithVerif.id;
          this.loadVerification();
        } else {
          this.loading = false;
          this.errorMsg = 'No active rental applications found. Please apply for a property first.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = 'Failed to load tenant applications.';
      },
    });
  }

  get hasSubmittedInfo(): boolean {
    return !!this.verification?.submittedInfo;
  }

  get hasSubmittedDocs(): boolean {
    return !!(this.verification?.documents && this.verification.documents.length > 0);
  }

  get submittedDocuments(): VerificationDocumentItem[] {
    return this.verification?.documents || [];
  }

  loadVerification(): void {
    if (!this.applicationId) return;
    this.loading = true;
    this.errorMsg = '';

    this.verificationService.getVerificationByApplicationId(this.applicationId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.verification = res.data.verification;
          this.application = res.data.application;
          this.property = res.data.property || this.application?.propertyId;

          // Pre-fill form from user profile or existing submission
          const user = this.authService.getCurrentUser();
          this.formData.fullName = this.verification?.submittedInfo?.fullName || user?.name || '';
          this.formData.phone = this.verification?.submittedInfo?.phone || user?.phone || '';
          this.formData.email = this.verification?.submittedInfo?.email || user?.email || '';
          this.formData.employerName = this.verification?.submittedInfo?.employerName || '';
          this.formData.designation = this.verification?.submittedInfo?.designation || '';
          this.formData.monthlyIncome = this.verification?.submittedInfo?.monthlyIncome || this.application?.proposedRent ? this.application.proposedRent * 3 : undefined;
          this.formData.currentAddress = this.verification?.submittedInfo?.currentAddress || '';
          this.formData.previousLandlordContact = this.verification?.submittedInfo?.previousLandlordContact || '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Unable to load verification details for this application.';
      },
    });
  }

  get propertyTitle(): string {
    return this.property?.title || this.application?.propertyId?.title || 'Rental Listing';
  }

  get propertyLocation(): string {
    const loc = this.property?.propertyLocation || this.application?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address || ''}, ${loc.city || ''}` : 'Location provided in listing';
  }

  get propertyImage(): string {
    const images = this.property?.images || this.application?.propertyId?.images;
    return images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  get canSubmitForm(): boolean {
    if (!this.verification) return true;
    return this.verification.status === 'NOT_STARTED' || this.verification.status === 'REJECTED';
  }

  get progressPercentage(): number {
    const st = this.verification?.status;
    if (st === 'VERIFIED') return 100;
    if (st === 'UNDER_REVIEW') return 75;
    if (st === 'PENDING') return 50;
    if (st === 'REJECTED') return 25;
    return 10;
  }

  get progressLabel(): string {
    const st = this.verification?.status;
    if (st === 'VERIFIED') return '100% Completed — Verified';
    if (st === 'UNDER_REVIEW') return '75% Completed — Under Review';
    if (st === 'PENDING') return '50% Completed — Documents Submitted (Pending Review)';
    if (st === 'REJECTED') return 'Action Required — Review and Resubmit';
    return '10% — Submission Required';
  }

  get progressBarClass(): string {
    const st = this.verification?.status;
    if (st === 'VERIFIED') return 'bg-emerald-600';
    if (st === 'UNDER_REVIEW') return 'bg-indigo-600';
    if (st === 'PENDING') return 'bg-amber-500';
    if (st === 'REJECTED') return 'bg-rose-500';
    return 'bg-blue-500';
  }

  getStepStatus(stepId: string): string {
    const step = this.verification?.steps?.find((s) => s.stepId === stepId);
    return step?.status || 'NOT_STARTED';
  }

  getStepBadgeClass(status: string): string {
    if (status === 'VERIFIED') return 'bg-emerald-100 text-emerald-800';
    if (status === 'PENDING' || status === 'UNDER_REVIEW') return 'bg-amber-100 text-amber-800';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-600';
  }

  getStepIndicatorClass(activeStatuses: string[]): any {
    const current = this.verification?.status || 'NOT_STARTED';
    if (activeStatuses.includes(current)) {
      return 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold';
    }
    return 'bg-slate-50 text-slate-400 border-slate-200';
  }

  get nextActionText(): string {
    const st = this.verification?.status;
    if (st === 'VERIFIED') return 'Lease Agreement Ready';
    if (st === 'PENDING') return 'Awaiting Administrative Review';
    if (st === 'UNDER_REVIEW') return 'Under Administrative Inspection';
    if (st === 'REJECTED') return 'Resubmit Valid Documentation';
    return 'Complete and Submit Verification Details';
  }

  get nextActionDescription(): string {
    const st = this.verification?.status;
    if (st === 'VERIFIED') return 'Your verification passed compliance checks. Proceed to review the tenancy agreement.';
    if (st === 'PENDING') return 'Your verification status is PENDING. The compliance officer will review your documents.';
    if (st === 'UNDER_REVIEW') return 'The compliance officer is actively verifying your records.';
    if (st === 'REJECTED') return 'Review the rejection notes above, correct your submission, and submit again.';
    return 'Submit identity and income documents above to progress your application.';
  }

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  uploadedDocumentRecord: any = null;
  uploadError: string | null = null;

  onFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'File size exceeds 5 MB. Please choose a smaller file.';
      return;
    }

    this.uploadError = null;
    this.selectedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          this.previewUrl = canvas.toDataURL('image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 30;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadProgress = 60;
      const base64Data = this.previewUrl || e.target.result;

      this.verificationService.uploadDocumentFile({
        documentType: this.documentType,
        fileName: this.selectedFile?.name,
        mimeType: this.selectedFile?.type || 'image/jpeg',
        dataBase64: base64Data,
        maskedNumber: this.documentNumber ? `XXXX-XXXX-${this.documentNumber.slice(-4)}` : undefined,
      }).subscribe({
        next: (res: any) => {
          this.uploadProgress = 100;
          this.isUploading = false;
          if (res.success && res.data) {
            this.uploadedDocumentRecord = res.data;
          }
        },
        error: (err: any) => {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.uploadError = err?.error?.message || 'Failed to store document file.';
        },
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadedDocumentRecord = null;
    this.uploadProgress = 0;
    this.uploadError = null;
  }

  submit(): void {
    if (!this.declarationAccepted) {
      alert('Please accept the statutory tenant declaration to submit verification.');
      return;
    }

    if (!this.documentNumber.trim()) {
      alert('Please provide a document identifier number.');
      return;
    }

    this.submitting = true;

    const docItem: any = {
      documentType: this.documentType,
      documentNumber: this.documentNumber.trim(),
      notes: `Submitted ${this.documentType} verification`,
    };

    if (this.uploadedDocumentRecord?.storageKey) {
      docItem.storageKey = this.uploadedDocumentRecord.storageKey;
    }

    const payload = {
      documents: [docItem],
      submittedInfo: {
        fullName: this.formData.fullName,
        phone: this.formData.phone,
        email: this.formData.email,
        currentAddress: this.formData.currentAddress,
        previousLandlordContact: this.formData.previousLandlordContact,
        declarationAccepted: this.declarationAccepted,
      },
      notes: 'Tenant submitted verification details via dedicated portal',
    };

    this.verificationService
      .submitVerificationForApplication(this.applicationId, payload)
      .subscribe({
        next: (res) => {
          this.submitting = false;
          if (res.success) {
            this.verification = res.data;
            this.loadVerification(); // Refresh state
          }
        },
        error: (err) => {
          this.submitting = false;
          alert(err.error?.message || 'Verification submission failed. Please try again.');
        },
      });
  }
}
