import { useState } from "react";
import Button from "@/components/ui/Button";
import ParticipantCheckboxes from "./ParticipantCheckboxes";
import { computeShareAmount } from "@/utils/splitExpense";
import type { Member, NewExpenseInput } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Pre-populated values for edit mode.
 * When provided the form renders prefilled and does NOT reset on submit
 * (user stays on the edit page to see the result).
 */
export interface ExpenseFormInitialValues {
  title:           string;
  amount:          number;
  paid_by:         string;
  date:            string;
  note:            string | null;
  participant_ids: string[];
}

interface ExpenseFormProps {
  members:       Member[];
  onSubmit:      (input: NewExpenseInput) => Promise<void>;
  initialValues?: ExpenseFormInitialValues;
  /** Button label — defaults to "Save Expense" */
  submitLabel?:  string;
}

// ---------------------------------------------------------------------------
// Local form state — all controlled, all strings until validated
// ---------------------------------------------------------------------------
interface FormFields {
  title:   string;
  amount:  string;
  paid_by: string;
  date:    string;
  note:    string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyFields(): FormFields {
  return { title: "", amount: "", paid_by: "", date: today(), note: "" };
}

function fieldsFromInitial(iv: ExpenseFormInitialValues): FormFields {
  return {
    title:   iv.title,
    amount:  String(iv.amount),
    paid_by: iv.paid_by,
    date:    iv.date,
    note:    iv.note ?? "",
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validate(fields: FormFields, selectedIds: Set<string>): string | null {
  if (!fields.title.trim())
    return "Item title is required.";

  const amount = parseFloat(fields.amount);
  if (isNaN(amount) || amount <= 0)
    return "Amount must be a positive number.";

  if (!fields.paid_by)
    return "Please select who paid for this expense.";

  if (selectedIds.size === 0)
    return "Select at least one participant to split the expense among.";

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ExpenseForm({
  members,
  onSubmit,
  initialValues,
  submitLabel = "Save Expense",
}: ExpenseFormProps) {
  const isEditMode = !!initialValues;

  const [fields, setFields] = useState<FormFields>(() =>
    initialValues ? fieldsFromInitial(initialValues) : emptyFields()
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    initialValues
      ? new Set(initialValues.participant_ids)
      : new Set(members.map((m) => m.id))
  );

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Generic field change handler ─────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  // ── Participant checkbox toggle ───────────────────────────────────────────
  function handleParticipantToggle(memberId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(memberId) : next.delete(memberId);
      return next;
    });
    setError(null);
  }

  // ── Live share preview ───────────────────────────────────────────────────
  // computeShareAmount handles divide-by-zero and rounding — no inline math needed.
  const parsedAmount = parseFloat(fields.amount);
  const shareAmount  = computeShareAmount(parsedAmount, selectedIds.size);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate(fields, selectedIds);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title:           fields.title.trim(),
        amount:          parseFloat(fields.amount),
        paid_by:         fields.paid_by,
        date:            fields.date,
        note:            fields.note.trim() || undefined,
        participant_ids: Array.from(selectedIds),
      });

      // In add mode, reset the form so the user can enter another expense.
      // In edit mode, leave the form as-is — the page handles navigation.
      if (!isEditMode) {
        setFields(emptyFields());
        setSelectedIds(new Set(members.map((m) => m.id)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <span className="mt-0.5 flex-shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Item / Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Groceries, Electricity bill"
          value={fields.title}
          onChange={handleChange}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {/* Amount + Paid By — side by side on wider screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (৳) <span className="text-red-500">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={fields.amount}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="paid_by"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Paid By <span className="text-red-500">*</span>
          </label>
          <select
            id="paid_by"
            name="paid_by"
            value={fields.paid_by}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname ?? m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={fields.date}
          onChange={handleChange}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {/* Note */}
      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Note{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          placeholder="Any extra detail…"
          value={fields.note}
          onChange={handleChange}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     resize-none disabled:opacity-50"
        />
      </div>

      {/* Split among */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Split Among <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => setSelectedIds(new Set(members.map((m) => m.id)))}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-500 hover:underline disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        <ParticipantCheckboxes
          members={members}
          selectedIds={selectedIds}
          shareAmount={shareAmount}
          onChange={handleParticipantToggle}
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
