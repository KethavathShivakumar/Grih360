import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationStatus } from '../../models/user.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge-status" [ngClass]="getBadgeClass()">
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
        return 'badge-under-review';
      case 'PENDING':
      case 'REJECTED':
      case 'EXPIRED':
        return 'badge-pending';
      case 'NOT_STARTED':
      default:
        return 'badge-not-started';
    }
  }

  getDotClass(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'bg-[#2D7A5E]';
      case 'UNDER_REVIEW':
        return 'bg-[#C2410C]';
      case 'PENDING':
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-[#B91C1C]';
      default:
        return 'bg-[#64748B]';
    }
  }

  getLabel(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'Verified';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'PENDING':
        return 'Pending Verification';
      case 'REJECTED':
        return 'Verification Rejected';
      case 'EXPIRED':
        return 'Verification Expired';
      case 'NOT_STARTED':
      default:
        return 'Not Started';
    }
  }
}
