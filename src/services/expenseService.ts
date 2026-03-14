import { supabase } from "@/lib/supabase";
import { TABLES } from "@/lib/constants";
import { computeShareAmount } from "@/lib/calculations";
import type {
  Expense,
  ExpenseListItem,
  ExpenseParticipant,
  NewExpenseInput,
  UpdateExpenseInput,
} from "@/types";

// ---------------------------------------------------------------------------
// Fetch all expenses with joined payer + participant data, newest date first.
//
// Supabase nested select syntax used here:
//
//   payer:members!paid_by(...)
//     → join the members table via the paid_by FK column, alias result as "payer"
//
//   expense_participants(
//     id, share_amount,
//     member:members!member_id(...)
//   )
//     → follow the FK from expense_participants.expense_id back to this expense,
//       then for each participant row also join members via member_id FK.
//
// The result shape matches ExpenseListItem in src/types/index.ts exactly.
// ---------------------------------------------------------------------------
export async function getExpensesWithDetails(): Promise<ExpenseListItem[]> {
  const { data, error } = await supabase
    .from(TABLES.EXPENSES)
    .select(`
      id,
      title,
      amount,
      paid_by,
      date,
      note,
      created_at,
      payer:members!paid_by ( id, name, nickname ),
      expense_participants (
        id,
        share_amount,
        member:members!member_id ( id, name, nickname )
      )
    `)
    // Primary sort: expense date descending (most recent first)
    // Secondary sort: created_at descending (tie-break when same date)
    .order("date",       { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Supabase types the nested result as Json internally; we cast to our type.
  // The shape is guaranteed by the select string above.
  return (data ?? []) as unknown as ExpenseListItem[];
}

// ---------------------------------------------------------------------------
// Add a new expense + its participant rows atomically.
//
// Strategy (no stored procedure needed):
//   1. Insert the expense row → get back its id.
//   2. Insert one expense_participants row per checked member.
//   3. If step 2 fails, delete the expense row so we leave no orphan behind.
// ---------------------------------------------------------------------------
export async function addExpense(input: NewExpenseInput): Promise<Expense> {
  // Compute the equal share via the central money-math helper.
  // e.g. ৳1000 ÷ 3 members = ৳333.33 each
  const shareAmount = computeShareAmount(
    input.amount,
    input.participant_ids.length
  );

  // ── Step 1: insert the expense ───────────────────────────────────────────
  const { data: expense, error: expenseError } = await supabase
    .from(TABLES.EXPENSES)
    .insert({
      title:   input.title.trim(),
      amount:  input.amount,
      paid_by: input.paid_by,
      date:    input.date,
      note:    input.note?.trim() || null,
    })
    .select()
    .single();

  if (expenseError) throw new Error(expenseError.message);
  if (!expense)     throw new Error("Insert succeeded but returned no data.");

  // ── Step 2: insert one row per participant ───────────────────────────────
  const participantRows = input.participant_ids.map((memberId) => ({
    expense_id:   expense.id,
    member_id:    memberId,
    share_amount: shareAmount,
  }));

  const { error: participantsError } = await supabase
    .from(TABLES.EXPENSE_PARTICIPANTS)
    .insert(participantRows);

  if (participantsError) {
    // Compensating action: remove the expense so there are no orphan rows
    await supabase.from(TABLES.EXPENSES).delete().eq("id", expense.id);
    throw new Error(participantsError.message);
  }

  return expense;
}

// ---------------------------------------------------------------------------
// Fetch a single expense with its participants (for the edit page).
// Returns null when the id does not exist.
// ---------------------------------------------------------------------------
export async function getExpenseById(
  id: string
): Promise<ExpenseListItem | null> {
  const { data, error } = await supabase
    .from(TABLES.EXPENSES)
    .select(`
      id, title, amount, paid_by, date, note, created_at,
      payer:members!paid_by ( id, name, nickname ),
      expense_participants (
        id, share_amount,
        member:members!member_id ( id, name, nickname )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    // PostgREST returns error code "PGRST116" when .single() finds no row
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as unknown as ExpenseListItem;
}

// ---------------------------------------------------------------------------
// Update an expense and replace its participants atomically.
//
// Strategy:
//   1. UPDATE the expense row.
//   2. Snapshot the existing participant rows so we can restore them if needed.
//   3. DELETE all existing expense_participants for this expense.
//   4. INSERT the new participant rows.
//   5. If step 4 fails → re-insert the old rows as a compensating action,
//      then re-throw so the caller knows something went wrong.
// ---------------------------------------------------------------------------
export async function updateExpense(
  id: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  const shareAmount = computeShareAmount(
    input.amount,
    input.participant_ids.length
  );

  // ── Step 1: update the expense row ──────────────────────────────────────
  const { data: expense, error: updateError } = await supabase
    .from(TABLES.EXPENSES)
    .update({
      title:   input.title.trim(),
      amount:  input.amount,
      paid_by: input.paid_by,
      date:    input.date,
      note:    input.note?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);
  if (!expense)    throw new Error("Update succeeded but returned no data.");

  // ── Step 2: snapshot existing participants before deleting ───────────────
  const { data: oldRows } = await supabase
    .from(TABLES.EXPENSE_PARTICIPANTS)
    .select("expense_id, member_id, share_amount")
    .eq("expense_id", id);

  const oldParticipants = (oldRows ?? []) as Pick<
    ExpenseParticipant,
    "expense_id" | "member_id" | "share_amount"
  >[];

  // ── Step 3: delete old participants ────────────────────────────────────
  const { error: deleteError } = await supabase
    .from(TABLES.EXPENSE_PARTICIPANTS)
    .delete()
    .eq("expense_id", id);

  if (deleteError) throw new Error(deleteError.message);

  // ── Step 4: insert new participants ────────────────────────────────────
  const newRows = input.participant_ids.map((memberId) => ({
    expense_id:   id,
    member_id:    memberId,
    share_amount: shareAmount,
  }));

  const { error: insertError } = await supabase
    .from(TABLES.EXPENSE_PARTICIPANTS)
    .insert(newRows);

  if (insertError) {
    // ── Step 5: compensating — restore old participants ──────────────────
    if (oldParticipants.length > 0) {
      await supabase.from(TABLES.EXPENSE_PARTICIPANTS).insert(oldParticipants);
    }
    throw new Error(insertError.message);
  }

  return expense;
}

// ---------------------------------------------------------------------------
// Delete an expense by id.
// The ON DELETE CASCADE on expense_participants removes splits automatically.
// ---------------------------------------------------------------------------
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.EXPENSES)
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
