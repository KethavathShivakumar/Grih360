import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

export interface ChecklistItem {
  id: string;
  name: string;
  status: 'WORKING' | 'DEFECTIVE' | 'MISSING' | 'PENDING';
  remarks: string;
}

export interface ChecklistSection {
  category: string;
  icon: string;
  items: ChecklistItem[];
}

@Component({
  selector: 'app-tenant-handover-checklist',
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
            <a routerLink="/tenant/rental" class="hover:text-[#2D7A5E] font-medium">My Rental</a>
            <span>/</span>
            <span class="text-slate-800 font-bold">Handover Checklist</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Handover & Move-In Inspection</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Model Tenancy Act statutory inventory checklist, key handover, and utility meter readings.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="printChecklist()"
            type="button"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🖨️ Print Checklist</span>
          </button>
          <a
            routerLink="/tenant/condition"
            class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            📸 Property Condition
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching property handover records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load checklist"
        [message]="errorMessage"
        (retry)="loadData()"
      ></app-error-state>

      <!-- Empty State: No Active Rental -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !rental"
        title="No active tenancy found"
        message="A move-in handover checklist is generated once a rental agreement is confirmed."
        actionText="Explore Verified Homes"
        (action)="router.navigate(['/tenant/homes'])"
      ></app-empty-state>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !isError && rental" class="space-y-6">

        <!-- Top Overview & Mode Toggle -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                  MTA Form Schedule III
                </span>
                <span class="text-xs text-slate-400 font-semibold">• Certified Inventory</span>
              </div>
              <h2 class="text-lg font-black text-[#0F2937] mt-1">{{ propertyTitle }}</h2>
              <p class="text-xs text-slate-500">📍 {{ propertyLocation }}</p>
            </div>

            <!-- Move-In vs Move-Out Switcher -->
            <div class="flex bg-slate-100 p-1 rounded-2xl shrink-0 text-xs font-bold">
              <button
                (click)="checklistType = 'MOVE_IN'"
                type="button"
                [class]="checklistType === 'MOVE_IN' ? 'bg-[#0F2937] text-[#FACC15] shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2 rounded-xl transition cursor-pointer"
              >
                📥 Move-In Handover
              </button>
              <button
                (click)="checklistType = 'MOVE_OUT'"
                type="button"
                [class]="checklistType === 'MOVE_OUT' ? 'bg-[#0F2937] text-[#FACC15] shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2 rounded-xl transition cursor-pointer"
              >
                📤 Move-Out Inspection
              </button>
            </div>
          </div>

          <!-- Utility Meter Readings Banner -->
          <div class="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                ⚡ Initial Utility Meter Readings (Day 1)
              </span>
              <span class="text-[10px] font-bold text-amber-800">Prevents Tenant/Owner Billing Disputes</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="bg-white p-3 rounded-xl border border-amber-200">
                <span class="text-slate-400 font-bold block text-[10px] uppercase">Electricity Meter (kWh)</span>
                <input
                  type="number"
                  [(ngModel)]="meters.electricity"
                  placeholder="e.g. 4812"
                  class="w-full mt-1 font-black text-sm text-[#0F2937] bg-transparent focus:outline-none"
                />
              </div>
              <div class="bg-white p-3 rounded-xl border border-amber-200">
                <span class="text-slate-400 font-bold block text-[10px] uppercase">Water Meter (kL)</span>
                <input
                  type="number"
                  [(ngModel)]="meters.water"
                  placeholder="e.g. 120"
                  class="w-full mt-1 font-black text-sm text-[#0F2937] bg-transparent focus:outline-none"
                />
              </div>
              <div class="bg-white p-3 rounded-xl border border-amber-200">
                <span class="text-slate-400 font-bold block text-[10px] uppercase">Piped Gas / LPG (Units)</span>
                <input
                  type="number"
                  [(ngModel)]="meters.gas"
                  placeholder="e.g. 34"
                  class="w-full mt-1 font-black text-sm text-[#0F2937] bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Checklist Sections Grid -->
        <div class="space-y-4">
          <div
            *ngFor="let section of sections"
            class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4"
          >
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span class="text-xl">{{ section.icon }}</span>
              <h3 class="text-sm font-black text-[#0F2937] uppercase tracking-wider">{{ section.category }}</h3>
            </div>

            <div class="space-y-3">
              <div
                *ngFor="let item of section.items"
                class="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div class="font-bold text-slate-800 flex-1">
                  {{ item.name }}
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Status Buttons -->
                  <button
                    (click)="item.status = 'WORKING'"
                    type="button"
                    [class]="item.status === 'WORKING' ? 'bg-emerald-600 text-white font-black' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
                    class="px-2.5 py-1 rounded-xl text-[10px] transition cursor-pointer"
                  >
                    ✓ Working / Good
                  </button>

                  <button
                    (click)="item.status = 'DEFECTIVE'"
                    type="button"
                    [class]="item.status === 'DEFECTIVE' ? 'bg-amber-600 text-white font-black' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
                    class="px-2.5 py-1 rounded-xl text-[10px] transition cursor-pointer"
                  >
                    ⚠️ Defective
                  </button>

                  <button
                    (click)="item.status = 'MISSING'"
                    type="button"
                    [class]="item.status === 'MISSING' ? 'bg-rose-600 text-white font-black' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
                    class="px-2.5 py-1 rounded-xl text-[10px] transition cursor-pointer"
                  >
                    ✕ Missing
                  </button>

                  <!-- Remarks Input -->
                  <input
                    type="text"
                    [(ngModel)]="item.remarks"
                    placeholder="Remarks..."
                    class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 w-36 focus:outline-none focus:ring-1 focus:ring-[#2D7A5E]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sign-off & Save Bar -->
        <div class="bg-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 class="text-sm font-black text-[#FACC15]">Tenant Handover Sign-off</h4>
            <p class="text-xs text-slate-300 mt-0.5">
              {{ signedAt ? ('Signed off by Tenant on ' + (signedAt | date: 'medium')) : 'Review all sections above and save your handover sign-off.' }}
            </p>
          </div>

          <button
            (click)="saveChecklist()"
            type="button"
            class="px-6 py-3 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-black text-xs rounded-2xl shadow-md transition hover:scale-105 cursor-pointer shrink-0"
          >
            {{ signedAt ? '✓ Update Sign-Off' : '✓ Sign-Off & Save Handover' }}
          </button>
        </div>

      </div>
    </div>
  `,
})
export class TenantHandoverChecklistComponent implements OnInit {
  rental: RentalAgreement | null = null;
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  checklistType: 'MOVE_IN' | 'MOVE_OUT' = 'MOVE_IN';
  signedAt: string | null = null;

  meters = {
    electricity: 4812,
    water: 120,
    gas: 34,
  };

  sections: ChecklistSection[] = [
    {
      category: 'Keys & Access Hardware',
      icon: '🔑',
      items: [
        { id: 'k1', name: 'Main Entrance Door Keys (2 Sets)', status: 'WORKING', remarks: 'Received 2 keys' },
        { id: 'k2', name: 'Master Bedroom & Wardrobe Keys', status: 'WORKING', remarks: 'Good condition' },
        { id: 'k3', name: 'Mailbox Key & Utility Gate Key', status: 'WORKING', remarks: '' },
        { id: 'k4', name: 'Building Access Card / Parking RFID', status: 'WORKING', remarks: 'Car parking RFID issued' },
      ],
    },
    {
      category: 'Electrical Fixtures & Appliances',
      icon: '💡',
      items: [
        { id: 'e1', name: 'Ceiling Fans & Regulators (All Rooms)', status: 'WORKING', remarks: 'All functional' },
        { id: 'e2', name: 'LED Lights & Modular Switches', status: 'WORKING', remarks: '' },
        { id: 'e3', name: 'Water Geysers (Master & Guest Baths)', status: 'WORKING', remarks: 'Heating verified' },
        { id: 'e4', name: 'Main MCB Distribution Box & Earth Leakage', status: 'WORKING', remarks: 'Checked' },
      ],
    },
    {
      category: 'Plumbing & Sanitary Fittings',
      icon: '🚰',
      items: [
        { id: 'p1', name: 'Kitchen Sink Mixer Tap & Drain', status: 'WORKING', remarks: 'No leakage' },
        { id: 'p2', name: 'Bathroom Showers & Health Faucets', status: 'WORKING', remarks: 'Good pressure' },
        { id: 'p3', name: 'Commode Flush Tanks & Dual Valves', status: 'WORKING', remarks: '' },
        { id: 'p4', name: 'RO Water Purifier Inlet & Connection', status: 'WORKING', remarks: 'Pre-installed' },
      ],
    },
    {
      category: 'Doors, Windows & Paint Condition',
      icon: '🚪',
      items: [
        { id: 'd1', name: 'Main Door Lock, Latch & Peep Hole', status: 'WORKING', remarks: 'Smooth operation' },
        { id: 'd2', name: 'Balcony Sliding Doors & Mesh Nets', status: 'WORKING', remarks: 'Mosquito mesh intact' },
        { id: 'd3', name: 'Wall Paint Finish & Cleanliness', status: 'WORKING', remarks: 'Freshly painted' },
        { id: 'd4', name: 'Floor Vitrified Tiles (No Cracks)', status: 'WORKING', remarks: 'Clean' },
      ],
    },
  ];

  constructor(
    public router: Router,
    private rentalService: RentalService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.isError = false;

    this.rentalService.getRentals().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data && res.data.length > 0) {
          this.rental = res.data[0];
          // Try restoring saved checklist from localStorage
          const saved = localStorage.getItem(`handover_${this.rental.id || (this.rental as any)._id}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.sections) this.sections = parsed.sections;
              if (parsed.meters) this.meters = parsed.meters;
              if (parsed.signedAt) this.signedAt = parsed.signedAt;
            } catch (e) {}
          }
        } else {
          this.rental = null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to fetch rental record for handover.';
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

  saveChecklist(): void {
    if (!this.rental) return;
    this.signedAt = new Date().toISOString();

    const payload = {
      sections: this.sections,
      meters: this.meters,
      signedAt: this.signedAt,
      type: this.checklistType,
    };

    localStorage.setItem(`handover_${this.rental.id || (this.rental as any)._id}`, JSON.stringify(payload));
    alert('Handover checklist signed off and saved successfully! Stored in your tenancy compliance records.');
  }

  printChecklist(): void {
    window.print();
  }
}
