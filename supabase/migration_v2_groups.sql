-- =============================================================================
-- SplitEase — Migration: v1 → v2  (single-group → multi-group ready)
--
-- RUN THIS on your existing Supabase database.
-- It is non-destructive: no existing data is deleted or broken.
--
-- Safe to run multiple times (all statements are idempotent).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- UPGRADE PLAN (3 phases)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- PHASE 1 — Add the `groups` table and a default group.
--   • Zero risk: new table, nothing touched yet.
--
-- PHASE 2 — Add nullable group_id columns to members and expenses.
--   • Nullable so current inserts (which don't pass group_id) still work.
--   • Migrate all existing rows into the default group.
--
-- PHASE 3 — (FUTURE, manual step — do NOT run yet)
--   • Once the UI is updated to always pass a group_id, run:
--       ALTER TABLE members  ALTER COLUMN group_id SET NOT NULL;
--       ALTER TABLE expenses ALTER COLUMN group_id SET NOT NULL;
--   • Only do this after verifying zero NULL rows remain.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1 — groups table
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists groups (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 1 and 100),
  description text        check (description is null or char_length(description) <= 300),
  -- invite_code reserved for a future "join by link" feature
  invite_code text        unique,
  created_at  timestamptz not null default now()
);

comment on table  groups             is 'Each group represents one hostel room / friend circle.';
comment on column groups.name        is 'Human-readable group name shown in the UI.';
comment on column groups.description is 'Optional longer description of the group.';
comment on column groups.invite_code is 'Future: unique token for invite links.';

-- Insert the default group that will own all existing data.
-- We hard-code a specific UUID so this statement is safe to run repeatedly
-- (ON CONFLICT DO NOTHING) and downstream UPDATE statements can reference it.
insert into groups (id, name, description)
values (
  '00000000-0000-0000-0000-000000000001',
  'My Hostel',
  'Default group — created automatically during v1 → v2 migration.'
)
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2 — add group_id to members and expenses
-- ─────────────────────────────────────────────────────────────────────────────

-- members.group_id
-- Nullable for now so existing application code (which does not pass group_id)
-- continues to insert rows without error.
alter table members
  add column if not exists group_id uuid
    references groups (id)
    on update cascade
    on delete restrict;   -- block group deletion if members still belong to it

comment on column members.group_id is 'The group this member belongs to. Null = legacy row from v1.';

-- Backfill: assign all existing members to the default group.
update members
set group_id = '00000000-0000-0000-0000-000000000001'
where group_id is null;

-- Index for fast "give me all members in group X" queries.
create index if not exists idx_members_group_id on members (group_id);


-- expenses.group_id
-- Same nullable + backfill pattern as members.
alter table expenses
  add column if not exists group_id uuid
    references groups (id)
    on update cascade
    on delete restrict;   -- block group deletion if it still has expenses

comment on column expenses.group_id is 'The group this expense belongs to. Null = legacy row from v1.';

update expenses
set group_id = '00000000-0000-0000-0000-000000000001'
where group_id is null;

create index if not exists idx_expenses_group_id on expenses (group_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Update the member_balances view to expose group_id
-- (The view still shows ALL members; filtering by group happens in app code.)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view member_balances as
select
  m.id                                                              as member_id,
  m.name                                                            as member_name,
  m.email,
  m.group_id,
  coalesce(sum(e.amount)      filter (where e.paid_by = m.id), 0)  as total_paid,
  coalesce(sum(ep.share_amount), 0)                                 as total_owed,
  coalesce(sum(e.amount)      filter (where e.paid_by = m.id), 0)
    - coalesce(sum(ep.share_amount), 0)                             as balance
from
  members m
  left join expenses            e  on e.paid_by   = m.id
  left join expense_participants ep on ep.member_id = m.id
group by
  m.id, m.name, m.email, m.group_id;

comment on view member_balances is
  'Balance per member (total_paid - total_owed). group_id exposed for app-layer filtering.';


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run manually after the migration to check everything)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SELECT id, name FROM groups;
-- SELECT id, name, group_id FROM members   WHERE group_id IS NULL;  -- should be 0 rows
-- SELECT id, title, group_id FROM expenses WHERE group_id IS NULL;  -- should be 0 rows
-- SELECT * FROM member_balances LIMIT 5;
--
-- =============================================================================
-- PHASE 3 — run only after UI sends group_id on every insert
-- =============================================================================
-- ALTER TABLE members  ALTER COLUMN group_id SET NOT NULL;
-- ALTER TABLE expenses ALTER COLUMN group_id SET NOT NULL;
-- =============================================================================
