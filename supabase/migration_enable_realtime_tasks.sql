-- Broadcast row changes on public.tasks so clients can subscribe (see TaskManagerApp Realtime).
-- Run once in the Supabase SQL editor. If the table is already in the publication, this errors — safe to ignore.
alter publication supabase_realtime add table public.tasks;
