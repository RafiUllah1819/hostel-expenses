/**
 * Utilities for splitting an expense amount equally among participants.
 *
 * These are the only two places in the codebase where money arithmetic
 * (division and rounding) is performed.  Centralising them here means
 * every caller — the add-expense service, the update-expense service,
 * the live form preview — all produce identical results.
 */

/**
 * Round a floating-point amount to exactly 2 decimal places.
 *
 * Uses  Math.round(x * 100) / 100  rather than  parseFloat(x.toFixed(2))
 * because toFixed() has well-known browser rounding bugs for values like 1.005.
 *
 * @example  roundMoney(333.3333) → 333.33
 * @example  roundMoney(0.005)    → 0.01   (rounds up correctly)
 * @example  roundMoney(0)        → 0
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute the equal share per person for a single expense.
 *
 * The share is stored in the database at insert/update time so that
 * future member additions never retroactively change old splits.
 *
 * Divide-by-zero guard: returns 0 when participantCount ≤ 0.
 * This cannot happen through the UI (form requires ≥ 1 participant),
 * but a pure function should never throw on unexpected input.
 *
 * @param totalAmount      - The full expense amount (must be > 0 in practice).
 * @param participantCount - How many members share this expense.
 * @returns Per-person share, rounded to 2 decimal places.
 *
 * @example  computeShareAmount(1200, 4) → 300.00
 * @example  computeShareAmount(1000, 3) → 333.33
 * @example  computeShareAmount(600,  2) → 300.00
 * @example  computeShareAmount(500,  0) → 0       ← divide-by-zero guard
 */
export function computeShareAmount(
  totalAmount: number,
  participantCount: number
): number {
  if (participantCount <= 0) return 0;
  return roundMoney(totalAmount / participantCount);
}
