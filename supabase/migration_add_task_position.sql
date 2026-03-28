-- Add display order for tasks (run once on existing databases).
alter table public.tasks
  add column if not exists position integer not null default 0;

update public.tasks t
set position = sub.rn - 1
from (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc, id asc
    ) as rn
  from public.tasks
) sub
where t.id = sub.id;

create index if not exists tasks_user_position_idx on public.tasks (user_id, position);
