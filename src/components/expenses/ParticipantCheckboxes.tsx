import { getInitials, formatCurrency } from "@/utils/formatters";
import type { Member } from "@/types";

interface ParticipantCheckboxesProps {
  /** Full list of all members in the group */
  members: Member[];
  /** Set of member ids that are currently checked */
  selectedIds: Set<string>;
  /**
   * Pre-computed share per person.
   * Pass 0 when the amount field is empty or invalid — the label is hidden.
   */
  shareAmount: number;
  /** Called every time a checkbox is toggled */
  onChange: (memberId: string, checked: boolean) => void;
  disabled?: boolean;
}

export default function ParticipantCheckboxes({
  members,
  selectedIds,
  shareAmount,
  onChange,
  disabled = false,
}: ParticipantCheckboxesProps) {
  const showShare = shareAmount > 0;

  return (
    <div className="space-y-2">
      {/* Dynamic split preview shown above the checkboxes */}
      {showShare && (
        <p className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          {formatCurrency(shareAmount)} each &mdash; split equally among{" "}
          {selectedIds.size} member{selectedIds.size !== 1 ? "s" : ""}
        </p>
      )}

      {members.map((member) => {
        const isChecked = selectedIds.has(member.id);
        const displayName = member.nickname ?? member.name;

        return (
          <label
            key={member.id}
            className={[
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none",
              isChecked
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50",
              disabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={isChecked}
              disabled={disabled}
              onChange={(e) => onChange(member.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600
                         focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            />

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(displayName)}
            </div>

            {/* Name + per-person share */}
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate">
                {displayName}
                {member.nickname && (
                  <span className="text-gray-400 font-normal ml-1">
                    ({member.name})
                  </span>
                )}
              </span>

              {isChecked && showShare && (
                <span className="text-xs text-blue-600 font-semibold ml-2 flex-shrink-0">
                  {formatCurrency(shareAmount)}
                </span>
              )}
            </div>
          </label>
        );
      })}

      {members.length === 0 && (
        <p className="text-sm text-gray-400 italic py-2">
          No members found. Add members first.
        </p>
      )}
    </div>
  );
}
