import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

export interface RoomInspection {
  id: string;
  name: string;
  icon: string;
  rating: number; // 1 to 5
  notes: string;
  photos: string[];
  issues: string[];
}

@Component({
  selector: 'app-tenant-property-condition',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SafeHtmlPipe,
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
            <span class="text-slate-800 font-bold">Property Condition Report</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-[#0F2937] tracking-tight">Property Condition Assessment</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Photographic room condition log to safeguard your deposit under Model Tenancy Act guidelines.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="printReport()"
            type="button"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg> Export Report</span>
          </button>
          <a
            routerLink="/tenant/services/request"
            class="px-4 py-2 bg-[#E26D46] hover:bg-[#d05c35] text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Book Service Repair</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching property condition records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load condition records"
        [message]="errorMessage"
        (retry)="loadData()"
      ></app-error-state>

      <!-- Empty State: No Active Rental -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !rental"
        title="No active rental agreement found"
        message="Property condition inspections are available once you have an active tenancy."
        actionText="Browse Available Homes"
        (action)="router.navigate(['/tenant/homes'])"
      ></app-empty-state>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !isError && rental" class="space-y-6">

        <!-- Property Summary & Deposit Protection Banner -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
              <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Security Deposit Protection Active</span>
            </div>
            <h2 class="text-xl font-semibold text-[#0F2937]">{{ propertyTitle }}</h2>
            <p class="text-xs text-slate-500"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {{ propertyLocation }}</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span class="text-[10px] font-semibold uppercase text-slate-400 block">Overall Condition</span>
              <span class="text-base font-semibold text-emerald-700 block">
                {{ overallConditionRating > 0 ? (overallConditionRating.toFixed(1) + ' / 5.0 ') : 'No rating yet' }}
              </span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span class="text-[10px] font-semibold uppercase text-slate-400 block">Rooms Logged</span>
              <span class="text-base font-semibold text-[#0F2937] block">{{ rooms.length }} Areas</span>
            </div>
          </div>
        </div>

        <!-- Room Selector Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            *ngFor="let room of rooms; let i = index"
            (click)="selectedRoomIndex = i"
            type="button"
            [class]="selectedRoomIndex === i ? 'bg-navy text-n-0 font-semibold shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold'"
            class="px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <span *ngIf="room.icon" [innerHTML]="room.icon | safeHtml" class="w-3.5 h-3.5 inline-flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5"></span>
            <span>{{ room.name }}</span>
          </button>
        </div>

        <!-- Active Room Detail Card -->
        <div *ngIf="activeRoom" class="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div class="flex items-center gap-3">
              <span class="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 [&>svg]:w-6 [&>svg]:h-6" [innerHTML]="activeRoom.icon | safeHtml"></span>
              <div>
                <span class="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Area Assessment</span>
                <h3 class="text-xl font-semibold text-[#0F2937]">{{ activeRoom.name }}</h3>
              </div>
            </div>

            <!-- Rating Stars -->
            <div class="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <span class="text-xs font-bold text-slate-600 mr-1">Condition Rating:</span>
              <button
                *ngFor="let star of [1, 2, 3, 4, 5]"
                (click)="activeRoom.rating = star"
                type="button"
                class="text-base transition cursor-pointer"
                [class.text-amber-400]="star <= activeRoom.rating"
                [class.text-slate-300]="star > activeRoom.rating"
              >
                
              </button>
            </div>
          </div>

          <!-- Room Notes Input -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Inspection Notes & Existing Scratches / Marks
            </label>
            <textarea
              rows="3"
              [(ngModel)]="activeRoom.notes"
              placeholder="e.g. Wall paint is intact, tiny scuff mark behind entrance door, window latches operating smoothly..."
              class="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
            ></textarea>
          </div>

          <!-- Photo Inspection Gallery -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Photo Evidence Gallery (Move-In Records)
              </label>
              <button
                (click)="addPhotoToRoom()"
                type="button"
                class="text-xs font-bold text-[#2D7A5E] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>+ Add Inspection Photo</span>
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                *ngFor="let photo of activeRoom.photos; let pIdx = index"
                class="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
              >
                <img [src]="photo" alt="Inspection evidence" class="w-full h-full object-cover" />
                <button
                  (click)="removePhoto(pIdx)"
                  type="button"
                  class="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 text-white rounded-full text-[10px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  
                </button>
              </div>

              <!-- Upload Placeholder Button -->
              <button
                (click)="addPhotoToRoom()"
                type="button"
                class="border-2 border-dashed border-slate-300 hover:border-[#2D7A5E] rounded-2xl p-4 flex flex-col items-center justify-center text-center text-slate-400 hover:text-[#2D7A5E] transition cursor-pointer aspect-video bg-slate-50/50"
              >
                <span class="text-xl"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg></span>
                <span class="text-[10px] font-bold mt-1">Upload Photo</span>
              </button>
            </div>
          </div>

          <!-- Existing Issues & Service Escalation -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 class="font-semibold text-xs text-[#0F2937]">Noticed an issue that needs repair?</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Escalate directly to our professional network for plumbing, electrical, or appliance maintenance.
              </p>
            </div>

            <a
              routerLink="/tenant/services/request"
              class="px-4 py-2 bg-[#E26D46] hover:bg-[#d05c35] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              Book Service Repair →
            </a>
          </div>

          <!-- Toast Message Banner -->
          <div *ngIf="toastMessage" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span></span>
              <span>{{ toastMessage }}</span>
            </div>
            <button (click)="toastMessage = null" type="button" class="text-emerald-600 hover:text-emerald-900 font-bold"></button>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-2">
            <button
              (click)="saveInspection()"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
               Save Room Condition Assessment
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class TenantPropertyConditionComponent implements OnInit {
  rental: RentalAgreement | null = null;
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  toastMessage: string | null = null;

  selectedRoomIndex: number = 0;

  rooms: RoomInspection[] = [
    {
      id: 'living',
      name: 'Living & Dining Room',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
      rating: 5,
      notes: 'Walls in good condition. TV console and switch sockets functional.',
      photos: [
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500',
      ],
      issues: [],
    },
    {
      id: 'master_bed',
      name: 'Master Bedroom',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v11m0-4h18m0-7v11M3 10h18M7 7h3v3H7z"/></svg>',
      rating: 5,
      notes: 'Wardrobes sliding smoothly. AC cooling properly.',
      photos: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500',
      ],
      issues: [],
    },
    {
      id: 'kitchen',
      name: 'Modular Kitchen',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>',
      rating: 4,
      notes: 'Chimney working. Minor water mark beneath sink cabinet.',
      photos: [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500',
      ],
      issues: [],
    },
    {
      id: 'bath',
      name: 'Bathrooms & Geysers',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
      rating: 4,
      notes: 'All taps checked. Geyser heats within 10 minutes.',
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500',
      ],
      issues: [],
    },
    {
      id: 'balcony',
      name: 'Balcony & Utility Area',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
      rating: 5,
      notes: 'Washing machine inlet functional. Good drainage.',
      photos: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500',
      ],
      issues: [],
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
          // Restore condition data if saved locally
          const saved = localStorage.getItem(`condition_${this.rental.id || (this.rental as any)._id}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.rooms) this.rooms = parsed.rooms;
            } catch (e) {}
          }
        } else {
          this.rental = null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Could not fetch condition records.';
      },
    });
  }

  get activeRoom(): RoomInspection | undefined {
    return this.rooms[this.selectedRoomIndex];
  }

  get propertyTitle(): string {
    return (this.rental as any)?.propertyId?.title || 'Residential Rental Home';
  }

  get propertyLocation(): string {
    const loc = (this.rental as any)?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address || ''}, ${loc.city || ''}` : 'Telangana / Andhra Pradesh';
  }

  get overallConditionRating(): number {
    if (!this.rooms || this.rooms.length === 0) return 0;
    const sum = this.rooms.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((sum / this.rooms.length) * 10) / 10;
  }

  addPhotoToRoom(): void {
    if (!this.activeRoom) return;
    const samplePhotos = [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500',
    ];
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    this.activeRoom.photos.push(randomPhoto);
    this.toastMessage = 'Inspection photo added to ' + this.activeRoom.name;
  }

  removePhoto(index: number): void {
    if (!this.activeRoom) return;
    this.activeRoom.photos.splice(index, 1);
  }

  saveInspection(): void {
    if (!this.rental) return;
    const payload = {
      rooms: this.rooms,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`condition_${this.rental.id || (this.rental as any)._id}`, JSON.stringify(payload));
    this.toastMessage = 'Property condition assessment saved successfully! Logged in your tenancy records.';
  }

  printReport(): void {
    window.print();
  }
}
