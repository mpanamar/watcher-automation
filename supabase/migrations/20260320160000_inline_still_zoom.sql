alter table public.cases add column if not exists inline_still_zoom smallint;

alter table public.cases drop constraint if exists cases_inline_still_zoom_range;
alter table public.cases add constraint cases_inline_still_zoom_range check (
  inline_still_zoom is null or (inline_still_zoom >= 100 and inline_still_zoom <= 280)
);
