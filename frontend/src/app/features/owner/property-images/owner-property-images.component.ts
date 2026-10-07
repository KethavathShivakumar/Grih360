import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertyImage } from '../../../shared/models/property.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-owner-property-images',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Back Navigation Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          (click)="goBack()"
          type="button"
          class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Property Details
        </button>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500">Property Images Management</span>
          <button
            (click)="showAddModal = true"
            type="button"
            class="px-3.5 py-1.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Add New Photo</span>
          </button>
        </div>
      </div>

      <!-- Feedback Banners -->
      <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>✓ {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>
      <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching property photos..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load property images"
        [message]="errorMessage"
        (retry)="loadProperty()"
      ></app-error-state>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !isError && property" class="space-y-6">
        <!-- Property Summary Header Card -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="bg-[#0F2937] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                {{ property.propertyType }}
              </span>
              <span class="text-xs text-slate-400 font-semibold">ID: {{ property.id }}</span>
            </div>
            <h1 class="text-xl font-extrabold text-[#0F2937]">{{ property.title }}</h1>
            <p class="text-xs text-slate-500">
              📍 {{ property.propertyLocation.address }}, {{ property.propertyLocation.locality || property.propertyLocation.city }}
            </p>
          </div>

          <div class="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Total Photos</span>
              <span class="text-xl font-black text-[#0F2937]">{{ images.length }}</span>
            </div>
            <div class="border-l border-slate-200 pl-4">
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Main Cover</span>
              <span class="text-xs font-bold text-emerald-700">{{ hasMainImage ? 'Configured' : 'First Photo' }}</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <app-empty-state
          *ngIf="images.length === 0"
          title="No photos uploaded for this property yet"
          message="Properties with high-resolution photos receive 4x more tenant applications. Add your first photo now."
          actionText="Add Photo Now"
          (action)="showAddModal = true"
        ></app-empty-state>

        <!-- Images Gallery Grid -->
        <div *ngIf="images.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div
            *ngFor="let img of images; let i = index"
            class="bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            [ngClass]="img.isMain || (i === 0 && !hasExplicitMain) ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-slate-200'"
          >
            <!-- Image Thumbnail Area -->
            <div class="relative aspect-video bg-slate-100 overflow-hidden group">
              <img
                [src]="img.url"
                [alt]="img.caption || property.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                (error)="onImageError($event)"
              />

              <!-- Cover Badge -->
              <span
                *ngIf="img.isMain || (i === 0 && !hasExplicitMain)"
                class="absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#2D7A5E] text-white text-[10px] font-black rounded-lg shadow-sm tracking-wide uppercase flex items-center gap-1"
              >
                <span>⭐</span> Cover Photo
              </span>

              <!-- Photo Order Tag -->
              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md">
                #{{ i + 1 }}
              </span>
            </div>

            <!-- Image Info & Controls -->
            <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
              <div>
                <p class="text-xs font-bold text-slate-800 line-clamp-1">
                  {{ img.caption || 'Property photo ' + (i + 1) }}
                </p>
                <p class="text-[10px] text-slate-400 truncate mt-0.5" [title]="img.url">
                  {{ img.url }}
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                <!-- Set Main Button -->
                <button
                  *ngIf="!img.isMain && !(i === 0 && !hasExplicitMain)"
                  (click)="setAsMain(i)"
                  [disabled]="isMutating"
                  type="button"
                  class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                >
                  Set as Cover
                </button>
                <span *ngIf="img.isMain || (i === 0 && !hasExplicitMain)" class="text-[11px] font-bold text-emerald-700">
                  Current Cover
                </span>

                <!-- Reorder & Delete -->
                <div class="flex items-center gap-1">
                  <button
                    *ngIf="i > 0"
                    (click)="moveImage(i, -1)"
                    [disabled]="isMutating"
                    type="button"
                    class="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[10px] cursor-pointer"
                    title="Move Earlier"
                  >
                    ◀
                  </button>
                  <button
                    *ngIf="i < images.length - 1"
                    (click)="moveImage(i, 1)"
                    [disabled]="isMutating"
                    type="button"
                    class="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[10px] cursor-pointer"
                    title="Move Later"
                  >
                    ▶
                  </button>
                  <button
                    (click)="deleteImage(i)"
                    [disabled]="isMutating"
                    type="button"
                    class="p-1 text-rose-600 hover:bg-rose-50 rounded-md font-bold text-xs cursor-pointer ml-1"
                    title="Delete Photo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Image Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-extrabold text-[#0F2937]">Add Property Photo</h3>
            <button (click)="closeAddModal()" class="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
          </div>

          <!-- Camera & Gallery Direct Upload Controls -->
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-700 block">Take Photo or Pick from Device</span>
            <div class="flex flex-wrap items-center gap-2">
              <label class="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#2D7A5E] text-xs font-bold rounded-xl cursor-pointer flex items-center transition-colors">
                <span class="mr-1.5">📷</span>
                Take Photo (Camera)
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  (change)="onFileSelected($event)"
                  class="hidden"
                />
              </label>
              <label class="px-3.5 py-2 bg-[#0F2937] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center transition-colors shadow-xs">
                <span class="mr-1.5">🖼️</span>
                Pick from Gallery
                <input
                  type="file"
                  accept="image/*"
                  (change)="onFileSelected($event)"
                  class="hidden"
                />
              </label>
            </div>
          </div>

          <!-- URL Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Or Enter Photo URL</label>
            <input
              type="url"
              [(ngModel)]="newImageUrl"
              placeholder="https://example.com/property-photo.jpg"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
            />
            <p class="text-[10px] text-slate-400">Direct HTTPS image URL or uploaded photo Data URL</p>
          </div>

          <!-- Caption Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Caption / Label (Optional)</label>
            <input
              type="text"
              [(ngModel)]="newImageCaption"
              placeholder="e.g., Living Room with Balcony, Master Bedroom, Kitchen"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
            />
          </div>

          <!-- Live Image Preview -->
          <div *ngIf="newImageUrl" class="space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase">Live Image Preview</span>
            <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <img
                [src]="newImageUrl"
                [alt]="newImageCaption || 'Preview'"
                class="w-full h-full object-cover"
                (error)="previewError = true"
                (load)="previewError = false"
              />
            </div>
            <p *ngIf="previewError" class="text-[10px] text-rose-600 font-bold">
              ⚠️ Unable to load image preview from this URL. Please verify the link.
            </p>
          </div>

          <!-- Quick Samples Palette -->
          <div class="space-y-1.5 pt-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Or select demo photo:</span>
            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let sample of samplePhotos"
                type="button"
                (click)="selectSample(sample)"
                class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                {{ sample.label }}
              </button>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              (click)="closeAddModal()"
              type="button"
              class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              (click)="submitAddImage()"
              [disabled]="!newImageUrl || isMutating"
              type="button"
              class="px-5 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {{ isMutating ? 'Uploading...' : 'Add to Listing' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerPropertyImagesComponent implements OnInit {
  propertyId: string = '';
  property: Property | null = null;
  images: PropertyImage[] = [];

  isLoading: boolean = true;
  isError: boolean = false;
  isMutating: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  showAddModal: boolean = false;
  newImageUrl: string = '';
  newImageCaption: string = '';
  previewError: boolean = false;

  readonly samplePhotos = [
    { label: '🛋️ Living Room', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', caption: 'Spacious Living Room' },
    { label: '🍳 Modular Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800', caption: 'Modern Modular Kitchen' },
    { label: '🛏️ Master Bedroom', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800', caption: 'Master Bedroom with Wardrobes' },
    { label: '🌅 Balcony View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', caption: 'Balcony View & Natural Ventilation' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadProperty();
    } else {
      this.isError = true;
      this.errorMessage = 'Missing Property ID parameter in route.';
      this.isLoading = false;
    }
  }

  loadProperty(): void {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.property = res.data;
          this.images = Array.isArray(res.data.images) ? [...res.data.images] : [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load property images record.';
      },
    });
  }

  get hasMainImage(): boolean {
    return this.images.some((i) => i.isMain);
  }

  get hasExplicitMain(): boolean {
    return this.images.some((i) => i.isMain);
  }

  setAsMain(index: number): void {
    this.isMutating = true;
    this.errorMessage = '';
    this.propertyService.setMainImage(this.propertyId, index).subscribe({
      next: (res: any) => {
        this.isMutating = false;
        if (res.success && res.data) {
          this.property = res.data;
          this.images = [...res.data.images];
        } else {
          // Local fallback
          this.images.forEach((img, idx) => (img.isMain = idx === index));
        }
        this.successMessage = 'Cover photo updated successfully!';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        this.isMutating = false;
        this.errorMessage = err?.error?.message || 'Failed to update main cover photo.';
      },
    });
  }

  deleteImage(index: number): void {
    if (!confirm('Are you sure you want to remove this photo from the property listing?')) {
      return;
    }

    this.isMutating = true;
    this.errorMessage = '';
    this.propertyService.deletePropertyImage(this.propertyId, index).subscribe({
      next: (res: any) => {
        this.isMutating = false;
        if (res.success && res.data) {
          this.property = res.data;
          this.images = [...res.data.images];
        } else {
          this.images.splice(index, 1);
        }
        this.successMessage = 'Photo removed successfully.';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        this.isMutating = false;
        this.errorMessage = err?.error?.message || 'Failed to remove photo.';
      },
    });
  }

  moveImage(fromIndex: number, direction: number): void {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= this.images.length) return;

    const updated = [...this.images];
    const temp = updated[fromIndex];
    updated[fromIndex] = updated[toIndex];
    updated[toIndex] = temp;

    this.isMutating = true;
    this.propertyService.reorderPropertyImages(this.propertyId, updated).subscribe({
      next: (res: any) => {
        this.isMutating = false;
        if (res.success && res.data) {
          this.images = [...res.data.images];
        } else {
          this.images = updated;
        }
        this.successMessage = 'Photos reordered successfully.';
        setTimeout(() => (this.successMessage = ''), 2500);
      },
      error: () => {
        this.isMutating = false;
        this.images = updated; // optimistic update
      },
    });
  }

  submitAddImage(): void {
    if (!this.newImageUrl || !this.newImageUrl.trim()) return;

    this.isMutating = true;
    this.errorMessage = '';

    const newPhoto = {
      url: this.newImageUrl.trim(),
      caption: this.newImageCaption.trim() || undefined,
    };

    this.propertyService.addPropertyImages(this.propertyId, [newPhoto]).subscribe({
      next: (res: any) => {
        this.isMutating = false;
        if (res.success && res.data) {
          this.property = res.data;
          this.images = [...res.data.images];
        } else {
          this.images.push({ ...newPhoto, isMain: this.images.length === 0, order: this.images.length });
        }
        this.closeAddModal();
        this.successMessage = 'New photo added successfully!';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        this.isMutating = false;
        this.errorMessage = err?.error?.message || 'Failed to add image.';
      },
    });
  }

  selectSample(sample: { label: string; url: string; caption: string }): void {
    this.newImageUrl = sample.url;
    this.newImageCaption = sample.caption;
    this.previewError = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newImageUrl = e.target.result;
      this.newImageCaption = this.newImageCaption || file.name;
      this.previewError = false;
    };
    reader.readAsDataURL(file);
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newImageUrl = '';
    this.newImageCaption = '';
    this.previewError = false;
  }

  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  goBack(): void {
    this.router.navigate(['/owner/properties', this.propertyId]);
  }
}
