-- PlayLink: dedicated project only. Execute once in the Supabase SQL editor.
create table public.profiles(id uuid primary key references auth.users on delete cascade, name text not null default 'Sportif', city text not null default '', sports jsonb not null default '{}'::jsonb, availability text not null default '', bio text not null default '');
create table public.moderators(user_id uuid primary key references public.profiles on delete cascade);
create table public.friendships(id uuid primary key default gen_random_uuid(), sender uuid not null references public.profiles, receiver uuid not null references public.profiles, status text not null default 'pending' check(status in ('pending','accepted')), created_at timestamptz default now(), check(sender<>receiver));
create unique index one_friendship on public.friendships(least(sender,receiver),greatest(sender,receiver));
create table public.blocks(actor uuid references public.profiles, target uuid references public.profiles, primary key(actor,target), check(actor<>target));
create table public.groups(id uuid primary key default gen_random_uuid(), owner uuid not null references public.profiles, name text not null, sport text not null, description text not null default '');
create table public.group_members(group_id uuid references public.groups on delete cascade, user_id uuid references public.profiles, primary key(group_id,user_id));
create table public.events(id uuid primary key default gen_random_uuid(), organizer_id uuid not null references public.profiles, title text not null, sport text not null, starts_at timestamptz not null, location text not null, city text not null, lat double precision not null, lng double precision not null, level text not null, capacity integer not null check(capacity between 2 and 200), join_mode text not null check(join_mode in ('instant','approval')), visibility text not null check(visibility in ('public','friends','group')), group_id uuid references public.groups, description text not null default '', details jsonb not null default '{}'::jsonb, series_id uuid, cancelled boolean not null default false, created_at timestamptz default now());
create table public.participations(event_id uuid references public.events on delete cascade, user_id uuid references public.profiles, status text not null check(status in ('accepted','pending','waitlisted','cancelled','rejected')), confirmed boolean not null default false, created_at timestamptz not null default now(), primary key(event_id,user_id));
create table public.messages(id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade, author uuid not null references public.profiles, body text not null check(char_length(body) between 1 and 2000), created_at timestamptz not null default now());
create table public.invitations(id uuid primary key default gen_random_uuid(), sender uuid not null references public.profiles, receiver uuid not null references public.profiles, event_id uuid references public.events on delete cascade, group_id uuid references public.groups on delete cascade, status text not null default 'pending' check(status in ('pending','accepted','declined')), created_at timestamptz default now(), check((event_id is null)<>(group_id is null)));
create unique index unique_event_invite on public.invitations(event_id,receiver) where event_id is not null;
create unique index unique_group_invite on public.invitations(group_id,receiver) where group_id is not null;
create table public.reports(id uuid primary key default gen_random_uuid(), reporter uuid not null references public.profiles, event_id uuid references public.events, target uuid references public.profiles, reason text not null check(char_length(reason) between 5 and 1000), status text not null default 'open' check(status in ('open','resolved')), created_at timestamptz default now(), check((event_id is null)<>(target is null)));
create table public.notifications(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles, body text not null, event_id uuid references public.events on delete cascade, created_at timestamptz default now(), seen boolean not null default false);
create index participation_queue on public.participations(event_id,status,created_at);
create index event_date on public.events(starts_at);

create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'name',''),'Sportif'),60)); return new; end $$;
create trigger create_profile after insert on auth.users for each row execute function public.new_profile();
create function public.is_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from blocks where (actor=a and target=b) or (actor=b and target=a)) $$;
create function public.are_friends(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from friendships where status='accepted' and ((sender=a and receiver=b) or (sender=b and receiver=a))) and not is_blocked(a,b) $$;
create function public.in_group(g uuid,u uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from group_members where group_id=g and user_id=u) $$;
create function public.is_moderator() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from moderators where user_id=auth.uid()) $$;
create function public.can_view(eid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from events e where e.id=eid and (e.organizer_id=auth.uid() or (not is_blocked(e.organizer_id,auth.uid()) and (e.visibility='public' or (e.visibility='friends' and are_friends(e.organizer_id,auth.uid())) or (e.visibility='group' and in_group(e.group_id,auth.uid())) or exists(select 1 from participations p where p.event_id=e.id and p.user_id=auth.uid() and p.status='accepted'))))) $$;
create function public.can_chat(eid uuid) returns boolean language sql stable security definer set search_path=public as $$ select can_view(eid) and exists(select 1 from participations where event_id=eid and user_id=auth.uid() and status='accepted') $$;

