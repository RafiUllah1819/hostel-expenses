import { useState } from "react";
import Button from "@/components/ui/Button";
import type { NewMemberInput } from "@/types";

interface MemberFormProps {
  /** Called with validated form data when the user submits */
  onSubmit: (input: NewMemberInput) => Promise<void>;
  /** Called when the user clicks Cancel */
  onCancel: () => void;
}

// The shape of our local form state — all strings so inputs stay controlled
interface FormFields {
  name: string;
  nickname: string;
  email: string;
}

const EMPTY: FormFields = { name: "", nickname: "", email: "" };

export default function MemberForm({ onSubmit, onCancel }: MemberFormProps) {
  const [fields,     setFields]     = useState<FormFields>(EMPTY);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [nameError,  setNameError]  = useState(false);

  // Generic change handler — works for every text input
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (name === "name") setNameError(false);
    setError(null); // clear error as user types
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!fields.name.trim()) {
      setError("Name is required.");
      setNameError(true);
      return;
    }
    setNameError(false);

    setLoading(true);
    try {
      await onSubmit({
        name:     fields.name.trim(),
        nickname: fields.nickname.trim() || undefined,
        email:    fields.email.trim()    || undefined,
      });
      setFields(EMPTY); // reset after success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4"
      noValidate
    >
      <h2 className="text-base font-semibold text-gray-800">New Member</h2>

      {/* Error banner */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full name — required */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="e.g. Rafi Uddin"
            value={fields.name}
            onChange={handleChange}
            disabled={loading}
            className={[
              "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50",
              nameError
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-500",
            ].join(" ")}
          />
        </div>

        {/* Nickname — optional */}
        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nickname{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            placeholder="e.g. Rafi"
            value={fields.nickname}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50"
          />
        </div>

        {/* Email — optional */}
        <div className="sm:col-span-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="e.g. rafi@example.com"
            value={fields.email}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={loading}>
          Add Member
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
