import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bento-card text-center p-8 max-w-sm mx-auto my-6 space-y-4">
      <!-- Icon container -->
      <div class="w-12 h-12 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-400 mx-auto">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      </div>
      <div>
        <h4 class="text-base font-semibold text-n-900">{{ title }}</h4>
        <p class="text-sm text-n-500 mt-1 leading-relaxed">{{ displayDescription }}</p>
      </div>
      <button
        *ngIf="displayActionLabel"
        (click)="onActionClick()"
        type="button"
        class="btn-primary cursor-pointer">
        {{ displayActionLabel }}
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title: string = 'Nothing here yet';
  @Input() description?: string;
  @Input() message?: string;
  @Input() actionLabel?: string;
  @Input() actionText?: string;

  @Output() actionClick = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  get displayDescription(): string {
    return this.description || this.message || 'No records to display.';
  }

  get displayActionLabel(): string | undefined {
    return this.actionLabel || this.actionText;
  }

  onActionClick(): void {
    this.actionClick.emit();
    this.action.emit();
  }
}
