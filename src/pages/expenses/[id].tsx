import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import type { ExpenseFormInitialValues } from "@/components/expenses/ExpenseForm";
import { getExpenseById, updateExpense, deleteExpense } from "@/services/expenseService";
import { getMembers } from "@/services/memberService";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Member } from "@/types";

// ---------------------------------------------------------------------------
// Page states
// ---------------------------------------------------------------------------
type PageStatus = "loading" | "not_found" | "ready" | "save_success" | "delete_success";

export default function EditExpensePage() {
  const router = useRouter();
  // id is undefined on first render (Next.js router hydration), string after
  const id = typeof router.query.id === "string" ? router.query.id : null;

  const [status,        setStatus]        = useState<PageStatus>("loading");
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [members,       setMembers]       = useState<Member[]>([]);
  const [initialValues, setInitialValues] = useState<ExpenseFormInitialValues | null>(null);
  const [savedTitle,    setSavedTitle]    = useState("");
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // ── Load expense + members once id is available ─────────────────────────
  useEffect(() => {
    if (!id) return; // wait for router
    loadData(id);
  }, [id]);

  async function loadData(expenseId: string) {
    setStatus("loading");
    setLoadError(null);
    setDeleteError(null);

    try {
      const [expense, allMembers] = await Promise.all([
        getExpenseById(expenseId),
        getMembers(),
      ]);

      if (!expense) {
        setStatus("not_found");
        return;
      }

      setMembers(allMembers);
      setInitialValues({
        title:           expense.title,
        amount:          expense.amount,
        paid_by:         expense.paid_by,
        date:            expense.date,
        note:            expense.note,
        participant_ids: expense.expense_participants.map((p) => p.member.id),
      });
      setSavedTitle(expense.title);
      setStatus("ready");
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load expense."
      );
      setStatus("loading"); // keep skeleton visible, show error below
    }
  }

  // ── Save (called by ExpenseForm on valid submit) ─────────────────────────
  // This function throws on failure — ExpenseForm catches and shows the error.
  async function handleSave(input: Parameters<typeof updateExpense>[1]) {
    if (!id) throw new Error("No expense id.");
    await updateExpense(id, input);
    setSavedTitle(input.title.trim());
    setStatus("save_success");
    setTimeout(() => router.push("/expenses"), 1600);
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!id) return;
    const confirmed = window.confirm(
      `Delete "${savedTitle}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteExpense(id);
      setStatus("delete_success");
      setTimeout(() => router.push("/expenses"), 1600);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete expense."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="max-w-xl">
        {/* Back link */}
        <Link
          href="/expenses"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          ← Back to Expenses
        </Link>

        {/* ── Loading skeleton ────────────────────────────────────────────── */}
        {status === "loading" && !loadError && (
          <>
            <div className="h-7 w-48 bg-gray-100 rounded animate-pulse mb-6" />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </>
        )}

        {/* ── Load error ──────────────────────────────────────────────────── */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
            <p className="text-sm text-red-700">{loadError}</p>
            {id && (
              <Button variant="secondary" size="sm" onClick={() => loadData(id)}>
                Retry
              </Button>
            )}
          </div>
        )}

        {/* ── Not found ───────────────────────────────────────────────────── */}
        {status === "not_found" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
            <p className="text-sm text-yellow-800 mb-3">
              Expense not found. It may have been deleted.
            </p>
            <Link href="/expenses">
              <Button variant="secondary" size="sm">
                Back to Expenses
              </Button>
            </Link>
          </div>
        )}

        {/* ── Save success ────────────────────────────────────────────────── */}
        {status === "save_success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
            <p className="text-lg">✓</p>
            <p className="font-semibold text-green-800">Changes saved!</p>
            <p className="text-sm text-green-700">
              &ldquo;{savedTitle}&rdquo; has been updated. Redirecting…
            </p>
          </div>
        )}

        {/* ── Delete success ──────────────────────────────────────────────── */}
        {status === "delete_success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
            <p className="text-lg">✓</p>
            <p className="font-semibold text-green-800">Expense deleted.</p>
            <p className="text-sm text-green-700">Redirecting to expenses…</p>
          </div>
        )}

        {/* ── Edit form ───────────────────────────────────────────────────── */}
        {status === "ready" && initialValues && (
          <>
            {/* Page title + expense summary */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Expense
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatCurrency(initialValues.amount)} &middot;{" "}
                  {formatDate(initialValues.date)}
                </p>
              </div>

              {/* Delete button — top-right, dangerous action */}
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>

            {/* Delete error */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            {/* The form — prefilled via initialValues */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <ExpenseForm
                members={members}
                initialValues={initialValues}
                onSubmit={handleSave}
                submitLabel="Save Changes"
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
