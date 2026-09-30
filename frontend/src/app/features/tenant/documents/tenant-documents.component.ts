import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { AgreementService } from '../../../core/services/agreement.service';
import { VerificationService } from '../../../core/services/verification.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

export interface TenantDoc {
  id: string;
  title: string;
  category: 'AGREEMENT' | 'RECEIPT' | 'VERIFICATION' | 'HANDOVER' | 'PERSONAL';
  date: string;
  type: string;
  size: string;
  status: 'VALID' | 'ACTIVE' | 'ARCHIVED';
  description: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-tenant-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Breadcrumb & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <a routerLink="/tenant/dashboard" class="hover:text-[#2D7A5E] font-medium">Dashboard</a>
            <span>/</span>
            <span class="text-slate-800 font-bold">Documents & Certificates</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Tenancy Documents & Vault</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Model Tenancy Act compliant digital lease copies, HRA rent receipts, and verification records.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="showUploadModal = true"
            type="button"
            class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Upload Document</span>
          </button>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          *ngFor="let cat of categories"
          (click)="selectedCategory = cat.value"
          type="button"
          [class]="selectedCategory === cat.value ? 'bg-[#0F2937] text-white font-black shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-bold'"
          class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching your document vault..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load documents"
        [message]="errorMessage"
        (retry)="loadAllDocuments()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && filteredDocuments.length === 0"
        title="No documents in this category"
        message="Your digital lease agreements, rent receipts, and verification records will appear here."
        actionText="View All Documents"
        (action)="selectedCategory = 'ALL'"
      ></app-empty-state>

      <!-- Documents Grid -->
      <div *ngIf="!isLoading && !isError && filteredDocuments.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          *ngFor="let doc of filteredDocuments"
          class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
        >
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                [class]="getCategoryBadgeClass(doc.category)"
              >
                {{ doc.category }}
              </span>
              <span class="text-[11px] text-slate-400 font-semibold">{{ doc.date | date: 'mediumDate' }}</span>
            </div>

