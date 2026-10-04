begin;
alter table public.profiles add column if not exists avatar text not null default '';
alter table public.profiles add column if not exists sport_details jsonb not null default '{}'::jsonb;
create or replace function public.save_profile(data jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare photo text:=coalesce(data->>'avatar',''); sport text; level text; detail_key text; detail_value jsonb; detail_sport text; detail_fields jsonb; refs jsonb;
begin
 if auth.uid() is null then raise exception 'Connexion requise.'; end if;
 if jsonb_typeof(data->'sports') is distinct from 'object' then raise exception 'Sports invalides.'; end if;
 if (select count(*) from jsonb_object_keys(data->'sports'))>150 then raise exception 'Trop de sports.'; end if;
 for sport,level in select key,value from jsonb_each_text(data->'sports') loop
  if length(sport) not between 1 and 100 or level is null or length(level) not between 1 and 100 then raise exception 'Sport ou niveau invalide.'; end if;
 end loop;
 if length(photo)>60000 or (photo<>'' and photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then raise exception 'Photo invalide ou trop volumineuse.'; end if;
 refs:=coalesce(data->'sport_details',(select sport_details from profiles where id=auth.uid()),'{}'::jsonb);
 if jsonb_typeof(refs) is distinct from 'object' or octet_length(refs::text)>60000 then raise exception 'Repères sportifs invalides.'; end if;
 for detail_sport,detail_fields in select key,value from jsonb_each(refs) loop
  if length(detail_sport)>100 or jsonb_typeof(detail_fields) is distinct from 'object' then raise exception 'Sport invalide.'; end if;
  if (select count(*) from jsonb_object_keys(detail_fields))>12 then raise exception 'Trop de repères.'; end if;
  for detail_key,detail_value in select key,value from jsonb_each(detail_fields) loop
   if length(detail_key)>100 or jsonb_typeof(detail_value)<>'string' or length(detail_value#>>'{}')>250 then raise exception 'Repère invalide.'; end if;
  end loop;
 end loop;
 perform public.playlink_action('profile',data);
 update public.profiles set avatar=photo,sport_details=refs where id=auth.uid();
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.save_profile(jsonb) from public,anon;
grant execute on function public.save_profile(jsonb) to authenticated;
commit;
