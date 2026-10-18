import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationStatus } from '../../models/user.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      <span class="w-2 h-2 rounded-full" [ngClass]="getDotClass()"></span>
      {{ getLabel() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: VerificationStatus | string = 'NOT_STARTED';

  getBadgeClass(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'badge-verified';
      case 'UNDER_REVIEW':
        return 'badge-review';
      case 'PENDING':
      case 'REJECTED':
      case 'EXPIRED':
        return 'badge-error';
      case 'NOT_STARTED':
      default:
        return 'badge-neutral';
    }
  }

  getDotClass(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'bg-ok-text';
      case 'UNDER_REVIEW':
        return 'bg-warn-text';
      case 'PENDING':
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-err-text';
      default:
        return 'bg-n-400';
    }
  }

  getLabel(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'Verified';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      case 'EXPIRED':
        return 'Expired';
      case 'NOT_STARTED':
      default:
        return 'Not Started';
    }
  }
}