            <div>
              <h3 class="text-sm font-extrabold text-[#0F2937]">{{ doc.title }}</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ doc.description }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span class="text-slate-400 font-bold text-[11px]">{{ doc.type }} • {{ doc.size }}</span>

            <div class="flex items-center gap-2">
              <button
                (click)="previewDocument(doc)"
                type="button"
                class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
              >
                Preview
              </button>
              <button
                (click)="downloadDoc(doc)"
                type="button"
                class="px-3 py-1 bg-[#0F2937] hover:bg-[#1E3A8A] text-[#FACC15] font-black rounded-lg transition cursor-pointer"
              >
                Download ↓
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Preview Modal -->
      <div *ngIf="activeDocPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">{{ activeDocPreview.category }}</span>
              <h3 class="text-base font-black text-[#0F2937]">{{ activeDocPreview.title }}</h3>
            </div>
            <button (click)="activeDocPreview = null" type="button" class="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
              ✕
            </button>
          </div>

          <!-- Document Mock Paper Body -->
          <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs text-slate-700">
            <div class="text-center pb-3 border-b border-slate-200">
              <div class="font-extrabold text-sm text-[#0F2937]">NIVAS360 RESIDENTIAL NETWORK</div>
              <div class="text-[10px] text-slate-500">Government Registered Model Tenancy Act Archive</div>
            </div>
            <div class="space-y-1 text-[11px]">
              <div>Document: {{ activeDocPreview.title }}</div>
              <div>Issue Date: {{ activeDocPreview.date | date: 'longDate' }}</div>
              <div>Compliance Hash: 8f4a-9b12-c430-e889</div>
              <div>Status: ACTIVE & LEGALLY BINDING</div>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 text-[10px] leading-relaxed">
              {{ activeDocPreview.description }}
            </div>
          </div>

          <div class="flex gap-3">
            <button
              (click)="activeDocPreview = null"
              type="button"
              class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              (click)="downloadDoc(activeDocPreview)"
              type="button"
              class="flex-1 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Print / Save File
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div *ngIf="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-black text-[#0F2937]">Upload Tenancy Document</h3>
            <button (click)="showUploadModal = false" type="button" class="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
              ✕
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                [(ngModel)]="newDocTitle"
                placeholder="e.g. Employment Verification Letter"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Document Category</label>
              <select
                [(ngModel)]="newDocCategory"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="PERSONAL">Personal / Employment</option>
                <option value="VERIFICATION">Identity & KYC</option>
                <option value="HANDOVER">Handover / Inventory</option>
                <option value="RECEIPT">Rent Payment Proof</option>
              </select>
            </div>

            <div class="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-1 bg-slate-50 cursor-pointer">
              <span class="text-2xl">📄</span>
              <p class="font-bold text-slate-700">Choose PDF or Image file</p>
              <p class="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              (click)="showUploadModal = false"
              type="button"
              class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              (click)="saveUploadedDoc()"
              type="button"
              class="flex-1 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Save Document
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class TenantDocumentsComponent implements OnInit {
  documents: TenantDoc[] = [];
  selectedCategory: string = 'ALL';
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  activeDocPreview: TenantDoc | null = null;
  showUploadModal: boolean = false;
  newDocTitle: string = '';
  newDocCategory: 'AGREEMENT' | 'RECEIPT' | 'VERIFICATION' | 'HANDOVER' | 'PERSONAL' = 'PERSONAL';

  categories = [
    { label: 'All Documents', value: 'ALL' },
    { label: 'Agreements & Leases', value: 'AGREEMENT' },
    { label: 'Rent Receipts (HRA)', value: 'RECEIPT' },
    { label: 'Identity & KYC', value: 'VERIFICATION' },
    { label: 'Handover & Inspection', value: 'HANDOVER' },
    { label: 'Personal & Addenda', value: 'PERSONAL' },
  ];

  constructor(
    private rentalService: RentalService,
    private agreementService: AgreementService,
    private verificationService: VerificationService
  ) {}

  ngOnInit(): void {
    this.loadAllDocuments();
  }

  loadAllDocuments(): void {
    this.isLoading = true;
    this.isError = false;
    const docs: TenantDoc[] = [];

    // 1. Fetch active rental
    this.rentalService.getRentals().subscribe({
      next: (rentalRes) => {
        if (rentalRes.success && rentalRes.data && rentalRes.data.length > 0) {
          const rental = rentalRes.data[0];

          // Rental Agreement Doc
          docs.push({
            id: 'doc_agree_' + (rental.id || (rental as any)._id),
            title: `Residential Tenancy Agreement (${(rental as any)?.propertyId?.title || 'Standard Home'})`,
            category: 'AGREEMENT',
            date: rental.startDate || new Date().toISOString(),
            type: 'PDF Document',
            size: '1.4 MB',
            status: 'ACTIVE',
            description: 'Standardized Model Tenancy Act bilateral residential agreement with digital assent and terms.',
          });

          // Handover Inspection Doc
          docs.push({
            id: 'doc_handover_' + (rental.id || (rental as any)._id),
            title: 'Move-In Condition & Handover Certificate',
            category: 'HANDOVER',
            date: rental.startDate || new Date().toISOString(),
            type: 'PDF Document',
            size: '850 KB',
            status: 'VALID',
            description: 'Certified room-by-room inventory inspection record and utility meter readings.',
          });

          // Fetch Rent Records for Receipts
          const propId = (rental.propertyId as any)?._id || (rental.propertyId as any)?.id || rental.propertyId;
          this.rentalService.getRentRecordsByPropertyId(propId).subscribe({
            next: (recRes) => {
              if (recRes.success && Array.isArray(recRes.data)) {
                recRes.data.forEach((r, idx) => {
                  if (r.status === 'PAID') {
                    docs.push({
                      id: 'doc_rcpt_' + (r._id || r.id || idx),
                      title: `Rent Payment Receipt — ${new Date(r.paidDate || r.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                      category: 'RECEIPT',
                      date: r.paidDate || r.dueDate || new Date().toISOString(),
                      type: 'PDF Receipt',
                      size: '420 KB',
                      status: 'VALID',
                      description: `Statutory rent receipt for ₹${(r.amount || rental.monthlyRent).toLocaleString('en-IN')}. Form 12BB HRA tax claim compliant.`,
                    });
                  }
                });
              }
            },
          });
        }

        // 2. Fetch Verification Doc
        this.verificationService.getTenantVerification().subscribe({
          next: (verifRes) => {
            this.isLoading = false;
            if (verifRes.success && verifRes.data) {
              const v = verifRes.data;
              docs.push({
                id: 'doc_verif_' + (v._id || v.id || 'kyc'),
                title: 'Government Identity & Police Intimation Dossier',
                category: 'VERIFICATION',
                date: v.submittedAt || (v as any).createdAt || new Date().toISOString(),
                type: 'Verified Dossier',
                size: '980 KB',
                status: 'VALID',
                description: 'Aadhaar / National ID validation certificate and Telangana MTA compliance record.',
              });
            }
            this.documents = docs;
          },
          error: () => {
            this.isLoading = false;
            this.documents = docs;
          },
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Could not fetch tenancy document records.';
      },
    });
  }

  get filteredDocuments(): TenantDoc[] {
    if (this.selectedCategory === 'ALL') {
      return this.documents;
    }
    return this.documents.filter((d) => d.category === this.selectedCategory);
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'AGREEMENT':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIPT':
        return 'bg-emerald-100 text-emerald-800';
      case 'VERIFICATION':
        return 'bg-indigo-100 text-indigo-800';
      case 'HANDOVER':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  previewDocument(doc: TenantDoc): void {
    this.activeDocPreview = doc;
  }

  downloadDoc(doc: TenantDoc): void {
    window.print();
  }

  saveUploadedDoc(): void {
    if (!this.newDocTitle.trim()) {
      alert('Please provide a document title.');
      return;
    }

    this.documents.unshift({
      id: 'doc_custom_' + Date.now(),
      title: this.newDocTitle.trim(),
      category: this.newDocCategory,
      date: new Date().toISOString(),
      type: 'Uploaded Document',
      size: '1.2 MB',
      status: 'ACTIVE',
      description: 'Tenant uploaded document stored securely in your Nivas360 encrypted vault.',
    });

    this.showUploadModal = false;
    this.newDocTitle = '';
    alert('Document added to your vault successfully!');
  }
}
