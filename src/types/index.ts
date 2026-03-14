// ---------------------------------------------------------------------------
// Database row types — mirror the Postgres table columns exactly
// ---------------------------------------------------------------------------

/** Row in the `groups` table */
export interface Group {
  id: string;                  // uuid
  name: string;                // e.g. "Room 4 Hostel", "Flat B"
  description: string | null;  // optional longer description
  invite_code: string | null;  // future: invite-link token
  created_at: string;          // ISO 8601 timestamptz
}

/** Row in the `members` table */
export interface Member {
  id: string;               // uuid
  group_id: string | null;  // FK → groups.id   (nullable during v1→v2 migration)
  name: string;             // full display name
  nickname: string | null;  // optional short name used in the UI
  email: string | null;     // optional contact email
  created_at: string;       // ISO 8601 timestamptz
}

/** Row in the `expenses` table */
export interface Expense {
  id: string;          // uuid
  group_id: string | null;  // FK → groups.id   (nullable during v1→v2 migration)
  title: string;       // e.g. "Groceries", "Electricity bill"
  amount: number;      // total amount paid — stored as numeric(10,2)
  paid_by: string;     // FK → members.id
  date: string;        // ISO date string  e.g. "2026-03-14"
  note: string | null; // optional free-text note
  created_at: string;  // ISO 8601 timestamptz
}

/**
 * Row in the `settlements` table.
 * Records a direct cash payment from one member to another.
 * This is NOT an expense — it is a balance repayment.
 */
export interface Settlement {
  id: string;                // uuid
  group_id: string | null;   // FK → groups.id  (nullable during v1→v2 migration)
  paid_by: string;           // FK → members.id  — who handed over the cash
  paid_to: string;           // FK → members.id  — who received the cash
  amount: number;            // always positive
  date: string;              // ISO date string "YYYY-MM-DD"
  note: string | null;       // optional description, e.g. "via bKash"
  created_at: string;        // ISO 8601 timestamptz
}

/**
 * Row in the `cover_bills` table.
 *
 * A "cover bill" is a balance transfer — NOT a cash payment.
 * The helper (positive balance) absorbs part of the beneficiary's (negative balance) debt
 * by transferring their own credit. No money physically moves.
 *
 * Effect on balances:
 *   helper.balance      -= amount   (credit consumed)
 *   beneficiary.balance += amount   (debt reduced)
 *
 * Contrast with Settlement (cash physically moves from debtor to creditor):
 *   Settlement:  Khan G hands ₨500 cash to Aizaz
 *   Cover bill:  Aizaz transfers ₨500 of his credit to Khan G (no cash)
 */
export interface CoverBill {
  id: string;                // uuid
  group_id: string | null;   // FK → groups.id  (nullable during v1→v2 migration)
  helper_id: string;         // FK → members.id — the positive-balance member covering the debt
  beneficiary_id: string;    // FK → members.id — the negative-balance member receiving help
  amount: number;            // always positive
  date: string;              // ISO date string "YYYY-MM-DD"
  note: string | null;       // optional description, e.g. "covering March electricity for Khan G"
  created_at: string;        // ISO 8601 timestamptz
}

/** Row in the `expense_participants` table */
export interface ExpenseParticipant {
  id: string;           // uuid
  expense_id: string;   // FK → expenses.id
  member_id: string;    // FK → members.id
  share_amount: number; // pre-computed equal share stored at insert time
  created_at: string;   // ISO 8601 timestamptz
}

// ---------------------------------------------------------------------------
// Joined / enriched types — used in the UI after fetching with relations
// ---------------------------------------------------------------------------

/**
 * Slim member shape embedded inside a nested Supabase select.
 * We only ask for these three columns on joins to keep the payload small.
 */
export interface MemberSlim {
  id: string;
  name: string;
  nickname: string | null;
}

/**
 * One row from expense_participants with the member details nested in.
 * This is what Supabase returns when you do:
 *   expense_participants( id, share_amount, member:members!member_id(id, name, nickname) )
 */
export interface ParticipantWithMember {
  id: string;
  share_amount: number;
  member: MemberSlim;
}

/**
 * An expense row fully joined for display on the listing page.
 * Returned by getExpensesWithDetails() in expenseService.ts.
 */
export interface ExpenseListItem extends Expense {
  payer: MemberSlim;                             // joined via paid_by FK
  expense_participants: ParticipantWithMember[];  // nested join
}

/**
 * Per-member balance summary — computed, never stored.
 *
 * Formula:
 *   balance = (total_paid + total_settlements_made)
 *           - (total_owed + total_settlements_received)
 *
 *   balance > 0  → others owe this member  (creditor)
 *   balance < 0  → this member owes others (debtor)
 *   balance = 0  → fully settled
 *
 * Settlements are zero-sum: sum of all balances across all members = 0 always.
 */
/**
 * Per-member balance summary — computed, never stored.
 *
 * Formula:
 *   balance = (total_paid + total_settlements_made    + total_cover_bills_received)
 *           - (total_owed + total_settlements_received + total_cover_bills_given)
 *
 *   balance > 0  → others owe this member  (creditor)
 *   balance < 0  → this member owes others (debtor)
 *   balance = 0  → fully settled
 *
 * All three transaction types are zero-sum: sum of all balances = 0 always.
 */
export interface MemberBalance {
  member: Member;
  total_paid: number;                   // SUM of expenses paid by this member
  total_owed: number;                   // SUM of expense shares owed by this member
  total_settlements_made: number;       // SUM of cash this member paid to others
  total_settlements_received: number;   // SUM of cash others paid to this member
  total_cover_bills_given: number;      // SUM of credit this member transferred to others (no cash)
  total_cover_bills_received: number;   // SUM of credit others transferred to this member (no cash)
  balance: number;
}

// ---------------------------------------------------------------------------
// Form / input types — used when creating new records
// ---------------------------------------------------------------------------

export interface NewGroupInput {
  name: string;
  description?: string;
}

export interface NewMemberInput {
  name: string;
  nickname?: string;
  email?: string;
  /** Required in v2 multi-group mode. Omit only in single-group (v1) mode. */
  group_id?: string;
}

export interface NewExpenseInput {
  title: string;
  amount: number;
  paid_by: string;           // member id
  date: string;              // "YYYY-MM-DD"
  note?: string;
  participant_ids: string[]; // member ids to split among
  /** Required in v2 multi-group mode. Omit only in single-group (v1) mode. */
  group_id?: string;
}

/** Same shape as NewExpenseInput — kept as a named alias for clarity at call sites */
export type UpdateExpenseInput = NewExpenseInput;

export interface NewSettlementInput {
  paid_by: string;   // member id — who paid cash
  paid_to: string;   // member id — who received cash
  amount: number;
  date: string;      // "YYYY-MM-DD"
  note?: string;
  group_id?: string; // required in v2 multi-group mode
}

export interface NewCoverBillInput {
  helper_id: string;      // member id — positive-balance member giving their credit
  beneficiary_id: string; // member id — negative-balance member receiving debt relief
  amount: number;
  date: string;           // "YYYY-MM-DD"
  note?: string;
  group_id?: string;      // required in v2 multi-group mode
}
