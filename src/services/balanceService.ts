import { supabase } from "@/lib/supabase";
import { TABLES } from "@/lib/constants";
import { calculateMemberBalances } from "@/lib/calculations";
import type { Member, Expense, ExpenseParticipant, Settlement, MemberBalance } from "@/types";

/**
 * Fetch all four tables needed for balance calculation in parallel,
 * then pass them through the pure calculation layer.
 *
 * Four parallel requests are faster than serial fetches, and because
 * the calculation is pure JavaScript (no further DB calls), the result is
 * consistent for the data snapshot returned.
 *
 * Returns one MemberBalance entry per member, sorted by balance descending
 * (biggest creditor first).
 */
export async function fetchMemberBalances(): Promise<MemberBalance[]> {
  // ── Fire all four fetches at the same time ───────────────────────────────
  const [membersResult, expensesResult, participantsResult, settlementsResult] =
    await Promise.all([
      supabase
        .from(TABLES.MEMBERS)
        .select("id, name, nickname, email, created_at")
        .order("created_at", { ascending: true }),

      supabase
        .from(TABLES.EXPENSES)
        .select("id, title, amount, paid_by, date, note, created_at"),

      supabase
        .from(TABLES.EXPENSE_PARTICIPANTS)
        .select("id, expense_id, member_id, share_amount, created_at"),

      supabase
        .from(TABLES.SETTLEMENTS)
        .select("id, paid_by, paid_to, amount, date, note, created_at"),
    ]);

  // ── Surface any error from any of the four requests ──────────────────────
  if (membersResult.error)     throw new Error(membersResult.error.message);
  if (expensesResult.error)    throw new Error(expensesResult.error.message);
  if (participantsResult.error) throw new Error(participantsResult.error.message);
  if (settlementsResult.error)  throw new Error(settlementsResult.error.message);

  const members      = (membersResult.data      ?? []) as Member[];
  const expenses     = (expensesResult.data     ?? []) as Expense[];
  const participants = (participantsResult.data  ?? []) as ExpenseParticipant[];
  const settlements  = (settlementsResult.data   ?? []) as Settlement[];

  // ── Hand off to pure calculation — no DB knowledge past this line ────────
  return calculateMemberBalances(members, expenses, participants, settlements);
}
