import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { getMembers } from "@/services/memberService";
import { addExpense } from "@/services/expenseService";
import type { Member, NewExpenseInput } from "@/types";

// ---------------------------------------------------------------------------
// Three possible states for the page
// ---------------------------------------------------------------------------
type PageStatus = "loading" | "ready" | "error" | "success";

export default function AddExpensePage() {
  const router = useRouter();

  const [members,    setMembers]    = useState<Member[]>([]);
  const [status,     setStatus]     = useState<PageStatus>("loading");
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string>("");  // shown in success banner

  // ── Load members when the page mounts ─────────────────────────────────
  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setStatus("loading");
    setLoadError(null);
    try {
      const data = await getMembers();
      setMembers(data);
      setStatus("ready");
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load members."
      );
      setStatus("error");
    }
  }

  // ── Called by ExpenseForm on a valid submit ────────────────────────────
  // This function throws on failure — ExpenseForm catches it and shows the
  // error inside the form.
  async function handleSubmit(input: NewExpenseInput) {
    const expense = await addExpense(input); // throws on DB error
    setSavedTitle(expense.title);
    setStatus("success");

    // Redirect to the expenses list after a short delay so the user sees
    // the success banner briefly.
    setTimeout(() => router.push("/expenses"), 1800);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="max-w-xl">
        {/* Back link + heading */}
        <div className="mb-6">
          <Link
            href="/expenses"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
          >
            ← Back to Expenses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details and choose who shares this expense.
          </p>
        </div>

        {/* ── Loading skeleton ──────────────────────────────────────────── */}
        {status === "loading" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Members failed to load ────────────────────────────────────── */}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
            <p className="text-sm text-red-700">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={loadMembers}>
              Retry
            </Button>
          </div>
        )}

        {/* ── No members exist yet ──────────────────────────────────────── */}
        {status === "ready" && members.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
            <p className="text-sm text-yellow-800 mb-3">
              You need at least one member before adding an expense.
            </p>
            <Link href="/members">
              <Button variant="secondary" size="sm">
                Go to Members →
              </Button>
            </Link>
          </div>
        )}

        {/* ── Success banner ────────────────────────────────────────────── */}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
            <div className="text-3xl">✓</div>
            <p className="font-semibold text-green-800">Expense saved!</p>
            <p className="text-sm text-green-700">
              &ldquo;{savedTitle}&rdquo; has been recorded. Redirecting…
            </p>
            <Link href="/expenses">
              <Button variant="secondary" size="sm">
                View All Expenses
              </Button>
            </Link>
          </div>
        )}

        {/* ── The actual form ───────────────────────────────────────────── */}
        {status === "ready" && members.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <ExpenseForm members={members} onSubmit={handleSubmit} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
