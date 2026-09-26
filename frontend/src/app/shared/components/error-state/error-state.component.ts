import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bento-card border-red-200 bg-red-50/50 text-center p-8 max-w-md mx-auto my-6 space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto font-bold">
        ⚠️
      </div>
      <div>
        <h4 class="text-base font-bold text-red-900">{{ title }}</h4>
        <p class="text-xs text-red-700 mt-1">{{ message }}</p>
      </div>
      <button
        (click)="retry.emit()"
        class="bg-red-700 hover:bg-red-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition">
        Retry Request
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title: string = 'Unable to Load Request';
  @Input() message: string = 'A network or server error occurred. Please try again.';
  @Output() retry = new EventEmitter<void>();
}
