-- Admin allowlist: match auth.users by id (not JWT email claims).

create or replace function public.current_auth_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(trim(u.email))
  from auth.users u
  where u.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admins a
    inner join auth.users u on lower(trim(a.email)) = lower(trim(u.email))
    where u.id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins_self_select" on public.admins;
create policy "admins_self_select"
  on public.admins
  for select
  to authenticated
  using (
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(trim(email)) = lower(trim(u.email))
    )
  );

grant select on public.admins to authenticated;
grant select, insert, update, delete on public.cases to authenticated;
