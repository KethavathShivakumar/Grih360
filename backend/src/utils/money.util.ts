/**
 * Money utilities enforcing pure numeric backend storage
 * as specified in Grih360 requirement #16.
 */
export class MoneyUtil {
  /**
   * Parse numeric value from string or number.
   * Example: "₹4,000" or 4000 -> 4000
   */
  static parseNumericAmount(input: string | number): number {
    if (typeof input === 'number') {
      return isNaN(input) ? 0 : Math.max(0, input);
    }
    if (!input) return 0;
    const cleaned = input.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  /**
   * Format numeric amount for display in INR format
   * Example: 4000 -> "₹4,000"
   */
  static formatINR(amount: number): string {
    const validAmount = isNaN(amount) ? 0 : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(validAmount);
  }
}
