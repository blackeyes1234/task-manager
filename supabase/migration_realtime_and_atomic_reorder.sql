-- Cross-tab/device: reliable Realtime UPDATE delivery + atomic task order.
-- Run once in the Supabase SQL editor (after schema / position migration).

-- Full row replica identity so WAL/Realtime includes all columns on UPDATE (e.g. position-only updates).
alter table public.tasks replica identity full;

-- One transaction for the whole new order (avoids other clients seeing duplicate/mixed positions mid-reorder).
create or replace function public.reorder_tasks(p_ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_ordered_ids is null then
    return;
  end if;

  update public.tasks as t
  set position = u.pos
  from (
    select id, (ord - 1)::integer as pos
    from unnest(p_ordered_ids) with ordinality as q(id, ord)
  ) as u
  where t.id = u.id
    and t.user_id = auth.uid();
end;
$$;

grant execute on function public.reorder_tasks(uuid[]) to authenticated;
