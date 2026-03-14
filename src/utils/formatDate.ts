/**
 * Format a date string to a human-readable date (e.g. "Mar 14, 2026").
 *
 * WHY the normalization:
 *   Bare date strings like "2026-03-14" are parsed by JS as UTC midnight.
 *   In any timezone behind UTC (e.g. UTC+6 = Bangladesh) this means the Date
 *   object represents the previous calendar day locally, so toLocaleDateString
 *   would display "Mar 13" instead of "Mar 14".
 *   Appending "T00:00:00" forces the engine to treat it as local midnight,
 *   giving the correct day in every timezone.
 *
 * @example  formatDate("2026-03-14")                  → "Mar 14, 2026"
 * @example  formatDate("2026-03-14T08:30:00.000Z")    → "Mar 14, 2026"
 */
export function formatDate(dateStr: string): string {
  const normalized = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`;
  return new Date(normalized).toLocaleDateString("en-US", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
}

/**
 * Return two-letter initials from a full name.
 *
 * Takes the first character of each space-separated word, uppercases them,
 * and returns at most two characters.
 *
 * @example  getInitials("Rafi Uddin")   → "RU"
 * @example  getInitials("Sabbir")       → "SA"
 * @example  getInitials("A B C")        → "AB"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
