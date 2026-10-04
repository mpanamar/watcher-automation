-- Sprint 11: DB constraints aligned with domain caseSchema.

alter table public.cases drop constraint if exists cases_options_min_len;
alter table public.cases add constraint cases_options_min_len check (
  jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2
);

alter table public.cases drop constraint if exists cases_aliases_nonempty;
alter table public.cases add constraint cases_aliases_nonempty check (cardinality(aliases) >= 1);

alter table public.cases drop constraint if exists cases_aliases_min_chars;
alter table public.cases add constraint cases_aliases_min_chars check (
  not exists (select 1 from unnest(aliases) as alias where length(trim(alias)) < 3)
);

alter table public.cases drop constraint if exists cases_buy_new_http;
alter table public.cases add constraint cases_buy_new_http check (buy_new ~* '^https?://');

alter table public.cases drop constraint if exists cases_buy_used_http;
alter table public.cases add constraint cases_buy_used_http check (buy_used ~* '^https?://');

alter table public.cases drop constraint if exists cases_still_storage_key;
alter table public.cases add constraint cases_still_storage_key check (
  still !~ '\.\.'
  and still !~ '[''"]'
  and still !~* '^https?://'
);
