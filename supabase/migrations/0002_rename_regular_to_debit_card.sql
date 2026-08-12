-- Run this in the Supabase SQL editor if you already ran the original schema.sql.
-- Renames the "regular" category to "debit_card" (existing rows + constraint).

update public.expenses set category = 'debit_card' where category = 'regular';

alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category in ('credit_card', 'debit_card'));
