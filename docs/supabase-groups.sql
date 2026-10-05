create table if not exists public.group_messages (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.groups on delete cascade,
 author uuid not null references public.profiles on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists group_messages_by_date on public.group_messages(group_id,created_at);
alter table public.group_messages enable row level security;
revoke all on public.group_messages from anon,authenticated;
grant select,insert on public.group_messages to authenticated;
create policy group_messages_read on public.group_messages for select to authenticated
 using(public.in_group(group_id,auth.uid()));
create policy group_messages_send on public.group_messages for insert to authenticated
 with check(author=auth.uid() and public.in_group(group_id,auth.uid()));
