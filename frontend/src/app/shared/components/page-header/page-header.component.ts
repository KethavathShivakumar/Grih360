import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-n-200 mb-6">
      <div>
        <h1 class="text-xl font-semibold text-n-900 tracking-tight">{{ title }}</h1>
        <p *ngIf="subtitle" class="text-sm text-n-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
}
