-- =============================================================================
-- SplitEase — Migration: v2 → v3  (add settlements)
--
-- RUN THIS on your existing Supabase database after migration_v2_groups.sql.
-- Safe to run multiple times (all statements are idempotent).
--
-- What this does:
--   1. Creates the `settlements` table
--   2. Updates the `member_balances` view to include settlement amounts
-- =============================================================================

-- ── 1. settlements table ──────────────────────────────────────────────────────

create table if not exists settlements (
  id          uuid           primary key default gen_random_uuid(),
  group_id    uuid           references groups (id)
                               on update cascade
                               on delete restrict,
  paid_by     uuid           not null references members (id)
                               on update cascade
                               on delete restrict,
  paid_to     uuid           not null references members (id)
                               on update cascade
                               on delete restrict,
  amount      numeric(10, 2) not null check (amount > 0),
  date        date           not null default current_date,
  note        text           check (note is null or char_length(note) <= 300),
  created_at  timestamptz    not null default now(),

  constraint settlements_no_self_payment check (paid_by <> paid_to)
);

comment on table  settlements         is 'Cash payments between members to settle balance debt. Not an expense.';
comment on column settlements.paid_by is 'Member who handed over the cash.';
comment on column settlements.paid_to is 'Member who received the cash.';
comment on column settlements.amount  is 'Amount transferred, always positive.';
comment on column settlements.note    is 'Optional note, e.g. "via bKash".';

create index if not exists idx_settlements_paid_by on settlements (paid_by);
create index if not exists idx_settlements_paid_to on settlements (paid_to);
create index if not exists idx_settlements_date    on settlements (date desc);


-- ── 2. Rebuild member_balances view ──────────────────────────────────────────
-- Old view: balance = total_paid_expenses - total_owed_expenses
-- New view: balance = (paid_expenses + settlements_made)
--                   - (owed_expenses + settlements_received)

create or replace view member_balances as
select
  m.id                                                                      as member_id,
  m.name                                                                    as member_name,
  m.email,
  m.group_id,
  coalesce(sum(e.amount)       filter (where e.paid_by    = m.id), 0)      as total_paid,
  coalesce(sum(ep.share_amount), 0)                                         as total_owed,
  coalesce(sum(s_out.amount)   filter (where s_out.paid_by = m.id), 0)     as total_settlements_made,
  coalesce(sum(s_in.amount)    filter (where s_in.paid_to  = m.id), 0)     as total_settlements_received,
  (
    coalesce(sum(e.amount)      filter (where e.paid_by    = m.id), 0)
    + coalesce(sum(s_out.amount) filter (where s_out.paid_by = m.id), 0)
  ) - (
    coalesce(sum(ep.share_amount), 0)
    + coalesce(sum(s_in.amount)  filter (where s_in.paid_to  = m.id), 0)
  )                                                                         as balance
from
  members m
  left join expenses             e     on e.paid_by    = m.id
  left join expense_participants ep    on ep.member_id  = m.id
  left join settlements          s_out on s_out.paid_by = m.id
  left join settlements          s_in  on s_in.paid_to  = m.id
group by
  m.id, m.name, m.email, m.group_id;

comment on view member_balances is
  'Balance per member: (paid_expenses + settlements_made) - (owed_expenses + settlements_received).';


-- ── Verification queries ──────────────────────────────────────────────────────
-- SELECT * FROM settlements LIMIT 5;
-- SELECT member_name, total_paid, total_owed,
--        total_settlements_made, total_settlements_received, balance
-- FROM member_balances;
