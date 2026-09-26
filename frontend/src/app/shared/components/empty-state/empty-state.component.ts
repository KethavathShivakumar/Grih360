import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bento-card text-center p-8 max-w-md mx-auto my-6 space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto">
        {{ icon }}
      </div>
      <div>
        <h4 class="text-lg font-bold text-[#0F2937]">{{ title }}</h4>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ description }}</p>
      </div>
      <button
        *ngIf="actionLabel"
        (click)="actionClick.emit()"
        class="bg-[#0F2937] hover:bg-[#134e4a] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition">
        {{ actionLabel }}
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon: string = '🔍';
  @Input() title: string = 'No Items Available';
  @Input() description: string = 'There are currently no records matching your request.';
  @Input() actionLabel?: string;
  @Output() actionClick = new EventEmitter<void>();
}
