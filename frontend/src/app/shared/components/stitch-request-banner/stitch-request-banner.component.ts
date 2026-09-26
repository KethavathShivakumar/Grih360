import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StitchDesignRequest } from '../../models/stitch-request.model';
import { CustomerCareComponent } from '../customer-care/customer-care.component';

@Component({
  selector: 'app-stitch-request-banner',
  standalone: true,
  imports: [CommonModule, CustomerCareComponent],
  template: `
    <div class="max-w-4xl mx-auto my-8 p-6 bg-white border-2 border-dashed border-[#E26D46] rounded-2xl shadow-md space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#E8E6DF]">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#E26D46] font-bold">
            ⚡
          </div>
          <div>
            <h3 class="text-lg font-black text-[#0F2937]">STITCH DESIGN REQUIRED</h3>
            <p class="text-xs text-[#64748B] font-medium">
              UI implementation paused per rule: <strong class="text-[#0F2937]">NEVER INVENT A FINAL NIVAS360 UI</strong>. Backend services are active.
            </p>
          </div>
        </div>
        <span class="px-3 py-1 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs font-bold rounded-full">
          DESIGN_REQUIRED
        </span>
      </div>

      <div class="bg-[#FAF9F5] p-5 rounded-xl border border-[#E8E6DF] space-y-3 text-xs font-mono text-[#0F2937]">
        <div><strong>Page:</strong> {{ effectivePageName }}</div>
        <div><strong>Route:</strong> {{ effectiveRoute }}</div>
        <div><strong>Role:</strong> {{ effectiveRole }}</div>
        <div><strong>Purpose:</strong> {{ effectivePurpose }}</div>
        <div *ngIf="entryPoint || request?.userEntersFrom"><strong>User enters from:</strong> {{ entryPoint || request?.userEntersFrom }}</div>
        <div *ngIf="previousPage || nextPage"><strong>Previous / Next Page:</strong> {{ previousPage }} &rarr; {{ nextPage }}</div>
        <div *ngIf="requiredInformation.length > 0 || (request && request.requiredInformation.length > 0)">
          <strong>Required information:</strong>
          <ul class="list-disc pl-5 mt-1 space-y-0.5">
            <li *ngFor="let info of (requiredInformation.length > 0 ? requiredInformation : request?.requiredInformation)">{{ info }}</li>
          </ul>
        </div>
        <div *ngIf="requiredActions.length > 0 || (request && request.requiredActions.length > 0)">
          <strong>Required actions:</strong>
          <ul class="list-disc pl-5 mt-1 space-y-0.5">
            <li *ngFor="let act of (requiredActions.length > 0 ? requiredActions : request?.requiredActions)">{{ act }}</li>
          </ul>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2">
        <p class="text-xs text-[#64748B]">
          Antigravity backend models, MongoDB schemas, REST API v1 routes, and controllers are fully operational for this feature.
        </p>
        <app-customer-care></app-customer-care>
      </div>
    </div>
  `,
})
export class StitchRequestBannerComponent {
  @Input() request?: StitchDesignRequest;

  @Input() pageName: string = '';
  @Input() route: string = '';
  @Input() role: string = '';
  @Input() roleName: string = '';
  @Input() purpose: string = '';
  @Input() entryPoint: string = '';
  @Input() previousPage: string = '';
  @Input() nextPage: string = '';
  @Input() requiredInformation: string[] = [];
  @Input() requiredActions: string[] = [];
  @Input() requiredStates: string[] = [];

  get effectivePageName(): string {
    return this.pageName || this.request?.pageName || 'Nivas360 Page';
  }

  get effectiveRoute(): string {
    return this.route || this.request?.route || '/';
  }

  get effectiveRole(): string {
    return this.role || this.roleName || this.request?.role || 'User';
  }

  get effectivePurpose(): string {
    return this.purpose || this.request?.purpose || 'Core user experience flow';
  }
}
