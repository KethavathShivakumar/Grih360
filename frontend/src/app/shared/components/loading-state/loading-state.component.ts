import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-12 space-y-3">
      <div class="w-10 h-10 border-4 border-slate-200 border-t-[#0F2937] rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-[#0F2937] animate-pulse">{{ message }}</p>
    </div>
  `,
})
export class LoadingStateComponent {
  @Input() message: string = 'Loading Nivas360 data...';
}
