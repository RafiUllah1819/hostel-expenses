/**
 * Format a number as a currency string.
 *
 * Uses the Bangladeshi locale so amounts render as  ৳1,250.00
 * Pass a different ISO 4217 currency code to override.
 *
 * @example  formatCurrency(1250)       → "৳1,250.00"
 * @example  formatCurrency(1250, "USD") → "$1,250.00"
 */
export function formatCurrency(amount: number, currency = "BDT"): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
