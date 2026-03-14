/**
 * Barrel file — re-exports all display formatters from their individual modules.
 *
 * Every file in the codebase that imports from "@/utils/formatters" continues
 * to work without any changes.  New code can import from the specific module
 * (e.g. "@/utils/formatCurrency") or from this barrel — both are fine.
 */

export { formatCurrency } from "./formatCurrency";
export { formatDate, getInitials } from "./formatDate";
