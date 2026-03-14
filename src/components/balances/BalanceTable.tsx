import BalanceRow from "./BalanceRow";
import { formatCurrency } from "@/utils/formatters";
import type { MemberBalance } from "@/types";

interface BalanceTableProps {
  balances: MemberBalance[];
}

const COLUMNS = [
  { label: "#",          width: "w-6"  },
  { label: "Member"                    },
  { label: "Paid",       right: true   },
  { label: "Owed",       right: true   },
  { label: "Balance",    right: true   },
  { label: "Status",     right: true   },
] as const;

export default function BalanceTable({ balances }: BalanceTableProps) {
  if (balances.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <p className="text-gray-400 text-sm">
          No members yet. Add members and expenses to see balances here.
        </p>
      </div>
    );
  }

  // Grand totals for the footer — sum of all paid and owed
  const grandPaid = balances.reduce((s, b) => s + b.total_paid, 0);
  const grandOwed = balances.reduce((s, b) => s + b.total_owed, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={[
                    "px-4 py-3 text-xs font-semibold text-gray-500",
                    "uppercase tracking-wide",
                    col.right ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Rows — already sorted by balance DESC from calculateMemberBalances ── */}
          <tbody className="divide-y divide-gray-100">
            {balances.map((entry, index) => (
              <BalanceRow
                key={entry.member.id}
                entry={entry}
                rank={index + 1}
              />
            ))}
          </tbody>

          {/* ── Footer totals ─────────────────────────────────────────────── */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              {/* span the first two columns (rank + member name) */}
              <td
                colSpan={2}
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                Totals
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                {formatCurrency(grandPaid)}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                {formatCurrency(grandOwed)}
              </td>
              {/* Balance column: sum should always be 0 (money is conserved) */}
              <td className="px-4 py-3 text-sm text-gray-400 text-right text-xs">
                net zero ✓
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap gap-4 text-xs text-gray-400">
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
          Gets back — the group owes this member
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />
          Owes — this member owes the group
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" />
          Settled — fully even
        </span>
      </div>
    </div>
  );
}
