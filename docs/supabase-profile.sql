begin;
alter table public.profiles add column if not exists avatar text not null default '';
create or replace function public.save_profile(data jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare photo text:=coalesce(data->>'avatar',''); sport text; level text;
begin
 if auth.uid() is null then raise exception 'Connexion requise.'; end if;
 if jsonb_typeof(data->'sports') is distinct from 'object' then raise exception 'Sports invalides.'; end if;
 if (select count(*) from jsonb_object_keys(data->'sports'))>150 then raise exception 'Trop de sports.'; end if;
 for sport,level in select key,value from jsonb_each_text(data->'sports') loop
  if length(sport) not between 1 and 100 or level is null or length(level) not between 1 and 100 then raise exception 'Sport ou niveau invalide.'; end if;
 end loop;
 if length(photo)>60000 or (photo<>'' and photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then raise exception 'Photo invalide ou trop volumineuse.'; end if;
 perform public.playlink_action('profile',data);
 update public.profiles set avatar=photo where id=auth.uid();
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.save_profile(jsonb) from public,anon;
grant execute on function public.save_profile(jsonb) to authenticated;
commit;
