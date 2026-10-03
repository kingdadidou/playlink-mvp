-- Apply after supabase.sql, including to the existing PlayLink project.
begin;
do $$
declare definition text;
begin
  select pg_get_functiondef('public.playlink_action(text,jsonb)'::regprocedure) into definition;
  definition := replace(definition, 'start_date+i*interval ''7 days''', '((start_date at time zone ''Europe/Paris'')+i*interval ''7 days'') at time zone ''Europe/Paris''');
  execute definition;
end $$;

create or replace function public.block_cleanup() returns trigger language plpgsql security definer set search_path=public as $$
declare item record; candidate uuid; next_status text;
begin
  for item in select e.id,e.organizer_id,e.capacity,e.join_mode from events e
    where not e.cancelled and e.starts_at>now() and e.organizer_id in (new.actor,new.target)
    order by e.id for update
  loop
    update participations set status='cancelled',confirmed=false
      where event_id=item.id and user_id=case when item.organizer_id=new.actor then new.target else new.actor end
      and status in ('accepted','pending','waitlisted');
    if found and (select count(*) from participations where event_id=item.id and status='accepted')<item.capacity then
      select user_id into candidate from participations where event_id=item.id and status='waitlisted'
        and not is_blocked(user_id,item.organizer_id) order by created_at,user_id limit 1;
      if candidate is not null then
        next_status:=case when item.join_mode='instant' then 'accepted' else 'pending' end;
        update participations set status=next_status where event_id=item.id and user_id=candidate;
        insert into notifications(user_id,body,event_id) values(candidate,'Une place s’est libérée. Consulte ta participation.',item.id);
      end if;
    end if;
  end loop;
  update invitations set status='declined' where status='pending' and
    ((sender=new.actor and receiver=new.target) or (sender=new.target and receiver=new.actor));
  return new;
end $$;
drop trigger if exists clean_blocked_participations on public.blocks;
create trigger clean_blocked_participations after insert on public.blocks for each row execute function public.block_cleanup();
revoke execute on function public.block_cleanup() from public,anon,authenticated;
commit;
