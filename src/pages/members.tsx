import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import MemberForm from "@/components/members/MemberForm";
import MemberList from "@/components/members/MemberList";
import { getMembers, addMember, deleteMember } from "@/services/memberService";
import type { Member, NewMemberInput } from "@/types";

export default function MembersPage() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [members,     setMembers]     = useState<Member[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);   // initial fetch
  const [pageError,   setPageError]   = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load members on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoadingPage(true);
    setPageError(null);
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to load members."
      );
    } finally {
      setLoadingPage(false);
    }
  }

  // -------------------------------------------------------------------------
  // Add a member — called by MemberForm on submit
  // -------------------------------------------------------------------------
  async function handleAddMember(input: NewMemberInput) {
    const newMember = await addMember(input); // throws on error — form catches it
    setMembers((prev) => [...prev, newMember]);
    setShowForm(false);
    setSuccessName(newMember.nickname ?? newMember.name);
    setTimeout(() => setSuccessName(null), 4000);
  }

  // -------------------------------------------------------------------------
  // Delete a member — called by MemberList on confirm
  // -------------------------------------------------------------------------
  async function handleDeleteMember(id: string) {
    await deleteMember(id); // throws with friendly message if FK violation
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <MainLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {members.length} member{members.length !== 1 ? "s" : ""} in the group
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Add Member</Button>
        )}
      </div>

      {/* Success banner */}
      {successName && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          <span className="flex-shrink-0">✓</span>
          <span><strong>{successName}</strong> was added to the group.</span>
        </div>
      )}

      {/* Inline add form */}
      {showForm && (
        <div className="mb-6">
          <MemberForm
            onSubmit={handleAddMember}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loadingPage && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-14 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Page-level error */}
      {!loadingPage && pageError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-600">{pageError}</p>
          <Button variant="secondary" size="sm" onClick={fetchMembers}>
            Retry
          </Button>
        </div>
      )}

      {/* Member table */}
      {!loadingPage && !pageError && (
        <MemberList members={members} onDelete={handleDeleteMember} />
      )}
    </MainLayout>
  );
}
