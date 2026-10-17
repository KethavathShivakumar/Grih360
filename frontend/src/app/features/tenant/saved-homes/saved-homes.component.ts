import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../shared/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-saved-homes',
  standalone: true,
  imports: [
    CommonModule,
    PropertyCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header Bar: Responsive stacking for mobile (390px) to prevent overlap -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937] tracking-tight">Saved Homes</h1>
          <p class="text-xs text-slate-500 mt-0.5">Keep track of properties you are interested in applying for.</p>
        </div>
        <button
          (click)="goToFindHomes()"
          type="button"
          class="w-full sm:w-auto px-4 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer text-center shrink-0 min-h-[40px] flex items-center justify-center gap-1"
        >
          <span>+</span> Discover More Homes
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching saved properties..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load saved homes"
        [message]="errorMessage"
        (retry)="loadSavedHomes()"
      ></app-error-state>

      <!-- Empty State with clean bookmark heart SVG -->
      <app-empty-state
        *ngIf="!isLoading && !isError && savedHomes.length === 0"
        title="No saved homes yet"
        message="Browse properties on Find Homes and click the heart bookmark icon to save properties you like."
        actionText="Explore Find Homes"
        icon='<svg class="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>'
        (action)="goToFindHomes()"
      ></app-empty-state>

      <!-- Saved Properties Grid -->
      <div *ngIf="!isLoading && !isError && savedHomes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <app-property-card
          *ngFor="let prop of savedHomes"
          [property]="prop"
          [isSaved]="true"
          (cardSelect)="openPropertyDetails($event)"
          (toggleSave)="onUnsaveProperty($event)"
        ></app-property-card>
      </div>
    </div>
  `,
})
export class SavedHomesComponent implements OnInit {
  savedHomes: Property[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSavedHomes();
  }

  loadSavedHomes(): void {
    this.isLoading = true;
    this.isError = false;

    this.propertyService.getSavedProperties().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.savedHomes = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to retrieve saved properties.';
      },
    });
  }

  onUnsaveProperty(property: Property): void {
    this.savedHomes = this.savedHomes.filter((p) => p.id !== property.id);
    this.propertyService.unsaveProperty(property.id).subscribe({
      error: () => this.loadSavedHomes(),
    });
  }

  openPropertyDetails(property: Property): void {
    this.router.navigate(['/tenant/homes', property.id]);
  }

  goToFindHomes(): void {
    this.router.navigate(['/tenant/homes']);
  }
}
