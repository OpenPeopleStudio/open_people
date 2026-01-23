-- Backfill profiles from legacy 709_profiles table if it exists.
-- Rollback: restore data into 709_profiles from profiles if needed.

do $$
declare
  src_exists boolean;
  src_has_display_name boolean;
  dst_has_full_name boolean;
  insert_cols text := '';
  select_cols text := '';
  update_cols text := '';
  col_name text;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = '709_profiles'
  ) into src_exists;

  if not src_exists then
    return;
  end if;

  for col_name in
    select p.column_name
    from information_schema.columns p
    where p.table_schema = 'public'
      and p.table_name = 'profiles'
      and p.column_name in (
        select s.column_name
        from information_schema.columns s
        where s.table_schema = 'public'
          and s.table_name = '709_profiles'
      )
  loop
    if insert_cols <> '' then
      insert_cols := insert_cols || ', ';
      select_cols := select_cols || ', ';
    end if;
    insert_cols := insert_cols || quote_ident(col_name);
    select_cols := select_cols || quote_ident(col_name);

    if col_name <> 'id' then
      if update_cols <> '' then
        update_cols := update_cols || ', ';
      end if;
      update_cols := update_cols || format('%I = excluded.%I', col_name, col_name);
    end if;
  end loop;

  if insert_cols <> '' then
    if update_cols = '' then
      update_cols := 'id = excluded.id';
    end if;
    execute format(
      'insert into public.profiles (%s) select %s from public.%I on conflict (id) do update set %s',
      insert_cols,
      select_cols,
      '709_profiles',
      update_cols
    );
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = '709_profiles' and column_name = 'display_name'
  ) into src_has_display_name;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) into dst_has_full_name;

  if src_has_display_name and dst_has_full_name then
    execute '
      update public.profiles p
      set full_name = coalesce(p.full_name, s.display_name)
      from public."709_profiles" s
      where p.id = s.id
    ';
  end if;
end $$;
