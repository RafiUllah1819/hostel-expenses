import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Member, NewSettlementInput } from "@/types";

interface SettlementFormProps {
  members: Member[];
  onSubmit: (input: NewSettlementInput) => Promise<void>;
  onCancel: () => void;
}

interface FormFields {
  paid_by: string;
  paid_to: string;
  amount: string;
  date: string;
  note: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyFields(): FormFields {
  return { paid_by: "", paid_to: "", amount: "", date: today(), note: "" };
}

function validate(fields: FormFields): string | null {
  if (!fields.paid_by) return "Select who paid.";
  if (!fields.paid_to) return "Select who received the payment.";
  if (fields.paid_by === fields.paid_to) return "The payer and receiver must be different people.";
  const amount = parseFloat(fields.amount);
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";
  return null;
}

export default function SettlementForm({
  members,
  onSubmit,
  onCancel,
}: SettlementFormProps) {
  const [fields,  setFields]  = useState<FormFields>(emptyFields);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate(fields);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await onSubmit({
        paid_by: fields.paid_by,
        paid_to: fields.paid_to,
        amount:  parseFloat(fields.amount),
        date:    fields.date,
        note:    fields.note.trim() || undefined,
      });
      setFields(emptyFields());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4"
    >
      <h2 className="text-base font-semibold text-gray-800">Record Settlement</h2>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <span className="mt-0.5 flex-shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Paid By → Paid To on the same row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paid_by" className="block text-sm font-medium text-gray-700 mb-1">
            Who paid? <span className="text-red-500">*</span>
          </label>
          <select
            id="paid_by"
            name="paid_by"
            value={fields.paid_by}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname ?? m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="paid_to" className="block text-sm font-medium text-gray-700 mb-1">
            Paid to whom? <span className="text-red-500">*</span>
          </label>
          <select
            id="paid_to"
            name="paid_to"
            value={fields.paid_to}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option
                key={m.id}
                value={m.id}
                disabled={m.id === fields.paid_by}
              >
                {m.nickname ?? m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
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
                       focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
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
                       focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Note <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder='e.g. "via bKash", "cash in hand"'
          value={fields.note}
          onChange={handleChange}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={loading}>
          Record Settlement
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
