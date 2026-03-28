-- Run this if you already created `tasks` without `user_id` / RLS (one-time migration).
-- Step 1: add column (nullable first)
alter table public.tasks
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Step 2: remove rows that cannot be tied to a user (old anonymous data)
delete from public.tasks where user_id is null;

-- Step 3: require user on every row
alter table public.tasks alter column user_id set not null;

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_created_at_idx on public.tasks (user_id, created_at);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
on public.tasks
for select
to authenticated
using (auth.uid() = user_id);

create policy "tasks_insert_own"
on public.tasks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "tasks_update_own"
on public.tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks_delete_own"
on public.tasks
for delete
to authenticated
using (auth.uid() = user_id);
