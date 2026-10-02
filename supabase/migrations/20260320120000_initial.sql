-- Watcher: cases catalog, public view, admin allowlist, RLS, stills bucket.

create table if not exists public.cases (
  id text primary key,
  still text not null,
  still_alt text not null,
  source text not null,
  subject text not null,
  frame text not null,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  answer text not null,
  aliases text[] not null default '{}',
  hint text not null,
  title text not null,
  ref text not null,
  history text not null,
  buy_new text not null,
  buy_used text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists cases_published_sort_idx on public.cases (published, sort_order);

create or replace view public.public_cases as
select
  id,
  still,
  still_alt,
  source,
  subject,
  frame,
  question,
  options,
  title,
  ref,
  history,
  buy_new,
  buy_used,
  sort_order,
  updated_at
from public.cases
where published = true;

create table if not exists public.admins (
  email text primary key
);

alter table public.cases enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on public.cases from anon, authenticated;
revoke all on public.admins from anon, authenticated;
grant select on public.public_cases to anon, authenticated;

create policy "public_cases_select"
  on public.public_cases
  for select
  to anon, authenticated
  using (true);

create policy "cases_admin_select"
  on public.cases
  for select
  to authenticated
  using (public.is_admin());

create policy "cases_admin_insert"
  on public.cases
  for insert
  to authenticated
  with check (public.is_admin());

create policy "cases_admin_update"
  on public.cases
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "cases_admin_delete"
  on public.cases
  for delete
  to authenticated
  using (public.is_admin());

create policy "admins_self_select"
  on public.admins
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stills',
  'stills',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "stills_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'stills');

create policy "stills_admin_write"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'stills' and public.is_admin());

create policy "stills_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'stills' and public.is_admin())
  with check (bucket_id = 'stills' and public.is_admin());

create policy "stills_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'stills' and public.is_admin());
