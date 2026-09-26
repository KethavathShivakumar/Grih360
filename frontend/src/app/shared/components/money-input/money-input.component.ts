import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyService } from '../../../core/services/money.service';

@Component({
  selector: 'app-money-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-1">
      <label *ngIf="label" class="block text-xs font-bold text-[#0F2937]">{{ label }}</label>
      <div class="relative rounded-xl flex items-center">
        <span class="absolute left-3.5 text-sm font-bold text-[#0F2937]">₹</span>
        <input
          type="number"
          [placeholder]="placeholder"
          [value]="amountValue"
          (input)="onInputChange($event)"
          class="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#E8E6DF] rounded-xl text-sm font-semibold text-[#1B1C1A] focus:border-[#0F2937] focus:ring-1 focus:ring-[#0F2937] outline-none transition"
        />
      </div>
      <p *ngIf="amountValue > 0" class="text-[11px] text-[#2D7A5E] font-medium pt-0.5">
        Display: {{ formattedDisplay }} (Backend: {{ amountValue }})
      </p>
    </div>
  `,
})
export class MoneyInputComponent {
  @Input() label: string = 'Amount';
  @Input() placeholder: string = 'e.g. 4000';
  @Input() amountValue: number = 0;
  @Output() amountValueChange = new EventEmitter<number>();

  constructor(private moneyService: MoneyService) {}

  get formattedDisplay(): string {
    return this.moneyService.formatINR(this.amountValue);
  }

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const num = this.moneyService.parseNumericAmount(val);
    this.amountValue = num;
    this.amountValueChange.emit(num);
  }
}
