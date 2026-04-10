// ---------------------------------------------------------------------------
// App-wide constants
// ---------------------------------------------------------------------------

/** Display currency for formatting amounts */
export const CURRENCY = "PKR" as const;

/** App name shown in the UI */
export const APP_NAME = "ExpenseMate" as const;

/** Supabase table names — avoids magic strings scattered across services */
export const TABLES = {
  GROUPS: "groups",
  MEMBERS: "members",
  EXPENSES: "expenses",
  EXPENSE_PARTICIPANTS: "expense_participants",
  SETTLEMENTS: "settlements",
  COVER_BILLS: "cover_bills",
} as const;

/** Supabase view names */
export const VIEWS = {
  MEMBER_BALANCES: "member_balances",
} as const;
