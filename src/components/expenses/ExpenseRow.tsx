import Link from "next/link";
import { formatCurrency, formatDate, getInitials } from "@/utils/formatters";
import type { ExpenseListItem, MemberSlim } from "@/types";

interface ExpenseRowProps {
  expense: ExpenseListItem;
}

// ---------------------------------------------------------------------------
// Small coloured avatar chip — used for payer and each participant
// ---------------------------------------------------------------------------
function Avatar({ member }: { member: MemberSlim }) {
  const display = member.nickname ?? member.name;
  return (
    <div
      title={member.name}                 // full name on hover
      className="w-7 h-7 rounded-full bg-blue-100 text-blue-700
                 flex items-center justify-center text-xs font-bold
                 flex-shrink-0 border border-white"
    >
      {getInitials(display)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A row of overlapping participant avatars, with "+N" overflow badge
// ---------------------------------------------------------------------------
const MAX_VISIBLE = 4;

function ParticipantAvatars({
  participants,
}: {
  participants: ExpenseListItem["expense_participants"];
}) {
  const visible  = participants.slice(0, MAX_VISIBLE);
  const overflow = participants.length - MAX_VISIBLE;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((p) => (
        <Avatar key={p.id} member={p.member} />
      ))}
      {overflow > 0 && (
        <div
          title={`${overflow} more participant${overflow > 1 ? "s" : ""}`}
          className="w-7 h-7 rounded-full bg-gray-200 text-gray-600
                     flex items-center justify-center text-xs font-bold
                     flex-shrink-0 border border-white"
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The table row itself
// ---------------------------------------------------------------------------
export default function ExpenseRow({ expense }: ExpenseRowProps) {
  const { title, amount, date, note, payer, expense_participants } = expense;

  // All participants share equally, so grab the first row's share_amount.
  // Fall back to computing it in case the list is somehow empty.
  const shareAmount =
    expense_participants.length > 0
      ? expense_participants[0].share_amount
      : amount;

  return (
    <tr className="hover:bg-gray-50 transition-colors align-top">

      {/* ── Date ─────────────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(date)}
      </td>

      {/* ── Title + optional note ─────────────────────────────────────────── */}
      <td className="px-4 py-4 min-w-[160px]">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {note && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{note}</p>
        )}
      </td>

      {/* ── Paid by ───────────────────────────────────────────────────────── */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Avatar member={payer} />
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {payer.nickname ?? payer.name}
          </span>
        </div>
      </td>

      {/* ── Participants (overlapping avatars) ────────────────────────────── */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <ParticipantAvatars participants={expense_participants} />
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {expense_participants.length} member
            {expense_participants.length !== 1 ? "s" : ""}
          </span>
        </div>
      </td>

      {/* ── Per-person share ──────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
        {formatCurrency(shareAmount)}{" "}
        <span className="text-xs text-gray-400">each</span>
      </td>

      {/* ── Total amount ──────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap text-right">
        {formatCurrency(amount)}
      </td>

      {/* ── Edit link ─────────────────────────────────────────────────────── */}
      <td className="px-4 py-4 text-right">
        <Link
          href={`/expenses/${expense.id}`}
          className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}
