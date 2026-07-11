export const TAX_RATE = 0.18; // 18% Configurable Tax (GST)

export interface BilledTreatment {
  id: string;
  treatmentName: string;
  toothNumber?: number;
  fee: number;
}

/**
 * Calculates the subtotal from selected treatments.
 */
export function calculateSubtotal(items: BilledTreatment[]): number {
  return items.reduce((sum, item) => sum + (item.fee || 0), 0);
}

/**
 * Calculates the tax amount based on the subtotal.
 */
export function calculateTax(subtotal: number): number {
  return subtotal * TAX_RATE;
}

/**
 * Calculates the grand total using the formula: Grand Total = Subtotal + Tax - Discount.
 * Prevents negative grand totals.
 */
export function calculateGrandTotal(subtotal: number, tax: number, discount: number): number {
  return Math.max(0, subtotal + tax - discount);
}
