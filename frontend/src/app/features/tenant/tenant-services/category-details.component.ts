import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceCategoryCode } from '../../../core/services/service-request.service';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/tenant/services" class="hover:text-[#0F2937]">Home Services</a>
        <span>/</span>
        <span class="text-[#0F2937] uppercase">{{ categoryCode }}</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1">
          <span class="px-2.5 py-0.5 bg-[#EBF5F0] text-[#2D7A5E] text-xs font-bold rounded-full">Category Guide</span>
          <h1 class="text-2xl font-black text-[#0F2937]">{{ getCategoryTitle() }}</h1>
          <p class="text-xs text-[#64748B] max-w-xl">{{ getCategoryDescription() }}</p>
        </div>
        <button
          (click)="requestService()"
          class="px-6 py-3 bg-[#E26D46] hover:bg-[#d05c35] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          Request {{ getCategoryTitle() }} Professional &rarr;
        </button>
      </div>

      

      <!-- Common Examples Bento Grid -->
      <div class="space-y-4">
        <h2 class="text-base font-bold text-[#0F2937]">Common {{ getCategoryTitle() }} Services</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let ex of getCategoryExamples()"
            (click)="selectExample(ex)"
            class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#2D7A5E] transition cursor-pointer space-y-2 group"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-[#0F2937] group-hover:text-[#2D7A5E]">{{ ex.title }}</h3>
              <span class="text-xs text-[#E26D46] font-bold">&plus; Request</span>
            </div>
            <p class="text-xs text-[#64748B]">{{ ex.detail }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ServiceCategoryDetailsComponent implements OnInit {
  public categoryCode: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.categoryCode = (params['category'] || 'PLUMBING').toUpperCase();
    });
  }

  public getCategoryTitle(): string {
    switch (this.categoryCode) {
      case 'PLUMBING': return 'Plumbing';
      case 'ELECTRICAL': return 'Electrical';
      case 'CARPENTRY': return 'Carpentry';
      case 'PAINTING': return 'Painting';
      case 'CLEANING': return 'Cleaning';
      case 'AC_APPLIANCE': return 'AC & Appliance';
      case 'WATER_FILTER': return 'Water Filter';
      case 'GENERAL_MAINTENANCE': return 'General Maintenance';
      default: return this.categoryCode;
    }
  }

  public getCategoryDescription(): string {
    switch (this.categoryCode) {
      case 'PLUMBING': return 'Tap fixes, pipe leakages, bathroom fittings, drainage clearance & flush repairs.';
      case 'ELECTRICAL': return 'Switchboard repair, MCB replacement, fan/light installation, and full wiring checks.';
      case 'CARPENTRY': return 'Door locks, hinges, furniture repairs, sliding doors, and custom woodwork fixes.';
      case 'PAINTING': return 'Touch-up wall painting, dampness treatment, door coating, and full house painting.';
      case 'CLEANING': return 'Full home deep cleaning, sofa sanitation, kitchen degreasing, and bathroom scrubbing.';
      case 'AC_APPLIANCE': return 'AC filter cleaning, gas refill, fridge cooling check, and washing machine repair.';
      case 'WATER_FILTER': return 'RO filter cartridge replacement, TDS testing, and membrane servicing.';
      default: return 'General handyman services, tile fixes, window latch repairs, and home maintenance.';
    }
  }

  public getCategoryExamples(): { title: string; detail: string }[] {
    switch (this.categoryCode) {
      case 'PLUMBING':
        return [
          { title: 'Tap / Pipe Leakage', detail: 'Fix dripping taps, underground pipe leaks, or sink joints' },
          { title: 'Drainage Blockage', detail: 'Clear clogged bathroom, kitchen, or balcony drain lines' },
          { title: 'Bathroom Sanitary Fitting', detail: 'Install or repair showerheads, health faucets, or basins' },
          { title: 'Flush Tank Issue', detail: 'Fix slow flushing, tank overflow, or leaking flush valve' },
          { title: 'Other Plumbing Need', detail: 'General plumbing inspection and handyman fixes' },
        ];
      case 'ELECTRICAL':
        return [
          { title: 'Switch / Socket Issue', detail: 'Replace burnt switchboards, loose sockets, or plugs' },
          { title: 'Fan / Light Installation', detail: 'Mount ceiling fans, wall lamps, tube lights, or chandeliers' },
          { title: 'MCB / Tripping Issue', detail: 'Investigate frequent circuit breaker trips or short circuits' },
          { title: 'General Electrical Wiring', detail: 'Wire extension, main line checks, or inverter setup' },
        ];
      default:
        return [
          { title: 'Standard Maintenance Check', detail: 'Thorough inspection and fix by verified technician' },
          { title: 'Urgent Repair Request', detail: 'Same-day priority service booking' },
          { title: 'General Inspection', detail: 'Detailed assessment and quote by service provider' },
        ];
    }
  }

  public selectExample(ex: { title: string; detail: string }): void {
    this.router.navigate(['/tenant/services/request'], {
      queryParams: { category: this.categoryCode, description: `${ex.title}: ${ex.detail}` },
    });
  }

  public requestService(): void {
    this.router.navigate(['/tenant/services/request'], {
      queryParams: { category: this.categoryCode },
    });
  }
}
