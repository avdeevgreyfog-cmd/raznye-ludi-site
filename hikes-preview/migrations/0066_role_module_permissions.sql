-- V66: real module-based role permissions and additional-role confirmation.
-- Modules: participants, gear, food, transport, documents, route, plan.

create or replace function private.hike_has_module(target_event uuid, module_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_hike_admin(target_event)
  or exists (
    select 1
    from public.hike_members m
    join public.hike_documents d on d.event_id = m.event_id
    cross join lateral jsonb_array_elements(coalesce(d.payload #> '{app,roles}', '[]'::jsonb)) r
    where m.event_id = target_event
      and m.user_id = (select auth.uid())
      and m.status = 'approved'
      and r->>'p' = m.user_id::text
      and coalesce((r->>'critical')::boolean, false)
      and (
        coalesce(r->'responsibilities', '[]'::jsonb) ? module_name
        or coalesce(r->'modules', '[]'::jsonb) ? module_name
      )
  );
$$;

revoke all on function private.hike_has_module(uuid,text) from public;
grant execute on function private.hike_has_module(uuid,text) to authenticated;

create or replace function private.hike_workspace_mask_v66(
  a jsonb,
  pid text,
  participants boolean,
  plan_access boolean,
  gear boolean,
  food boolean,
  transport boolean
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  b jsonb := a;
  t jsonb;
  r jsonb;
  d text;
  obj jsonb;
  k text;
  m jsonb;
begin
  -- Never allow a delegated editor to rewrite identity, role assignments or unrelated personal state.
  b := b - array['current','personal','checks','cars','rides'];

  -- An assignee may only change acceptance on their own additional role.
  if b ? 'roles' then
    b := jsonb_set(
      b,
      '{roles}',
      coalesce((
        select jsonb_agg(
          case
            when x->>'p' = pid and not coalesce((x->>'critical')::boolean,false)
              then x - 'acceptance'
            else x
          end
          order by x->>'id'
        )
        from jsonb_array_elements(coalesce(a->'roles','[]'::jsonb)) x
      ), '[]'::jsonb)
    );
  end if;

  -- Participants permission changes only participation status in the shared workspace.
  if participants then
    b := jsonb_set(
      b,
      '{participants}',
      coalesce((
        select jsonb_agg(x - 'rsvp' order by x->>'id')
        from jsonb_array_elements(coalesce(a->'participants','[]'::jsonb)) x
      ), '[]'::jsonb)
    );
  else
    b := jsonb_set(
      b,
      '{participants}',
      coalesce((
        select jsonb_agg(
          case when x->>'id'=pid then x-array['name','callsign','avatarKey'] else x end
          order by x->>'id'
        )
        from jsonb_array_elements(coalesce(a->'participants','[]'::jsonb)) x
      ), '[]'::jsonb)
    );
  end if;

  if b ? 'event' then
    b := jsonb_set(b,'{event}',(b->'event')-array['distance','start','finish','duration']);
  end if;

  if plan_access then
    b := b - 'timeline';
  end if;

  if gear then
    b := b - array['gearV36','gearV30','shared'];
  else
    if b ? 'gearV36' then b := b #- array['gearV36','status',pid]; end if;
    if b ? 'gearV30' then
      b := b #- array['gearV30','status',pid];
      b := b #- array['gearV30','final',pid];
    end if;
    b := jsonb_set(
      b,
      '{shared}',
      coalesce((
        select jsonb_agg(
          jsonb_set(
            jsonb_set(
              x,
              '{a}',
              coalesce((
                select jsonb_agg(y order by y->>0)
                from jsonb_array_elements(coalesce(x->'a','[]'::jsonb)) y
                where y->>0<>pid
              ), '[]'::jsonb)
            ),
            '{confirmed}',
            coalesce((
              select jsonb_agg(y order by y)
              from jsonb_array_elements(coalesce(x->'confirmed','[]'::jsonb)) y
              where y#>>'{}'<>pid
            ), '[]'::jsonb)
          )
          order by x->>'id'
        )
        from jsonb_array_elements(coalesce(a->'shared','[]'::jsonb)) x
      ), '[]'::jsonb)
    );
  end if;

  -- Keep legacy candidate/skill self-service, but not role assignment changes.
  if b ? 'rolesV36' then
    b := b #- array['rolesV36','skills',pid];
    obj := '{}'::jsonb;
    for k,m in select key,value from jsonb_each(coalesce(b#>'{rolesV36,candidates}','{}'::jsonb)) loop
      obj := obj || jsonb_build_object(
        k,
        coalesce((
          select jsonb_agg(x order by x)
          from jsonb_array_elements(m) x
          where x#>>'{}'<>pid
        ), '[]'::jsonb)
      );
    end loop;
    b := jsonb_set(b,'{rolesV36,candidates}',obj);
  end if;

  if food then
    b := b - array['foodV31','foodV36'];
  else
    b := b #- array['foodV31','personNotes',pid];
    foreach d in array array['mealChecks','attendance'] loop
      for k,m in select key,value from jsonb_each(coalesce(b#>array['foodV31',d],'{}'::jsonb)) loop
        b := b #- array['foodV31',d,k,pid];
      end loop;
    end loop;
    if b#>'{foodV31,ingredients}' is not null then
      b := jsonb_set(
        b,
        '{foodV31,ingredients}',
        coalesce((
          select jsonb_agg(x-'need' order by x->>'id')
          from jsonb_array_elements(b#>'{foodV31,ingredients}') x
        ), '[]'::jsonb)
      );
    end if;
  end if;

  if transport then
    b := b - 'transportV24';
  else
    t := b->'transportV24';
    if t is not null then
      t := t #- array['profiles',pid];
      t := jsonb_set(t,'{returnOverrides}',coalesce(t->'returnOverrides','{}'::jsonb)-pid);
      foreach d in array array['there','back'] loop
        obj := '{}'::jsonb;
        for r in select value from jsonb_array_elements(coalesce(t#>array['rides',d],'[]'::jsonb)) loop
          if r->>'driver'<>pid then
            r := jsonb_set(
              r,
              '{requests}',
              coalesce((
                select jsonb_agg(x order by x->>'id')
                from jsonb_array_elements(coalesce(r->'requests','[]'::jsonb)) x
                where x->>'pid'<>pid
              ), '[]'::jsonb)
            );
            r := jsonb_set(
              r,
              '{passengers}',
              coalesce((
                select jsonb_agg(x order by x)
                from jsonb_array_elements(coalesce(r->'passengers','[]'::jsonb)) x
                where x#>>'{}'<>pid
              ), '[]'::jsonb)
            );
            obj := obj || jsonb_build_object(r->>'id',r);
          end if;
        end loop;
        t := jsonb_set(t,array['rides',d],obj);
        t := t #- array['choices',d];
      end loop;
      b := jsonb_set(b,'{transportV24}',t);
    end if;
  end if;

  return b;
end
$$;

revoke all on function private.hike_workspace_mask_v66(jsonb,text,boolean,boolean,boolean,boolean,boolean) from public;

create or replace function public.save_hike_workspace(
  p_event uuid,
  p_revision timestamptz,
  p_app jsonb,
  p_local jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  doc public.hike_documents%rowtype;
  actor uuid := auth.uid();
  pid text;
  admin boolean;
  participants_access boolean := false;
  route_access boolean := false;
  plan_access boolean := false;
  gear_access boolean := false;
  food_access boolean := false;
  transport_access boolean := false;
  oldapp jsonb;
  r jsonb;
  q jsonb;
  prior jsonb;
  d text;
  k text;
  v jsonb;
  seen text[];
  drivers text[];
  passengers text[];
  n integer;
  linked jsonb;
  out_revision timestamptz;
begin
  if actor is null then raise exception 'Нужно войти в аккаунт' using errcode='42501'; end if;
  admin := private.is_hike_admin(p_event);
  if not admin and not exists(
    select 1 from public.hike_members
    where event_id=p_event and user_id=actor and status='approved'
  ) then
    raise exception 'Участие ещё не подтверждено' using errcode='42501';
  end if;

  select * into doc from public.hike_documents where event_id=p_event for update;
  if not found then raise exception 'Документ похода не найден'; end if;
  if p_revision is distinct from doc.updated_at then
    raise exception 'Поход уже изменён другим участником. Обновите страницу перед повторным действием.' using errcode='40001';
  end if;
  if jsonb_typeof(p_app)<>'object' or jsonb_typeof(p_local)<>'object' or octet_length(p_app::text)>4000000 then
    raise exception 'Некорректные данные похода';
  end if;

  oldapp := coalesce(doc.payload->'app','{}'::jsonb);
  pid := case when admin then 'p1' else actor::text end;
  if not admin and oldapp='{}'::jsonb then raise exception 'Организатор ещё не сохранил поход'; end if;

  if not admin then
    -- New model: responsible roles carry explicit access to real modules.
    for r in select value from jsonb_array_elements(coalesce(oldapp->'roles','[]'::jsonb)) loop
      if r->>'p'=pid and coalesce((r->>'critical')::boolean,false) then
        participants_access := participants_access or coalesce(r->'responsibilities','[]'::jsonb) ? 'participants';
        route_access        := route_access        or coalesce(r->'responsibilities','[]'::jsonb) ? 'route';
        plan_access         := plan_access         or coalesce(r->'responsibilities','[]'::jsonb) ? 'plan';
        gear_access         := gear_access         or coalesce(r->'responsibilities','[]'::jsonb) ? 'gear';
        food_access         := food_access         or coalesce(r->'responsibilities','[]'::jsonb) ? 'food';
        transport_access    := transport_access    or coalesce(r->'responsibilities','[]'::jsonb) ? 'transport';
      end if;
    end loop;

    -- Compatibility until every saved workspace has the V66 role fields.
    for r in select value from jsonb_array_elements(coalesce(oldapp#>'{rolesV36,roles}','[]'::jsonb)) loop
      if r->>'p'=pid then
        route_access     := route_access or r->>'id'='nav';
        plan_access      := plan_access or r->>'id'='nav';
        gear_access      := gear_access or r->>'id'='logistics';
        food_access      := food_access or r->>'id'='logistics' or coalesce(r->>'manageFood'='true',false);
        transport_access := transport_access or r->>'id'='logistics';
      end if;
    end loop;

    if private.hike_workspace_mask_v66(oldapp,pid,participants_access,plan_access,gear_access,food_access,transport_access)
       is distinct from
       private.hike_workspace_mask_v66(p_app,pid,participants_access,plan_access,gear_access,food_access,transport_access)
    then
      raise exception 'Нет прав изменять эти данные похода' using errcode='42501';
    end if;

    for k,v in select key,value from jsonb_each(p_local) loop
      if v is distinct from coalesce(doc.payload->'local','{}'::jsonb)->k
         and not (route_access and k=any(array['rl_hike_route_editor_v13','rl_hike_shared_route_revision','rl_hike_atlas_v20']))
      then
        raise exception 'Нет прав изменять настройки маршрута' using errcode='42501';
      end if;
    end loop;
  end if;

  if exists(
    select 1 from jsonb_object_keys(p_local) x
    where x not like 'rl_hike_%' or x like '%auth%' or x like '%token%'
  ) then
    raise exception 'Недопустимый ключ данных';
  end if;

  for r in select value from jsonb_array_elements(coalesce(p_app->'shared','[]'::jsonb)) loop
    seen := '{}';
    for q in select value from jsonb_array_elements(coalesce(r->'a','[]'::jsonb)) loop
      if q->>0=any(seen) or (q->>1)::numeric<0 or (q->>1)::numeric>100000 then
        raise exception 'Некорректное распределение имущества';
      end if;
      seen := array_append(seen,q->>0);
    end loop;
  end loop;

  foreach d in array array['there','back'] loop
    if not admin and not transport_access then
      for k,v in select key,value from jsonb_each(coalesce(p_app#>array['transportV24','choices',d],'{}'::jsonb)) loop
        if k<>pid and v is distinct from oldapp#>array['transportV24','choices',d,k] then
          if not exists(
            select 1
            from jsonb_array_elements(
              coalesce(p_app#>array['transportV24','rides',d],'[]'::jsonb)
              || coalesce(oldapp#>array['transportV24','rides',d],'[]'::jsonb)
            ) rr
            where rr->>'driver'=pid
              and (rr->>'id'=v->>'rideId' or rr->>'id'=oldapp#>>array['transportV24','choices',d,k,'rideId'])
          ) then
            raise exception 'Нельзя менять выбор другого участника' using errcode='42501';
          end if;
        end if;
      end loop;
    end if;

    seen := '{}';
    drivers := '{}';
    for r in select value from jsonb_array_elements(coalesce(p_app#>array['transportV24','rides',d],'[]'::jsonb)) loop
      if r->>'driver'=any(drivers) then raise exception 'Водитель уже создал поездку'; end if;
      drivers := array_append(drivers,r->>'driver');
      if (r->>'seats')::numeric<0 or (r->>'seats')::numeric>100 or (r->>'seats')::numeric<>trunc((r->>'seats')::numeric) then
        raise exception 'Некорректное число мест';
      end if;
      n := 0;
      passengers := '{}';
      for q in select value from jsonb_array_elements(coalesce(r->'requests','[]'::jsonb)) loop
        if not admin and not transport_access and q->>'pid'<>pid then
          select oq into prior
          from jsonb_array_elements(coalesce(oldapp#>array['transportV24','rides',d],'[]'::jsonb)) rr
          cross join lateral jsonb_array_elements(coalesce(rr->'requests','[]'::jsonb)) oq
          where rr->>'id'=r->>'id' and oq->>'id'=q->>'id'
          limit 1;
          if prior is null and not (d='back' and r->>'linkedTo' is not null and q->>'status'='approved') then
            raise exception 'Кандидатуру на поездку подаёт сам участник' using errcode='42501';
          end if;
          if prior is not null and prior->>'pid' is distinct from q->>'pid' then
            raise exception 'Нельзя менять пассажира в заявке';
          end if;
        end if;

        if q->>'status' in ('pending','approved') then
          if q->>'pid'=any(seen) or q->>'pid'=r->>'driver' then
            raise exception 'Участник уже выбрал другую машину';
          end if;
          seen := array_append(seen,q->>'pid');
          if not exists(
            select 1 from jsonb_array_elements(coalesce(r->'stops','[]'::jsonb)) s
            where s->>'id'=q->>'pickupId'
          ) then
            raise exception 'Точка посадки не найдена';
          end if;
        end if;

        if q->>'status'='approved' then
          n := n+1;
          passengers := array_append(passengers,q->>'pid');
          if not admin and not transport_access then
            select oq into prior
            from jsonb_array_elements(coalesce(oldapp#>array['transportV24','rides',d],'[]'::jsonb)) rr
            cross join lateral jsonb_array_elements(coalesce(rr->'requests','[]'::jsonb)) oq
            where rr->>'id'=r->>'id' and oq->>'id'=q->>'id'
            limit 1;
            if prior->>'status' is distinct from 'approved' then
              linked := null;
              if d='back' and r->>'linkedTo' is not null then
                select sr into linked
                from jsonb_array_elements(coalesce(p_app#>'{transportV24,rides,there}','[]'::jsonb)) sr
                cross join lateral jsonb_array_elements(coalesce(sr->'requests','[]'::jsonb)) sq
                where sr->>'id'=r->>'linkedTo'
                  and sr->>'driver'=r->>'driver'
                  and sq->>'pid'=q->>'pid'
                  and sq->>'status'='approved'
                limit 1;
              end if;
              if linked is null and not (r->>'driver'=pid and prior->>'status'='pending') then
                raise exception 'Место подтверждает водитель' using errcode='42501';
              end if;
            end if;
          end if;
        end if;
      end loop;

      if n>(r->>'seats')::integer then raise exception 'Свободных мест больше нет'; end if;
      if (select coalesce(array_agg(x order by x),'{}') from jsonb_array_elements_text(coalesce(r->'passengers','[]'::jsonb)) x)
         is distinct from
         (select coalesce(array_agg(x order by x),'{}') from unnest(passengers) x)
      then
        raise exception 'Список пассажиров не совпадает с подтверждениями';
      end if;
    end loop;
    if drivers && seen then raise exception 'Водитель не может одновременно занять место в другой машине'; end if;
  end loop;

  update public.hike_documents
  set payload=jsonb_build_object('version',66,'app',p_app-'current','local',p_local),
      updated_by=actor
  where event_id=p_event
  returning updated_at into out_revision;

  return jsonb_build_object('updated_at',out_revision);
end
$$;

revoke all on function public.save_hike_workspace(uuid,timestamptz,jsonb,jsonb) from public;
grant execute on function public.save_hike_workspace(uuid,timestamptz,jsonb,jsonb) to authenticated;

drop policy if exists "organizers manage memberships" on public.hike_members;
create policy "module editors manage memberships"
on public.hike_members
for update
to authenticated
using (
  private.is_hike_admin(event_id)
  or private.hike_has_module(event_id,'participants')
)
with check (
  private.is_hike_admin(event_id)
  or private.hike_has_module(event_id,'participants')
);

drop policy if exists "organizers insert hike files" on public.hike_files;
create policy "document editors insert hike files"
on public.hike_files
for insert
to authenticated
with check (
  (private.is_hike_admin(event_id) or private.hike_has_module(event_id,'documents'))
  and uploaded_by=(select auth.uid())
);

drop policy if exists "organizers update hike files" on public.hike_files;
create policy "document editors update hike files"
on public.hike_files
for update
to authenticated
using (private.is_hike_admin(event_id) or private.hike_has_module(event_id,'documents'))
with check (private.is_hike_admin(event_id) or private.hike_has_module(event_id,'documents'));

drop policy if exists "organizers delete hike files" on public.hike_files;
create policy "document editors delete hike files"
on public.hike_files
for delete
to authenticated
using (private.is_hike_admin(event_id) or private.hike_has_module(event_id,'documents'));

drop policy if exists "organizers upload hike storage objects" on storage.objects;
create policy "document editors upload hike storage objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id='hike-files'
  and (
    private.is_hike_admin(((storage.foldername(name))[1])::uuid)
    or private.hike_has_module(((storage.foldername(name))[1])::uuid,'documents')
  )
);

drop policy if exists "organizers update hike storage objects" on storage.objects;
create policy "document editors update hike storage objects"
on storage.objects
for update
to authenticated
using (
  bucket_id='hike-files'
  and (
    private.is_hike_admin(((storage.foldername(name))[1])::uuid)
    or private.hike_has_module(((storage.foldername(name))[1])::uuid,'documents')
  )
)
with check (
  bucket_id='hike-files'
  and (
    private.is_hike_admin(((storage.foldername(name))[1])::uuid)
    or private.hike_has_module(((storage.foldername(name))[1])::uuid,'documents')
  )
);

drop policy if exists "organizers delete hike storage objects" on storage.objects;
create policy "document editors delete hike storage objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id='hike-files'
  and (
    private.is_hike_admin(((storage.foldername(name))[1])::uuid)
    or private.hike_has_module(((storage.foldername(name))[1])::uuid,'documents')
  )
);