alter table profiles enable row level security; alter table moderators enable row level security; alter table friendships enable row level security; alter table blocks enable row level security; alter table groups enable row level security; alter table group_members enable row level security; alter table events enable row level security; alter table participations enable row level security; alter table messages enable row level security; alter table invitations enable row level security; alter table reports enable row level security; alter table notifications enable row level security;
create policy read_profiles on profiles for select to authenticated using(not is_blocked(id,auth.uid()));
create policy read_mod on moderators for select to authenticated using(user_id=auth.uid());
create policy read_friends on friendships for select to authenticated using(sender=auth.uid() or receiver=auth.uid());
create policy read_blocks on blocks for select to authenticated using(actor=auth.uid());
create policy read_groups on groups for select to authenticated using(in_group(id,auth.uid()) or exists(select 1 from invitations i where i.group_id=groups.id and i.receiver=auth.uid()));
create policy read_members on group_members for select to authenticated using(in_group(group_id,auth.uid()));
create policy read_events on events for select to anon,authenticated using(can_view(id) or is_moderator());
create policy read_participations on participations for select to anon,authenticated using(can_view(event_id));
create policy read_messages on messages for select to authenticated using(can_chat(event_id) and not is_blocked(author,auth.uid()));
create policy read_invites on invitations for select to authenticated using(sender=auth.uid() or receiver=auth.uid());
create policy read_reports on reports for select to authenticated using(reporter=auth.uid() or is_moderator());
create policy read_notifications on notifications for select to authenticated using(user_id=auth.uid());
revoke all on profiles,moderators,friendships,blocks,groups,group_members,events,participations,messages,invitations,reports,notifications from anon,authenticated;
grant select on events,participations to anon;
grant select on profiles,moderators,friendships,blocks,groups,group_members,events,participations,messages,invitations,reports,notifications to authenticated;

create function public.snapshot() returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('profiles',(select coalesce(jsonb_agg(p),'[]') from profiles p),'friendships',(select coalesce(jsonb_agg(f),'[]') from friendships f),'blocks',(select coalesce(jsonb_agg(b),'[]') from blocks b),'groups',(select coalesce(jsonb_agg(g),'[]') from groups g),'members',(select coalesce(jsonb_agg(m),'[]') from group_members m),'events',(select coalesce(jsonb_agg(e order by starts_at),'[]') from events e),'participations',(select coalesce(jsonb_agg(p),'[]') from participations p),'messages',(select coalesce(jsonb_agg(m order by created_at),'[]') from messages m),'invitations',(select coalesce(jsonb_agg(i),'[]') from invitations i),'reports',(select coalesce(jsonb_agg(r),'[]') from reports r),'notifications',(select coalesce(jsonb_agg(n order by created_at desc),'[]') from notifications n),'moderator',is_moderator())
$$;
revoke execute on function public.snapshot() from public,anon;
grant execute on function public.snapshot() to authenticated;

