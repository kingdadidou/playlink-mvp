begin;
create extension if not exists pg_net with schema extensions;
create table if not exists public.push_devices(token text primary key,user_id uuid not null references public.profiles on delete cascade,updated_at timestamptz not null default now());
alter table public.push_devices enable row level security;
create or replace function public.register_push(token text,enabled boolean default true) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or token is null or token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' then raise exception 'Inscription push invalide.'; end if;
 if enabled then
  insert into push_devices values(token,auth.uid(),now()) on conflict on constraint push_devices_pkey do update set user_id=auth.uid(),updated_at=now();
 else delete from push_devices where push_devices.token=register_push.token and user_id=auth.uid(); end if;
end $$;
revoke all on function public.register_push(text,boolean) from public,anon;
grant execute on function public.register_push(text,boolean) to authenticated;
create or replace function public.deliver_push() returns trigger language plpgsql security definer set search_path=public,net as $$
declare device record;
begin
 for device in select token from push_devices where user_id=new.user_id loop
  perform net.http_post(url:='https://exp.host/--/api/v2/push/send',headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('to',device.token,'title','PlayLink','body',new.body,'sound','default','data',jsonb_build_object('event_id',new.event_id)));
 end loop;
 return new;
end $$;
drop trigger if exists send_device_push on public.notifications;
create trigger send_device_push after insert on public.notifications for each row execute function public.deliver_push();
create or replace function public.invitation_notice() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,body,event_id) values(new.receiver,'Tu as reçu une invitation sur PlayLink.',new.event_id);return new;
end $$;
drop trigger if exists invitation_notice on public.invitations;
create trigger invitation_notice after insert on public.invitations for each row execute function public.invitation_notice();
create or replace function public.edit_event(data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare e events; start_date timestamptz; seats integer; latitude float; longitude float;
begin
 if auth.uid() is null then raise exception 'Connexion requise.'; end if;
 select * into e from events where id=(data->>'event_id')::uuid for update;
 if e.id is null or e.organizer_id<>auth.uid() or e.cancelled or e.starts_at<=now() then raise exception 'Modification réservée à l’organisateur d’une session à venir.'; end if;
 start_date:=(data->>'starts_at')::timestamptz;seats:=(data->>'capacity')::integer;latitude:=(data->>'lat')::float;longitude:=(data->>'lng')::float;
 if start_date is null or start_date<=now() or coalesce(length(trim(data->>'title')),0) not between 3 and 120 or coalesce(length(trim(data->>'location')),0) not between 2 and 200 or coalesce(length(trim(data->>'city')),0) not between 1 and 100 or latitude is null or longitude is null or latitude not between -90 and 90 or longitude not between -180 and 180 or seats is null or seats not between 2 and 200 then raise exception 'Vérifie les informations de la session.'; end if;
 if seats<(select count(*) from participations where event_id=e.id and status='accepted') then raise exception 'Le nombre de places ne peut pas être inférieur au nombre d’inscrits.'; end if;
 update events set title=trim(data->>'title'),starts_at=start_date,location=trim(data->>'location'),city=trim(data->>'city'),lat=latitude,lng=longitude,capacity=seats,description=left(coalesce(data->>'description',''),2000) where id=e.id;
 if row(e.starts_at,e.location,e.lat,e.lng) is distinct from row(start_date,trim(data->>'location'),latitude,longitude) then update participations set confirmed=false where event_id=e.id and user_id<>auth.uid() and status='accepted'; end if;
 insert into notifications(user_id,body,event_id) select user_id,'La session « '||trim(data->>'title')||' » a été modifiée. Vérifie le rendez-vous.',e.id from participations where event_id=e.id and user_id<>auth.uid() and status in ('accepted','pending','waitlisted');
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.edit_event(jsonb) from public,anon;
grant execute on function public.edit_event(jsonb) to authenticated;
create or replace function public.delete_my_account(confirmation text) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); item record; successor uuid;
begin
 if u is null or confirmation is distinct from 'SUPPRIMER' then raise exception 'Confirmation requise.'; end if;
 for item in select event_id from participations p join events e on e.id=p.event_id where p.user_id=u and e.organizer_id<>u and p.status in ('accepted','pending','waitlisted') loop perform playlink_action('leave',jsonb_build_object('event_id',item.event_id)); end loop;
 insert into notifications(user_id,body,event_id) select p.user_id,'Une session a été supprimée par son organisateur.',null from participations p join events e on e.id=p.event_id where e.organizer_id=u and p.user_id<>u and p.status in ('accepted','pending','waitlisted');
 delete from reports where reporter=u or target=u or event_id in(select id from events where organizer_id=u);
 delete from events where organizer_id=u;
 for item in select id from groups where owner=u loop
  select user_id into successor from group_members where group_id=item.id and user_id<>u order by user_id limit 1;
  if successor is not null then update groups set owner=successor where id=item.id;
  else update events set group_id=null,visibility='friends' where group_id=item.id;delete from invitations where group_id=item.id;delete from groups where id=item.id; end if;
 end loop;
 delete from group_members where user_id=u;
 delete from friendships where sender=u or receiver=u;
 delete from blocks where actor=u or target=u;
 delete from invitations where sender=u or receiver=u;
 delete from messages where author=u;
 delete from participations where user_id=u;
 delete from notifications where user_id=u;
 delete from auth.users where id=u;
end $$;
revoke all on function public.delete_my_account(text) from public,anon;
grant execute on function public.delete_my_account(text) to authenticated;
commit;
