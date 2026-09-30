import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

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
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Property Condition Assessment</h1>
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
            <span>🖨️ Export Report</span>
          </button>
          <a
            routerLink="/tenant/services/request"
            class="px-4 py-2 bg-[#E26D46] hover:bg-[#d05c35] text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🛠️ Book Service Repair</span>
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
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
              <span>🛡️ Security Deposit Protection Active</span>
            </div>
            <h2 class="text-xl font-black text-[#0F2937]">{{ propertyTitle }}</h2>
            <p class="text-xs text-slate-500">📍 {{ propertyLocation }}</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 block">Overall Condition</span>
              <span class="text-base font-black text-emerald-700 block">4.8 / 5.0 ★</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 block">Rooms Logged</span>
              <span class="text-base font-black text-[#0F2937] block">{{ rooms.length }} Areas</span>
            </div>
          </div>
        </div>

        <!-- Room Selector Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            *ngFor="let room of rooms; let i = index"
            (click)="selectedRoomIndex = i"
            type="button"
            [class]="selectedRoomIndex === i ? 'bg-[#0F2937] text-[#FACC15] font-black shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold'"
            class="px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{{ room.icon }}</span>
            <span>{{ room.name }}</span>
          </button>
        </div>

        <!-- Active Room Detail Card -->
        <div *ngIf="activeRoom" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div class="flex items-center gap-3">
              <span class="text-3xl p-3 bg-slate-50 rounded-2xl border border-slate-200">{{ activeRoom.icon }}</span>
              <div>
                <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Area Assessment</span>
                <h3 class="text-xl font-black text-[#0F2937]">{{ activeRoom.name }}</h3>
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
                ★
              </button>
            </div>
          </div>

          <!-- Room Notes Input -->
          <div class="space-y-2">
            <label class="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
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
              <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
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
                  class="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <!-- Upload Placeholder Button -->
              <button
                (click)="addPhotoToRoom()"
                type="button"
                class="border-2 border-dashed border-slate-300 hover:border-[#2D7A5E] rounded-2xl p-4 flex flex-col items-center justify-center text-center text-slate-400 hover:text-[#2D7A5E] transition cursor-pointer aspect-video bg-slate-50/50"
              >
                <span class="text-xl">📷</span>
                <span class="text-[10px] font-bold mt-1">Upload Photo</span>
              </button>
            </div>
          </div>

          <!-- Existing Issues & Service Escalation -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 class="font-extrabold text-xs text-[#0F2937]">Noticed an issue that needs repair?</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Escalate directly to our professional network for plumbing, electrical, or appliance maintenance.
              </p>
            </div>

            <a
              routerLink="/tenant/services/request"
              class="px-4 py-2 bg-[#E26D46] hover:bg-[#d05c35] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              Book Service Repair →
            </a>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-2">
            <button
              (click)="saveInspection()"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              ✓ Save Room Condition Assessment
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

  selectedRoomIndex: number = 0;

  rooms: RoomInspection[] = [
    {
      id: 'living',
      name: 'Living & Dining Room',
      icon: '🛋️',
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
      icon: '🛏️',
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
      icon: '🍳',
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
      icon: '🚿',
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
      icon: '🪴',
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

  addPhotoToRoom(): void {
    if (!this.activeRoom) return;
    const samplePhotos = [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500',
    ];
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    this.activeRoom.photos.push(randomPhoto);
    alert('Inspection photo added to ' + this.activeRoom.name);
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
    alert('Property condition assessment saved successfully! Logged in your tenancy records.');
  }

  printReport(): void {
    window.print();
  }
}
