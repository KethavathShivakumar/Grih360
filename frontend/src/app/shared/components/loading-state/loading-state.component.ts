import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-12 space-y-3 min-h-[220px]">
      <div class="w-8 h-8 border-2 border-n-200 border-t-brand rounded-full animate-spin"></div>
      <p class="text-sm font-semibold text-n-500">{{ message }}</p>
    </div>
  `,
})
export class LoadingStateComponent {
  @Input() message: string = 'Loading...';
}
