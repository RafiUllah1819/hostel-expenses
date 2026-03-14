import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import ExpenseList from "@/components/expenses/ExpenseList";
import { getExpensesWithDetails } from "@/services/expenseService";
import { formatCurrency } from "@/utils/formatters";
import type { ExpenseListItem } from "@/types";

export default function ExpensesPage() {
  const [expenses,  setExpenses]  = useState<ExpenseListItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── Fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpensesWithDetails();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  // ── Derived summary numbers (only when data is loaded) ──────────────────
  const totalSpent   = expenses.reduce((sum, e) => sum + e.amount, 0);
  const uniquePayers = new Set(expenses.map((e) => e.paid_by)).size;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          {!loading && !error && expenses.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""} &middot;{" "}
              {formatCurrency(totalSpent)} total &middot;{" "}
              {uniquePayers} payer{uniquePayers !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link href="/expenses/add">
          <Button>+ Add Expense</Button>
        </Link>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex gap-8">
            {/* Fake header cells */}
            {[80, 120, 90, 110, 70, 60].map((w, i) => (
              <div
                key={i}
                style={{ width: w }}
                className="h-3 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="px-4 py-4 flex gap-8 items-center">
                {[80, 160, 100, 120, 70, 60].map((w, i) => (
                  <div
                    key={i}
                    style={{ width: w }}
                    className="h-4 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchExpenses}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Data table ───────────────────────────────────────────────────── */}
      {!loading && !error && (
        <ExpenseList expenses={expenses} />
      )}
    </MainLayout>
  );
}
