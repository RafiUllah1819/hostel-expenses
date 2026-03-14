import Link from "next/link";
import ExpenseRow from "./ExpenseRow";
import { formatCurrency } from "@/utils/formatters";
import type { ExpenseListItem } from "@/types";

interface ExpenseListProps {
  expenses: ExpenseListItem[];
}

// Column header definitions — label + optional right-align flag
const COLUMNS = [
  { label: "Date"         },
  { label: "Item"         },
  { label: "Paid By"      },
  { label: "Split Among"  },
  { label: "Share Each"   },
  { label: "Total", right: true },
  { label: ""             }, // edit action column — no heading
] as const;

export default function ExpenseList({ expenses }: ExpenseListProps) {
  // ── Empty state ──────────────────────────────────────────────────────────
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <p className="text-gray-400 mb-3">No expenses recorded yet.</p>
        <Link
          href="/expenses/add"
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Add the first expense →
        </Link>
      </div>
    );
  }

  // ── Grand total across all expenses ─────────────────────────────────────
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">

          {/* Table header */}
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={[
                    "px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide",
                    col.right ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Expense rows */}
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </tbody>

          {/* Footer — grand total */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td
                colSpan={6}
                className="px-4 py-3 text-sm font-semibold text-gray-700 text-right"
              >
                Grand Total ({expenses.length} expense
                {expenses.length !== 1 ? "s" : ""})
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
