alter table public.attendance
  add column if not exists "dateOut" text,
  add column if not exists "timeOut" text,
  add column if not exists "photoOut" text;
