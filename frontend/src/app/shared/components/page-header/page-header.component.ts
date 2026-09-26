import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DF] mb-6">
      <div>
        <h1 class="text-2xl font-black text-[#0F2937] tracking-tight">{{ title }}</h1>
        <p *ngIf="subtitle" class="text-xs text-slate-500 font-medium mt-0.5">{{ subtitle }}</p>
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
}
