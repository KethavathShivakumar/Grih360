import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { MoneyService } from '../../../core/services/money.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-tenant-rent-tracking',
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
      <!-- Top Breadcrumbs & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <a routerLink="/tenant/dashboard" class="hover:text-[#2D7A5E] font-medium">Dashboard</a>
            <span>/</span>
            <a routerLink="/tenant/rental" class="hover:text-[#2D7A5E] font-medium">My Rental</a>
            <span>/</span>
            <span class="text-slate-800 font-bold">Rent Tracking & Receipts</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Rent Tracking & Payment Ledger</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Model Tenancy Act compliant automated rent receipts, UPI payments, and monthly billing history.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="loadData()"
            type="button"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄 Refresh</span>
          </button>
          <a
            routerLink="/tenant/documents"
            class="px-4 py-2 bg-[#0F2937] hover:bg-[#1E3A8A] text-[#FACC15] font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            📄 All Documents
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching rent ledger and billing records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load rent tracking"
        [message]="errorMessage"
        (retry)="loadData()"
      ></app-error-state>

      <!-- Empty State: No Active Rental -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !rental"
        title="No active rental agreement found"
        message="You currently do not have an active residential tenancy. Browse verified homes to apply."
        actionText="Browse Available Homes"
        (action)="router.navigate(['/tenant/homes'])"
      ></app-empty-state>

      <!-- Content Container -->
      <div *ngIf="!isLoading && !isError && rental" class="space-y-6">

        <!-- Active Lease Property Header Card -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                Active Tenancy
              </span>
              <span class="text-xs text-slate-400 font-semibold">• Tenancy Agreement {{ rental.agreementVersion || 'v1.0' }}</span>
            </div>
            <h2 class="text-xl font-black text-[#0F2937]">{{ propertyTitle }}</h2>
            <p class="text-xs text-slate-500">📍 {{ propertyLocation }}</p>
          </div>

          <div class="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 text-xs">
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Monthly Rent</span>
              <span class="text-base font-black text-[#0F2937] block mt-0.5">{{ formatINR(monthlyRent) }}/mo</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Deposit Held</span>
              <span class="text-base font-black text-slate-700 block mt-0.5">{{ formatINR(depositAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Current Cycle Payment Due Bento Card -->
        <div class="bg-gradient-to-br from-[#0F2937] via-[#164E63] to-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
          <div class="absolute -right-8 -top-8 w-60 h-60 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div class="space-y-2 max-w-lg">
              <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
                <span>📅 Current Billing Cycle</span>
              </div>
              <h3 class="text-2xl font-black tracking-tight text-white">
                {{ isPaid ? 'Rent for this Month is Paid! 🎉' : 'Upcoming Rent Payment Due' }}
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed">
                {{ isPaid ? 'Your monthly rent payment has been confirmed and verified. Automated receipt generated.' : 'Pay your rent directly through verified UPI or net banking to generate statutory rent receipts for HRA tax exemption.' }}
              </p>
            </div>

            <div class="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center shrink-0 space-y-2 min-w-56">
              <span class="text-[10px] font-black uppercase text-slate-300 block">Amount Payable</span>
              <span class="text-2xl font-black text-[#FACC15] block">{{ formatINR(monthlyRent) }}</span>
              <span class="text-[11px] font-bold block" [class]="isPaid ? 'text-emerald-400' : 'text-amber-300'">
                Status: {{ currentRentStatus }}
              </span>

              <button
                *ngIf="!isPaid"
                (click)="openPayModal()"
                type="button"
                class="w-full mt-2 px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-black text-xs rounded-xl shadow-md transition hover:scale-105 cursor-pointer"
              >
                ⚡ Pay Rent Now
              </button>

              <button
                *ngIf="isPaid"
                (click)="openReceipt(latestPaidRecord)"
                type="button"
                class="w-full mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                📄 View Paid Receipt
              </button>
            </div>
          </div>
        </div>

        <!-- Rent Records Ledger Table -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-extrabold text-[#0F2937]">Rent Payment Ledger</h3>
              <p class="text-xs text-slate-500">Historical rent records with certified receipts</p>
            </div>
            <span class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
              {{ rentRecords.length }} Record{{ rentRecords.length === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th class="py-3 px-4">Billing Date</th>
                  <th class="py-3 px-4">Amount</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Transaction Details</th>
                  <th class="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let rec of rentRecords" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-slate-800">
                    {{ (rec.dueDate || rec.createdAt || rec.paidDate) | date: 'mediumDate' }}
                  </td>
                  <td class="py-3.5 px-4 font-black text-[#0F2937]">
                    {{ formatINR(rec.amount || monthlyRent) }}
                  </td>
                  <td class="py-3.5 px-4">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                      [class]="rec.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                    >
                      {{ rec.status }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                    {{ rec.notes || (rec.status === 'PAID' ? 'Verified Online Bank Transfer' : 'Scheduled monthly cycle') }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      *ngIf="rec.status === 'PAID'"
                      (click)="openReceipt(rec)"
                      type="button"
                      class="text-xs font-bold text-[#2D7A5E] hover:underline cursor-pointer"
                    >
                      Receipt ↗
                    </button>
                    <span *ngIf="rec.status !== 'PAID'" class="text-slate-400 font-medium">Pending</span>
                  </td>
                </tr>

                <tr *ngIf="rentRecords.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-400 font-semibold">
                    No payment records logged yet. Your first cycle will appear here.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Payment Simulation Modal -->
      <div *ngIf="showPayModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fast & Secure</span>
              <h3 class="text-lg font-black text-[#0F2937]">Pay Monthly Rent</h3>
            </div>
            <button (click)="closePayModal()" type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <!-- Amount Breakdown -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div class="flex justify-between font-semibold text-slate-600">
              <span>Base Rent</span>
              <span>{{ formatINR(monthlyRent) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-slate-600">
              <span>Maintenance Charges</span>
              <span>₹0 (Included)</span>
            </div>
            <div class="flex justify-between font-semibold text-emerald-700">
              <span>Platform Fee (Zero Brokerage)</span>
              <span>FREE</span>
            </div>
            <div class="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-[#0F2937]">
              <span>Total Payable</span>
              <span>{{ formatINR(monthlyRent) }}</span>
            </div>
          </div>

          <!-- Payment Mode Selection -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Payment Mode</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                *ngFor="let m of ['UPI', 'NETBANKING', 'CARD']"
                (click)="selectedPaymentMode = m"
                type="button"
                [class]="selectedPaymentMode === m ? 'bg-[#0F2937] text-[#FACC15] font-black' : 'bg-slate-100 text-slate-700 font-bold hover:bg-slate-200'"
                class="py-2 rounded-xl text-xs transition cursor-pointer"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <!-- Transaction Notes / Reference -->
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Reference Note / UTR (Optional)</label>
            <input
              type="text"
              [(ngModel)]="paymentNote"
              placeholder="e.g. UPI Ref #409281729102"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
            />
          </div>

          <div *ngIf="payError" class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
            ⚠️ {{ payError }}
          </div>

          <!-- Pay Submit Button -->
          <div class="flex gap-3 pt-2">
            <button
              (click)="closePayModal()"
              type="button"
              class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              (click)="confirmPayment()"
              [disabled]="isPaying"
              type="button"
              class="flex-1 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {{ isPaying ? 'Processing...' : 'Confirm & Pay ' + formatINR(monthlyRent) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Receipt Viewer Modal -->
      <div *ngIf="showReceiptModal && activeReceipt" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 my-auto">
          <div class="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Statutory Rent Receipt
              </span>
              <h3 class="text-xl font-black text-[#0F2937] mt-1">Receipt for Rent Paid</h3>
            </div>
            <button (click)="closeReceiptModal()" type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <div class="space-y-4 text-xs font-medium text-slate-700 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
            <div class="flex justify-between border-b border-slate-200/60 pb-2">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Receipt Number</span>
              <span class="font-mono font-bold text-slate-900">NIVAS-RCPT-{{ (activeReceipt._id || activeReceipt.id || '99102').slice(-6) }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200/60 pb-2">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Payment Date</span>
              <span class="font-bold text-slate-900">{{ (activeReceipt.paidDate || activeReceipt.dueDate || activeReceipt.createdAt) | date: 'longDate' }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200/60 pb-2">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Property</span>
              <span class="font-bold text-slate-900 text-right">{{ propertyTitle }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200/60 pb-2">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Landlord / Owner</span>
              <span class="font-bold text-slate-900">{{ ownerName }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200/60 pb-2">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Amount Paid</span>
              <span class="font-black text-base text-[#2D7A5E]">{{ formatINR(activeReceipt.amount || monthlyRent) }}</span>
            </div>
            <div class="flex justify-between pt-1">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Statutory Compliance</span>
              <span class="text-emerald-700 font-bold">✓ Model Tenancy Act Valid (HRA Tax Claim Eligible)</span>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              (click)="printReceipt()"
              type="button"
              class="w-full py-2.5 bg-[#0F2937] hover:bg-[#1E3A8A] text-[#FACC15] font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🖨️ Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class TenantRentTrackingComponent implements OnInit {
  rental: RentalAgreement | null = null;
  rentRecords: any[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  showPayModal: boolean = false;
  selectedPaymentMode: string = 'UPI';
  paymentNote: string = '';
  isPaying: boolean = false;
  payError: string | null = null;

  showReceiptModal: boolean = false;
  activeReceipt: any = null;

  constructor(
    public router: Router,
    private rentalService: RentalService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.isError = false;

    this.rentalService.getRentals().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.rental = res.data[0];
          this.loadRentRecords(this.rental.propertyId);
        } else {
          this.rental = null;
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to retrieve rental records.';
      },
    });
  }

  loadRentRecords(propertyId: string): void {
    const propIdStr = (propertyId as any)?._id || (propertyId as any)?.id || propertyId;
    this.rentalService.getRentRecordsByPropertyId(propIdStr).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.rentRecords = res.data;
        } else {
          this.rentRecords = [];
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  get propertyTitle(): string {
    return (this.rental as any)?.propertyId?.title || 'Residential Rental Home';
  }

  get propertyLocation(): string {
    const loc = (this.rental as any)?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address || ''}, ${loc.city || ''}` : 'Telangana / Andhra Pradesh';
  }

  get ownerName(): string {
    return (this.rental as any)?.ownerId?.name || 'Verified Property Owner';
  }

  get monthlyRent(): number {
    return this.rental?.monthlyRent || 0;
  }

  get depositAmount(): number {
    return this.rental?.depositPaid || 0;
  }

  get currentRentStatus(): string {
    return this.rental?.rentStatus || 'UPCOMING';
  }

  get isPaid(): boolean {
    return this.currentRentStatus === 'PAID';
  }

  get latestPaidRecord(): any {
    return this.rentRecords.find((r) => r.status === 'PAID') || {
      amount: this.monthlyRent,
      status: 'PAID',
      paidDate: new Date(),
    };
  }

  formatINR(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  openPayModal(): void {
    this.showPayModal = true;
  }

  closePayModal(): void {
    this.showPayModal = false;
  }

  confirmPayment(): void {
    if (!this.rental) return;
    this.isPaying = true;
    this.payError = null;

    const rentalId = this.rental.id || (this.rental as any)._id;
    this.rentalService
      .payRent(rentalId, {
        paymentMethod: this.selectedPaymentMode,
        transactionRef: this.paymentNote || `UPI-TXN-${Date.now()}`,
        amount: this.monthlyRent,
        notes: `Rent paid via ${this.selectedPaymentMode}`,
      })
      .subscribe({
        next: () => {
          this.isPaying = false;
          this.closePayModal();
          this.loadData();
        },
        error: (err) => {
          this.isPaying = false;
          this.payError = err?.error?.message || 'Payment simulation failed. Please try again.';
        },
      });
  }

  openReceipt(record: any): void {
    this.activeReceipt = record;
    this.showReceiptModal = true;
  }

  closeReceiptModal(): void {
    this.showReceiptModal = false;
    this.activeReceipt = null;
  }

  printReceipt(): void {
    window.print();
  }
}
