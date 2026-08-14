-- Run this in the Supabase SQL editor (or via `supabase db push`) for your project.
-- Adds a budgets table for the AI assistant's budget-management feature.

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('credit_card', 'debit_card', 'overall')),
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.budgets enable row level security;

drop policy if exists "Users can view own budgets" on public.budgets;
create policy "Users can view own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own budgets" on public.budgets;
create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own budgets" on public.budgets;
create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own budgets" on public.budgets;
create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.budgets;
