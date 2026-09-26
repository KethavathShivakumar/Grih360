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
      <!-- Header Bar -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Saved Homes</h1>
          <p class="text-xs text-slate-500">Keep track of properties you are interested in applying for.</p>
        </div>
        <button
          (click)="goToFindHomes()"
          type="button"
          class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          + Discover More Homes
        </button>
      </div>

      <!-- Stitch Request Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching saved properties..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load saved homes"
        [message]="errorMessage"
        (retry)="loadSavedHomes()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && savedHomes.length === 0"
        title="No saved homes yet"
        message="Browse properties on Find Homes and click the heart bookmark icon to save properties you like."
        actionText="Explore Find Homes"
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
