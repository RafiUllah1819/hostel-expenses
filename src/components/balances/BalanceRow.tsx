import { formatCurrency, getInitials } from "@/utils/formatters";
import { getBalanceDisplay } from "@/lib/calculations";
import type { MemberBalance } from "@/types";

interface BalanceRowProps {
  entry: MemberBalance;
  /** 1-based rank — shown as a subtle number before the avatar */
  rank: number;
}

export default function BalanceRow({ entry, rank }: BalanceRowProps) {
  const {
    member,
    total_paid,
    total_owed,
    total_settlements_made,
    total_settlements_received,
    balance,
  } = entry;
  const hasSettlements = total_settlements_made > 0 || total_settlements_received > 0;
  const display     = getBalanceDisplay(balance);
  const displayName = member.nickname ?? member.name;

  // Format the balance string: prefix "+" for positive values
  const balanceStr =
    balance > 0
      ? `+${formatCurrency(balance)}`
      : formatCurrency(balance); // formatCurrency already adds "−" for negatives

  return (
    <tr className="hover:bg-gray-50 transition-colors">

      {/* ── Rank ─────────────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-xs text-gray-300 font-mono w-6 select-none">
        {rank}
      </td>

      {/* ── Member name + avatar ──────────────────────────────────────────── */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Coloured avatar — colour depends on balance status */}
          <div
            className={[
              "w-9 h-9 rounded-full flex items-center justify-center",
              "text-xs font-bold flex-shrink-0",
              display.bgClass,
              display.textClass,
            ].join(" ")}
          >
            {getInitials(displayName)}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            {/* Show full name below if nickname is displayed above */}
            {member.nickname && (
              <p className="text-xs text-gray-400">{member.name}</p>
            )}
          </div>
        </div>
      </td>

      {/* ── Total paid ───────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
        {formatCurrency(total_paid)}
      </td>

      {/* ── Total owed ───────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
        {formatCurrency(total_owed)}
      </td>

      {/* ── Balance (colour-coded, with settlement note if applicable) ─────── */}
      <td className="px-4 py-4 text-right whitespace-nowrap">
        <span className={["text-sm font-bold", display.textClass].join(" ")}>
          {balanceStr}
        </span>
        {hasSettlements && (
          <p className="text-xs text-gray-400 mt-0.5">
            {total_settlements_made > 0 && (
              <span>paid {formatCurrency(total_settlements_made)}</span>
            )}
            {total_settlements_made > 0 && total_settlements_received > 0 && (
              <span> · </span>
            )}
            {total_settlements_received > 0 && (
              <span>received {formatCurrency(total_settlements_received)}</span>
            )}
          </p>
        )}
      </td>

      {/* ── Status badge ─────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-right">
        <span
          className={[
            "inline-block text-xs font-semibold px-2.5 py-1 rounded-full",
            display.bgClass,
            display.textClass,
          ].join(" ")}
        >
          {display.label}
        </span>
      </td>
    </tr>
  );
}