create function public.playlink_action(action text, data jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); eid uuid; target_id uuid; gid uuid; e events; p participations; inv invitations; result_id uuid; count_now integer; copies integer; i integer; series uuid:=gen_random_uuid(); new_status text; start_date timestamptz;
begin
 if u is null then raise exception 'Connecte-toi pour continuer.'; end if;
 target_id:=nullif(data->>'user_id','')::uuid; eid:=nullif(data->>'event_id','')::uuid; gid:=nullif(data->>'group_id','')::uuid;
 if action='profile' then
   if length(trim(data->>'name')) not between 2 and 60 then raise exception 'Le nom doit contenir entre 2 et 60 caractères.'; end if;
   update profiles set name=trim(data->>'name'),city=left(coalesce(data->>'city',''),100),sports=coalesce(data->'sports','{}'),availability=left(coalesce(data->>'availability',''),500),bio=left(coalesce(data->>'bio',''),1000) where id=u;
 elsif action='friend_request' then
   if target_id=u or is_blocked(u,target_id) then raise exception 'Demande impossible.'; end if;
   insert into friendships(sender,receiver) values(u,target_id) on conflict do nothing;
 elsif action='friend_accept' then
   update friendships set status='accepted' where sender=target_id and receiver=u and not is_blocked(u,target_id);
 elsif action in ('friend_remove','friend_decline') then
   delete from friendships where (sender=u and receiver=target_id) or (receiver=u and sender=target_id);
 elsif action='block' then
   insert into blocks values(u,target_id) on conflict do nothing;
   delete from friendships where (sender=u and receiver=target_id) or (sender=target_id and receiver=u);
 elsif action='unblock' then delete from blocks where actor=u and target=target_id;
 elsif action='group_create' then
   if length(trim(data->>'name')) not between 2 and 80 then raise exception 'Nom de groupe invalide.'; end if;
   insert into groups(owner,name,sport,description) values(u,trim(data->>'name'),left(data->>'sport',40),left(coalesce(data->>'description',''),1000)) returning id into result_id;
   insert into group_members values(result_id,u);
 elsif action='group_leave' then
   if exists(select 1 from groups where id=gid and owner=u) then raise exception 'Le créateur doit rester membre du groupe.'; end if;
   delete from group_members where group_id=gid and user_id=u;
 elsif action='create_event' then
   start_date:=(data->>'starts_at')::timestamptz;
   if start_date<=now() or length(trim(data->>'title')) not between 3 and 120 or length(trim(data->>'location'))<2 or abs((data->>'lat')::float)>90 or abs((data->>'lng')::float)>180 then raise exception 'Vérifie le titre, le lieu et la date.'; end if;
   if data->>'visibility'='group' and not in_group(gid,u) then raise exception 'Choisis un de tes groupes.'; end if;
   copies:=least(12,greatest(1,coalesce((data->>'occurrences')::integer,1)));
   for i in 0..copies-1 loop
     insert into events(organizer_id,title,sport,starts_at,location,city,lat,lng,level,capacity,join_mode,visibility,group_id,description,details,series_id)
     values(u,trim(data->>'title'),left(data->>'sport',40),start_date+i*interval '7 days',left(data->>'location',200),left(data->>'city',100),(data->>'lat')::float,(data->>'lng')::float,left(data->>'level',80),(data->>'capacity')::integer,data->>'join_mode',data->>'visibility',case when data->>'visibility'='group' then gid else null end,left(coalesce(data->>'description',''),2000),coalesce(data->'details','{}'),case when copies>1 then series else null end) returning id into result_id;
     insert into participations(event_id,user_id,status,confirmed) values(result_id,u,'accepted',true);
   end loop;
 elsif action='invite' then
   if not are_friends(u,target_id) then raise exception 'Tu peux inviter uniquement tes amis.'; end if;
   if eid is not null then
     select * into e from events where id=eid;
     if e.organizer_id<>u or e.cancelled or e.starts_at<=now() then raise exception 'Invitation impossible.'; end if;
     if e.visibility='group' and not in_group(e.group_id,target_id) then raise exception 'Invite cette personne dans le groupe avant la session.'; end if;
   elsif not exists(select 1 from groups where id=gid and owner=u) then raise exception 'Seul le créateur du groupe peut inviter.'; end if;
   insert into invitations(sender,receiver,event_id,group_id) values(u,target_id,eid,gid) on conflict do nothing;
 elsif action in ('invite_accept','invite_decline') then
   select * into inv from invitations where id=(data->>'id')::uuid and receiver=u for update;
   if inv.id is null or inv.status<>'pending' or is_blocked(u,inv.sender) then raise exception 'Invitation indisponible.'; end if;
   if action='invite_accept' and inv.group_id is not null then insert into group_members values(inv.group_id,u) on conflict do nothing; end if;
   if action='invite_accept' and inv.event_id is not null then perform playlink_action('join',jsonb_build_object('event_id',inv.event_id)); end if;
   update invitations set status=case when action='invite_accept' then 'accepted' else 'declined' end where id=inv.id;
 elsif action in ('join','leave','approve','reject','confirm','cancel_event','remove_participant') then
   select * into e from events where id=eid for update;
   if e.id is null or not can_view(eid) then raise exception 'Événement indisponible.'; end if;
   if action<>'leave' and (e.cancelled or e.starts_at<=now()) then raise exception 'Cet événement est terminé ou annulé.'; end if;
   select count(*) into count_now from participations where event_id=eid and status='accepted';
   if action='join' then
     if exists(select 1 from participations where event_id=eid and user_id=u and status in ('accepted','pending','waitlisted')) then return jsonb_build_object('ok',true); end if;
     new_status:=case when count_now>=e.capacity then 'waitlisted' when e.join_mode='approval' then 'pending' else 'accepted' end;
     insert into participations(event_id,user_id,status) values(eid,u,new_status) on conflict(event_id,user_id) do update set status=excluded.status,confirmed=false,created_at=now();
   elsif action in ('approve','reject','remove_participant') then
     if e.organizer_id<>u or target_id=u then raise exception 'Action réservée à l’organisateur.'; end if;
     if not exists(select 1 from participations where event_id=eid and user_id=target_id and status in ('pending','waitlisted','accepted')) then raise exception 'Participation introuvable.'; end if;
     if action='approve' and exists(select 1 from participations where event_id=eid and user_id=target_id and status='accepted') then return jsonb_build_object('ok',true); end if;
     if action='approve' and is_blocked(u,target_id) then raise exception 'Utilisateur bloqué.'; end if;
     new_status:=case when action='approve' then case when count_now<e.capacity then 'accepted' else 'waitlisted' end else 'rejected' end;
     update participations set status=new_status where event_id=eid and user_id=target_id;
     insert into notifications(user_id,body,event_id) values(target_id,case new_status when 'accepted' then 'Ta participation est acceptée.' when 'waitlisted' then 'Tu es sur liste d’attente.' else 'Ta participation a été refusée ou retirée.' end,eid);
   elsif action='leave' then
     if e.organizer_id=u then raise exception 'L’organisateur peut annuler la session.'; end if;
     update participations set status='cancelled',confirmed=false where event_id=eid and user_id=u;
   elsif action='confirm' then update participations set confirmed=true where event_id=eid and user_id=u and status='accepted';
   elsif action='cancel_event' then
     if e.organizer_id<>u then raise exception 'Action réservée à l’organisateur.'; end if;
     update events set cancelled=true where id=eid;
     insert into notifications(user_id,body,event_id) select user_id,'L’organisateur a annulé la session.',eid from participations where event_id=eid and status in ('accepted','pending','waitlisted') and user_id<>u;
   end if;
   if action in ('leave','reject','remove_participant') and not e.cancelled and e.starts_at>now() then
     select count(*) into count_now from participations where event_id=eid and status='accepted';
     if count_now<e.capacity then
       select * into p from participations where event_id=eid and status='waitlisted' and not is_blocked(user_id,e.organizer_id) order by created_at limit 1;
       if p.user_id is not null then
         new_status:=case when e.join_mode='instant' then 'accepted' else 'pending' end;
         update participations set status=new_status where event_id=eid and user_id=p.user_id;
         insert into notifications(user_id,body,event_id) values(p.user_id,case when new_status='accepted' then 'Une place s’est libérée : tu es inscrit !' else 'Une place s’est libérée : ta demande attend la validation.' end,eid);
       end if;
     end if;
   end if;
 elsif action='message' then
   if not can_chat(eid) or exists(select 1 from events where id=eid and cancelled) then raise exception 'Discussion réservée aux participants acceptés.'; end if;
   insert into messages(event_id,author,body) values(eid,u,trim(data->>'body'));
 elsif action='report' then
   if eid is not null and not can_view(eid) then raise exception 'Événement indisponible.'; end if;
   insert into reports(reporter,event_id,target,reason) values(u,eid,target_id,trim(data->>'reason'));
 elsif action='resolve_report' then
   if not is_moderator() then raise exception 'Accès réservé à la modération.'; end if;
   update reports set status='resolved' where id=(data->>'id')::uuid;
 elsif action='moderate_event' then
   if not is_moderator() then raise exception 'Accès réservé à la modération.'; end if;
   update events set cancelled=true where id=eid;
 elsif action='read_notifications' then update notifications set seen=true where user_id=u;
 else raise exception 'Action inconnue.';
 end if;
 return jsonb_build_object('ok',true,'id',result_id);
end $$;
revoke execute on function public.playlink_action(text,jsonb) from public,anon;
grant execute on function public.playlink_action(text,jsonb) to authenticated;
-- Grant a trusted moderator manually after their first signup:
-- insert into public.moderators(user_id) values ('AUTH_USER_UUID');
