-- =============================================================================
-- SplitEase — Row Level Security (RLS) Policies
--
-- IMPORTANT: Run this in your Supabase SQL Editor BEFORE sharing the app
-- with anyone or making the URL public.
--
-- WHY THIS MATTERS:
--   The Supabase anon key is embedded in your frontend JavaScript and is
--   visible to anyone who opens browser DevTools. Without RLS, anyone who
--   finds your key can read or delete all your data directly via the API.
--
-- CURRENT APPROACH (no auth yet):
--   Since the app has no login system, these policies allow ALL operations
--   from any browser. This is still better than nothing because:
--     1. It establishes the RLS framework (ready for auth later)
--     2. You can tighten policies to specific IPs if needed
--     3. It prevents accidental data exposure from other projects sharing
--        the same Supabase account
--
-- FUTURE APPROACH (when you add auth):
--   Replace "to anon" policies with "to authenticated" and add
--   "using (auth.uid() = ...)" clauses to lock data per user/group.
-- =============================================================================

-- ── Enable RLS on every table ─────────────────────────────────────────────────
-- (RLS is OFF by default — you must turn it on per table)

alter table groups               enable row level security;
alter table cover_bills          enable row level security;
alter table members              enable row level security;
alter table expenses             enable row level security;
alter table expense_participants enable row level security;
alter table settlements          enable row level security;


-- =============================================================================
-- TEMPORARY OPEN POLICIES (no auth)
-- These allow full read/write from the browser via the anon key.
-- Replace these with restrictive policies once you add authentication.
-- =============================================================================

-- ── groups ────────────────────────────────────────────────────────────────────
create policy "anon can read groups"
  on groups for select to anon using (true);

create policy "anon can insert groups"
  on groups for insert to anon with check (true);

create policy "anon can update groups"
  on groups for update to anon using (true);

create policy "anon can delete groups"
  on groups for delete to anon using (true);


-- ── members ───────────────────────────────────────────────────────────────────
create policy "anon can read members"
  on members for select to anon using (true);

create policy "anon can insert members"
  on members for insert to anon with check (true);

create policy "anon can update members"
  on members for update to anon using (true);

create policy "anon can delete members"
  on members for delete to anon using (true);


-- ── expenses ──────────────────────────────────────────────────────────────────
create policy "anon can read expenses"
  on expenses for select to anon using (true);

create policy "anon can insert expenses"
  on expenses for insert to anon with check (true);

create policy "anon can update expenses"
  on expenses for update to anon using (true);

create policy "anon can delete expenses"
  on expenses for delete to anon using (true);


-- ── expense_participants ──────────────────────────────────────────────────────
create policy "anon can read expense_participants"
  on expense_participants for select to anon using (true);

create policy "anon can insert expense_participants"
  on expense_participants for insert to anon with check (true);

create policy "anon can update expense_participants"
  on expense_participants for update to anon using (true);

create policy "anon can delete expense_participants"
  on expense_participants for delete to anon using (true);


-- ── cover_bills ──────────────────────────────────────────────────────────────
create policy "anon can read cover_bills"
  on cover_bills for select to anon using (true);

create policy "anon can insert cover_bills"
  on cover_bills for insert to anon with check (true);

create policy "anon can update cover_bills"
  on cover_bills for update to anon using (true);

create policy "anon can delete cover_bills"
  on cover_bills for delete to anon using (true);


-- ── settlements ───────────────────────────────────────────────────────────────
create policy "anon can read settlements"
  on settlements for select to anon using (true);

create policy "anon can insert settlements"
  on settlements for insert to anon with check (true);

create policy "anon can update settlements"
  on settlements for update to anon using (true);

create policy "anon can delete settlements"
  on settlements for delete to anon using (true);


-- =============================================================================
-- VERIFICATION
-- After running, confirm RLS is on:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public';
-- All tables should show rowsecurity = true.
-- =============================================================================
