import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bento-card text-center p-8 max-w-md mx-auto my-6 space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
        <div *ngIf="safeIcon" [innerHTML]="safeIcon" class="w-7 h-7 flex items-center justify-center [&>svg]:w-7 [&>svg]:h-7 [&>svg]:stroke-[1.8]"></div>
        <svg *ngIf="!safeIcon" class="w-7 h-7 text-slate-400 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <div>
        <h4 class="text-lg font-bold text-[#0F2937]">{{ title }}</h4>
        <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">{{ displayDescription }}</p>
      </div>
      <button
        *ngIf="displayActionLabel"
        (click)="onActionClick()"
        type="button"
        class="bg-[#0F2937] hover:bg-[#134e4a] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer">
        {{ displayActionLabel }}
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
  private _icon: string = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';
  public safeIcon: SafeHtml | null = null;

  @Input()
  set icon(val: string) {
    this._icon = val;
    this.updateSafeIcon();
  }
  get icon(): string {
    return this._icon;
  }

  @Input() title: string = 'No Items Available';
  @Input() description?: string;
  @Input() message?: string;

  @Input() actionLabel?: string;
  @Input() actionText?: string;

  @Output() actionClick = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {
    this.updateSafeIcon();
  }

  private updateSafeIcon(): void {
    if (!this._icon || !this._icon.trim()) {
      this.safeIcon = null;
    } else {
      this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(this._icon);
    }
  }

  get displayDescription(): string {
    return this.description || this.message || 'There are currently no records matching your request.';
  }

  get displayActionLabel(): string | undefined {
    return this.actionLabel || this.actionText;
  }

  onActionClick(): void {
    this.actionClick.emit();
    this.action.emit();
  }
}
