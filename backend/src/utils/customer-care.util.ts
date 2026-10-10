/**
 * Grih360 Official Customer Care Configuration & Constants
 * Requirement #35: Grih360 Customer Care Hotline: 6300063704
 */
export const CUSTOMER_CARE_HOTLINE = '6300063704';
export const CUSTOMER_CARE_EMAIL = 'support@grih360.com';
export const CUSTOMER_CARE_HOURS = 'Mon - Sat: 8:00 AM - 8:00 PM IST';

export class CustomerCareUtil {
  static getHotline(): string {
    return CUSTOMER_CARE_HOTLINE;
  }

  static getFormattedContact(): { phone: string; email: string; hours: string } {
    return {
      phone: CUSTOMER_CARE_HOTLINE,
      email: CUSTOMER_CARE_EMAIL,
      hours: CUSTOMER_CARE_HOURS,
    };
  }
}
