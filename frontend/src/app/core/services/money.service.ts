import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MoneyService {
  /**
   * Parse numeric value from input string
   */
  public parseNumericAmount(val: string | number | null | undefined): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = val.toString().replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Format number to Indian Rupee currency format (e.g., 4000 -> "₹4,000")
   */
  public formatINR(amount: number | null | undefined): string {
    const valid = amount && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(valid);
  }
}
