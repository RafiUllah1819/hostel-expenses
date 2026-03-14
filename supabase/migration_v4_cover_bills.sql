-- =============================================================================
-- SplitEase — Migration: v3 → v4  (add cover_bills)
--
-- RUN THIS after migration_v3_settlements.sql.
-- Safe to run multiple times (idempotent).
--
-- WHAT IS A COVER BILL?
--   When a member with a POSITIVE balance uses that credit to absorb
--   part of a negative-balance member's debt.
--   No cash changes hands — it is purely a balance transfer.
--
--   This is DIFFERENT from a settlement:
--     Settlement  = debtor physically hands cash to creditor
--     Cover bill  = creditor transfers their credit to the debtor
--
-- EFFECT ON BALANCES:
--   helper balance      = helper balance      - amount  (credit consumed)
--   beneficiary balance = beneficiary balance + amount  (debt reduced)
--
--   Full formula after this migration:
--     balance = (total_paid + settlements_made    + cover_bills_received)
--             - (total_owed + settlements_received + cover_bills_given)
--
-- WORKED EXAMPLE:
--   Aizaz  = +3000 (group owes him)
--   Khan G = -2000 (he owes the group)
--   Aizaz covers Khan G's ₨500
--
--   Aizaz:  (3600 + 0 + 0)  - (600 + 0 + 500) = +2500  ✓
--   Khan G: (0   + 0 + 500) - (2000 + 0)       = -1500  ✓
--   Net:    -500 + 500 = 0                              ✓ (zero-sum)
-- =============================================================================

-- ── 1. cover_bills table ─────────────────────────────────────────────────────

create table if not exists cover_bills (
  id             uuid           primary key default gen_random_uuid(),
  group_id       uuid           references groups (id)
                                  on update cascade
                                  on delete restrict,  -- nullable during v1→v2 migration
  helper_id      uuid           not null references members (id)
                                  on update cascade
                                  on delete restrict,  -- the positive-balance member
  beneficiary_id uuid           not null references members (id)
                                  on update cascade
                                  on delete restrict,  -- the negative-balance member
  amount         numeric(10, 2) not null check (amount > 0),
  date           date           not null default current_date,
  note           text           check (note is null or char_length(note) <= 300),
  created_at     timestamptz    not null default now(),

  -- A member cannot cover their own bill
  constraint cover_bills_no_self_cover check (helper_id <> beneficiary_id)
);

comment on table  cover_bills              is 'Balance transfers: helper absorbs part of beneficiary debt using their own positive balance. No cash moves.';
comment on column cover_bills.helper_id      is 'Member with positive balance who is covering the debt.';
comment on column cover_bills.beneficiary_id is 'Member with negative balance whose debt is being reduced.';
comment on column cover_bills.amount         is 'Amount of balance transferred, always positive.';
comment on column cover_bills.note           is 'Optional note, e.g. "covering March electricity for Khan G".';

create index if not exists idx_cover_bills_helper_id      on cover_bills (helper_id);
create index if not exists idx_cover_bills_beneficiary_id on cover_bills (beneficiary_id);
create index if not exists idx_cover_bills_date           on cover_bills (date desc);


-- ── 2. Rebuild member_balances view ──────────────────────────────────────────
-- Adds cover_bills_given and cover_bills_received to the balance formula.

create or replace view member_balances as
select
  m.id                                                                          as member_id,
  m.name                                                                        as member_name,
  m.email,
  m.group_id,
  -- Expense payments
  coalesce(sum(e.amount)        filter (where e.paid_by      = m.id), 0)        as total_paid,
  coalesce(sum(ep.share_amount), 0)                                             as total_owed,
  -- Cash settlements
  coalesce(sum(s_out.amount)    filter (where s_out.paid_by  = m.id), 0)        as total_settlements_made,
  coalesce(sum(s_in.amount)     filter (where s_in.paid_to   = m.id), 0)        as total_settlements_received,
  -- Cover bills (balance transfers, no cash)
  coalesce(sum(cb_out.amount)   filter (where cb_out.helper_id      = m.id), 0) as total_cover_bills_given,
  coalesce(sum(cb_in.amount)    filter (where cb_in.beneficiary_id  = m.id), 0) as total_cover_bills_received,
  -- Final balance
  (
    coalesce(sum(e.amount)      filter (where e.paid_by      = m.id), 0)
    + coalesce(sum(s_out.amount) filter (where s_out.paid_by  = m.id), 0)
    + coalesce(sum(cb_in.amount) filter (where cb_in.beneficiary_id = m.id), 0)
  ) - (
    coalesce(sum(ep.share_amount), 0)
    + coalesce(sum(s_in.amount)  filter (where s_in.paid_to   = m.id), 0)
    + coalesce(sum(cb_out.amount) filter (where cb_out.helper_id    = m.id), 0)
  )                                                                             as balance
from
  members m
  left join expenses             e      on e.paid_by           = m.id
  left join expense_participants ep     on ep.member_id         = m.id
  left join settlements          s_out  on s_out.paid_by        = m.id
  left join settlements          s_in   on s_in.paid_to         = m.id
  left join cover_bills          cb_out on cb_out.helper_id     = m.id
  left join cover_bills          cb_in  on cb_in.beneficiary_id = m.id
group by
  m.id, m.name, m.email, m.group_id;

comment on view member_balances is
  'Full balance per member including expenses, cash settlements, and cover bills (balance transfers).';


-- ── Verification ─────────────────────────────────────────────────────────────
-- SELECT * FROM cover_bills LIMIT 5;
-- SELECT member_name, total_paid, total_owed,
--        total_settlements_made, total_settlements_received,
--        total_cover_bills_given, total_cover_bills_received,
--        balance
-- FROM member_balances;
