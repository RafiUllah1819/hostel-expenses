import { Fragment, useState } from "react";
import Button from "@/components/ui/Button";
import { getInitials, formatDate } from "@/utils/formatters";
import type { Member } from "@/types";

interface MemberListProps {
  members: Member[];
  /** Called with the member id when user confirms deletion */
  onDelete: (id: string) => Promise<void>;
}

// Track which member is currently being deleted so we can show a spinner
// on just that row's button, and also store any per-row error message.
interface RowState {
  loading: boolean;
  error: string | null;
}

export default function MemberList({ members, onDelete }: MemberListProps) {
  // Map of memberId → row state so each row is independent
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  function getRowState(id: string): RowState {
    return rowStates[id] ?? { loading: false, error: null };
  }

  function setRowState(id: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...getRowState(id), ...patch },
    }));
  }

  async function handleDelete(member: Member) {
    const displayName = member.nickname ?? member.name;
    const confirmed = window.confirm(
      `Remove "${displayName}" from the group?\n\n` +
        "This will fail if the member is part of any expense."
    );
    if (!confirmed) return;

    setRowState(member.id, { loading: true, error: null });
    try {
      await onDelete(member.id);
      // Parent re-renders with the member removed — no local state change needed
    } catch (err) {
      setRowState(member.id, {
        loading: false,
        error: err instanceof Error ? err.message : "Could not delete member.",
      });
    }
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
        No members yet. Add the first one above.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {["Member", "Nickname", "Email", "Joined", ""].map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {members.map((member) => {
            const { loading, error } = getRowState(member.id);

            return (
              // Fragment with key lets us render two <tr> rows per member
              // without wrapping them in a <div> (which is invalid inside <tbody>)
              <Fragment key={member.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  {/* Avatar + name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(member.nickname ?? member.name)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {member.name}
                      </span>
                    </div>
                  </td>

                  {/* Nickname */}
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {member.nickname ?? (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {member.email ?? (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>

                  {/* Joined date */}
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(member.created_at)}
                  </td>

                  {/* Delete button */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      loading={loading}
                      onClick={() => handleDelete(member)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>

                {/* Inline error row — only rendered when this member's deletion fails */}
                {error && (
                  <tr className="bg-red-50">
                    <td colSpan={5} className="px-4 py-2">
                      <p className="text-sm text-red-600">{error}</p>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
