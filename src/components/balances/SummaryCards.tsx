import { formatCurrency } from "@/utils/formatters";
import type { MemberBalance } from "@/types";

interface SummaryCardsProps {
  balances: MemberBalance[];
}

interface CardProps {
  label: string;
  value: string;
  sub: string;
  accent: "blue" | "green" | "red" | "gray";
}

// Accent colour maps — keeps the JSX clean
const accentBorder: Record<CardProps["accent"], string> = {
  blue:  "border-blue-200  bg-blue-50",
  green: "border-green-200 bg-green-50",
  red:   "border-red-200   bg-red-50",
  gray:  "border-gray-200  bg-gray-50",
};
const accentValue: Record<CardProps["accent"], string> = {
  blue:  "text-blue-700",
  green: "text-green-700",
  red:   "text-red-600",
  gray:  "text-gray-600",
};

function Card({ label, value, sub, accent }: CardProps) {
  return (
    <div className={`rounded-xl border p-4 ${accentBorder[accent]}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accentValue[accent]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function SummaryCards({ balances }: SummaryCardsProps) {
  // Total money that changed hands (sum of what everyone paid)
  const totalSpent = balances.reduce((sum, b) => sum + b.total_paid, 0);

  // How many members are in each status group
  const creditors = balances.filter((b) => b.balance > 0);
  const debtors   = balances.filter((b) => b.balance < 0);
  const settled   = balances.filter((b) => b.balance === 0);

  // Largest individual amounts for context
  const topCredit = creditors.length > 0
    ? Math.max(...creditors.map((b) => b.balance))
    : 0;
  const topDebt = debtors.length > 0
    ? Math.abs(Math.min(...debtors.map((b) => b.balance)))
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <Card
        accent="blue"
        label="Group Spent"
        value={formatCurrency(totalSpent)}
        sub={`across ${balances.length} member${balances.length !== 1 ? "s" : ""}`}
      />
      <Card
        accent="green"
        label="To Receive"
        value={String(creditors.length)}
        sub={
          creditors.length > 0
            ? `most: ${formatCurrency(topCredit)}`
            : "nobody owed money"
        }
      />
      <Card
        accent="red"
        label="To Pay Back"
        value={String(debtors.length)}
        sub={
          debtors.length > 0
            ? `most: ${formatCurrency(topDebt)}`
            : "nobody owes money"
        }
      />
      <Card
        accent="gray"
        label="Settled"
        value={String(settled.length)}
        sub={`member${settled.length !== 1 ? "s" : ""} fully even`}
      />
    </div>
  );
}
