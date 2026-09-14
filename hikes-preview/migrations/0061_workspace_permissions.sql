-- Shared workspace writes use optimistic locking and server-side field permissions.
create or replace function private.hike_workspace_mask(a jsonb, pid text, nav boolean, gear boolean, food boolean, med boolean)
returns jsonb language plpgsql immutable set search_path='' as $$
declare b jsonb:=a; t jsonb; r jsonb; d text; ownids text[]:='{}'; obj jsonb; k text; m jsonb;
begin
 b:=b-array['current','roles','personal','checks','cars','rides'];
 b:=jsonb_set(b,'{participants}',coalesce((select jsonb_agg(case when x->>'id'=pid then x-array['name','callsign','avatarKey'] else x end order by x->>'id') from jsonb_array_elements(coalesce(a->'participants','[]')) x),'[]'));
 if b ? 'event' then b:=jsonb_set(b,'{event}',(b->'event')-array['distance','start','finish','duration']); end if;
 if nav then b:=b-'timeline'; end if;
 if gear then b:=b-array['gearV36','gearV30','shared']; else
   if b ? 'gearV36' then b:=b#-array['gearV36','status',pid]; end if;
   if b ? 'gearV30' then
     b:=b#-array['gearV30','status',pid]; b:=b#-array['gearV30','final',pid];
     if med then
       for k,m in select key,value from jsonb_each(coalesce(b#>'{gearV30,meta}','{}')) loop
         if m->>'cat'='health' then b:=jsonb_set(b,array['gearV30','meta',k],m-array['kit','type']); end if;
       end loop;
     end if;
   end if;
   b:=jsonb_set(b,'{shared}',coalesce((select jsonb_agg(jsonb_set(jsonb_set(x,'{a}',coalesce((select jsonb_agg(y order by y->>0) from jsonb_array_elements(coalesce(x->'a','[]')) y where y->>0<>pid),'[]')),'{confirmed}',coalesce((select jsonb_agg(y order by y) from jsonb_array_elements(coalesce(x->'confirmed','[]')) y where y#>>'{}'<>pid),'[]')) order by x->>'id') from jsonb_array_elements(coalesce(a->'shared','[]')) x),'[]'));
 end if;
 if b ? 'rolesV36' then
   b:=b#-array['rolesV36','skills',pid];
   obj:='{}';
   for k,m in select key,value from jsonb_each(coalesce(b#>'{rolesV36,candidates}','{}')) loop
     obj:=obj||jsonb_build_object(k,coalesce((select jsonb_agg(x order by x) from jsonb_array_elements(m) x where x#>>'{}'<>pid),'[]'));
   end loop;
   b:=jsonb_set(b,'{rolesV36,candidates}',obj);
 end if;
 if food then b:=b-array['foodV31','foodV36']; else
   b:=b#-array['foodV31','personNotes',pid];
   foreach d in array array['mealChecks','attendance'] loop
     for k,m in select key,value from jsonb_each(coalesce(b#>array['foodV31',d],'{}')) loop b:=b#-array['foodV31',d,k,pid]; end loop;
   end loop;
   if b#>'{foodV31,ingredients}' is not null then
     b:=jsonb_set(b,'{foodV31,ingredients}',coalesce((select jsonb_agg(x-'need' order by x->>'id') from jsonb_array_elements(b#>'{foodV31,ingredients}') x),'[]'));
   end if;
 end if;
 t:=b->'transportV24';
 if t is not null then
   t:=t#-array['profiles',pid];t:=jsonb_set(t,'{returnOverrides}',coalesce(t->'returnOverrides','{}')-pid);
   foreach d in array array['there','back'] loop
     select coalesce(array_agg(x->>'id'),'{}') into ownids from jsonb_array_elements(coalesce(t#>array['rides',d],'[]')) x where x->>'driver'=pid;
     obj:='{}';
     for r in select value from jsonb_array_elements(coalesce(t#>array['rides',d],'[]')) loop
       if r->>'driver'<>pid then
         r:=jsonb_set(r,'{requests}',coalesce((select jsonb_agg(x order by x->>'id') from jsonb_array_elements(coalesce(r->'requests','[]')) x where x->>'pid'<>pid),'[]'));
         r:=jsonb_set(r,'{passengers}',coalesce((select jsonb_agg(x order by x) from jsonb_array_elements(coalesce(r->'passengers','[]')) x where x#>>'{}'<>pid),'[]'));
         obj:=obj||jsonb_build_object(r->>'id',r);
       end if;
     end loop;
     t:=jsonb_set(t,array['rides',d],obj);
     t:=t#-array['choices',d];
   end loop;
   b:=jsonb_set(b,'{transportV24}',t);
 end if;
 return b;
end $$;
revoke all on function private.hike_workspace_mask(jsonb,text,boolean,boolean,boolean,boolean) from public;

create or replace function public.save_hike_workspace(p_event uuid,p_revision timestamptz,p_app jsonb,p_local jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare doc public.hike_documents%rowtype; actor uuid:=auth.uid(); pid text; admin boolean; nav boolean:=false; gear boolean:=false; food boolean:=false; med boolean:=false; oldapp jsonb; r jsonb; q jsonb; prior jsonb; d text; k text; v jsonb; seen text[]; drivers text[]; passengers text[]; n integer; linked jsonb; out_revision timestamptz;
begin
 if actor is null then raise exception 'Нужно войти в аккаунт' using errcode='42501'; end if;
 admin:=private.is_hike_admin(p_event);
 if not admin and not exists(select 1 from public.hike_members where event_id=p_event and user_id=actor and status='approved') then raise exception 'Участие ещё не подтверждено' using errcode='42501'; end if;
 select * into doc from public.hike_documents where event_id=p_event for update;
 if not found then raise exception 'Документ похода не найден'; end if;
 if p_revision is distinct from doc.updated_at then raise exception 'Поход уже изменён другим участником. Обновите страницу перед повторным действием.' using errcode='40001'; end if;
 if jsonb_typeof(p_app)<>'object' or jsonb_typeof(p_local)<>'object' or octet_length(p_app::text)>4000000 then raise exception 'Некорректные данные похода'; end if;
 oldapp:=coalesce(doc.payload->'app','{}');pid:=case when admin then 'p1' else actor::text end;
 if not admin and oldapp='{}' then raise exception 'Организатор ещё не сохранил поход'; end if;
 for r in select value from jsonb_array_elements(coalesce(oldapp#>'{rolesV36,roles}','[]')) loop
   if r->>'p'=pid then
     admin:=admin or r->>'id'='lead';
     nav:=nav or r->>'id'='nav';gear:=gear or r->>'id'='logistics';med:=med or r->>'id'='medic';
     food:=food or r->>'id'='logistics' or coalesce(r->>'manageFood'='true',false);
   end if;
 end loop;
 if not admin then
   if private.hike_workspace_mask(oldapp,pid,nav,gear,food,med) is distinct from private.hike_workspace_mask(p_app,pid,nav,gear,food,med) then raise exception 'Нет прав изменять эти данные похода' using errcode='42501'; end if;
   for k,v in select key,value from jsonb_each(p_local) loop
     if v is distinct from coalesce(doc.payload->'local','{}')->k and not (nav and k=any(array['rl_hike_route_editor_v13','rl_hike_shared_route_revision','rl_hike_atlas_v20'])) then raise exception 'Нет прав изменять настройки маршрута' using errcode='42501'; end if;
   end loop;
 end if;
 if exists(select 1 from jsonb_object_keys(p_local) x where x not like 'rl_hike_%' or x like '%auth%' or x like '%token%') then raise exception 'Недопустимый ключ данных'; end if;
 -- Never accept duplicate commitments, invalid quantities, or more than one active ride per direction.
 for r in select value from jsonb_array_elements(coalesce(p_app->'shared','[]')) loop
   seen:='{}';
   for q in select value from jsonb_array_elements(coalesce(r->'a','[]')) loop
     if q->>0=any(seen) or (q->>1)::numeric<0 or (q->>1)::numeric>100000 then raise exception 'Некорректное распределение имущества'; end if;
     seen:=array_append(seen,q->>0);
   end loop;
 end loop;
 foreach d in array array['there','back'] loop
   if not admin then
     for k,v in select key,value from jsonb_each(coalesce(p_app#>array['transportV24','choices',d],'{}')) loop
       if k<>pid and v is distinct from oldapp#>array['transportV24','choices',d,k] then
         if not exists(select 1 from jsonb_array_elements(coalesce(p_app#>array['transportV24','rides',d],'[]')||coalesce(oldapp#>array['transportV24','rides',d],'[]')) rr where rr->>'driver'=pid and (rr->>'id'=v->>'rideId' or rr->>'id'=oldapp#>>array['transportV24','choices',d,k,'rideId'])) then raise exception 'Нельзя менять выбор другого участника' using errcode='42501'; end if;
       end if;
     end loop;
   end if;
   seen:='{}';drivers:='{}';
   for r in select value from jsonb_array_elements(coalesce(p_app#>array['transportV24','rides',d],'[]')) loop
     if r->>'driver'=any(drivers) then raise exception 'Водитель уже создал поездку'; end if;
     drivers:=array_append(drivers,r->>'driver');
     if (r->>'seats')::numeric<0 or (r->>'seats')::numeric>100 or (r->>'seats')::numeric<>trunc((r->>'seats')::numeric) then raise exception 'Некорректное число мест'; end if;
     n:=0;passengers:='{}';
     for q in select value from jsonb_array_elements(coalesce(r->'requests','[]')) loop
       if not admin and q->>'pid'<>pid then
         select oq into prior from jsonb_array_elements(coalesce(oldapp#>array['transportV24','rides',d],'[]')) rr cross join lateral jsonb_array_elements(coalesce(rr->'requests','[]')) oq where rr->>'id'=r->>'id' and oq->>'id'=q->>'id' limit 1;
         if prior is null and not (d='back' and r->>'linkedTo' is not null and q->>'status'='approved') then raise exception 'Кандидатуру на поездку подаёт сам участник' using errcode='42501'; end if;
         if prior is not null and prior->>'pid' is distinct from q->>'pid' then raise exception 'Нельзя менять пассажира в заявке'; end if;
       end if;
       if q->>'status' in ('pending','approved') then
         if q->>'pid'=any(seen) or q->>'pid'=r->>'driver' then raise exception 'Участник уже выбрал другую машину'; end if;
         seen:=array_append(seen,q->>'pid');
         if not exists(select 1 from jsonb_array_elements(coalesce(r->'stops','[]')) s where s->>'id'=q->>'pickupId') then raise exception 'Точка посадки не найдена'; end if;
       end if;
       if q->>'status'='approved' then
         n:=n+1;passengers:=array_append(passengers,q->>'pid');
         if not admin then
           select oq into prior from jsonb_array_elements(coalesce(oldapp#>array['transportV24','rides',d],'[]')) rr cross join lateral jsonb_array_elements(coalesce(rr->'requests','[]')) oq where rr->>'id'=r->>'id' and oq->>'id'=q->>'id' limit 1;
           if prior->>'status' is distinct from 'approved' then
             linked:=null;
             if d='back' and r->>'linkedTo' is not null then
               select sr into linked from jsonb_array_elements(coalesce(p_app#>'{transportV24,rides,there}','[]')) sr cross join lateral jsonb_array_elements(coalesce(sr->'requests','[]')) sq where sr->>'id'=r->>'linkedTo' and sr->>'driver'=r->>'driver' and sq->>'pid'=q->>'pid' and sq->>'status'='approved' limit 1;
             end if;
             if linked is null and not (r->>'driver'=pid and prior->>'status'='pending') then raise exception 'Место подтверждает водитель' using errcode='42501'; end if;
           end if;
         end if;
       end if;
     end loop;
     if n>(r->>'seats')::integer then raise exception 'Свободных мест больше нет'; end if;
     if (select coalesce(array_agg(x order by x),'{}') from jsonb_array_elements_text(coalesce(r->'passengers','[]')) x) is distinct from (select coalesce(array_agg(x order by x),'{}') from unnest(passengers) x) then raise exception 'Список пассажиров не совпадает с подтверждениями'; end if;
   end loop;
   if drivers && seen then raise exception 'Водитель не может одновременно занять место в другой машине'; end if;
 end loop;
 update public.hike_documents set payload=jsonb_build_object('version',61,'app',p_app-'current','local',p_local),updated_by=actor where event_id=p_event returning updated_at into out_revision;
 return jsonb_build_object('updated_at',out_revision);
end $$;
revoke all on function public.save_hike_workspace(uuid,timestamptz,jsonb,jsonb) from public;
grant execute on function public.save_hike_workspace(uuid,timestamptz,jsonb,jsonb) to authenticated;
