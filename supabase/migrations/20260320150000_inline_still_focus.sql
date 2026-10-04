-- Per-case background-position for the headline inline still (0–100, CSS %).

alter table public.cases add column if not exists inline_still_x smallint;
alter table public.cases add column if not exists inline_still_y smallint;

alter table public.cases drop constraint if exists cases_inline_still_x_range;
alter table public.cases add constraint cases_inline_still_x_range check (
  inline_still_x is null or (inline_still_x >= 0 and inline_still_x <= 100)
);

alter table public.cases drop constraint if exists cases_inline_still_y_range;
alter table public.cases add constraint cases_inline_still_y_range check (
  inline_still_y is null or (inline_still_y >= 0 and inline_still_y <= 100)
);
