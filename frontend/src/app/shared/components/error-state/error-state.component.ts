import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bento-card border-err-border bg-err-bg text-center p-8 max-w-md mx-auto my-6 space-y-4">
      <div class="w-12 h-12 rounded-lg bg-err-bg border border-err-border flex items-center justify-center text-err-text mx-auto">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <div>
        <h4 class="text-base font-semibold text-err-text">{{ title }}</h4>
        <p class="text-sm text-err-text/80 mt-1">{{ message }}</p>
      </div>
      <button
        (click)="retry.emit()"
        type="button"
        class="btn-secondary text-err-text border-err-border hover:bg-err-bg cursor-pointer">
        Try again
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title: string = 'Something went wrong';
  @Input() message: string = 'A network error occurred. Please try again.';
  @Output() retry = new EventEmitter<void>();
}
