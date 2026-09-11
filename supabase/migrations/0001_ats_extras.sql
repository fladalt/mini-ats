-- Adds CV text + AI assessment fields to candidates, and grants the
-- `authenticated` role base access to the tables (RLS policies already
-- exist and control per-row access, but PostgREST also needs the
-- underlying GRANT to reach the table at all). Run once in the
-- Supabase SQL Editor.
--
-- Note: the `stage` column already has a check constraint from the
-- original schema setup: new | screening | interview | offer | rejected.
-- There is no separate "hired" stage — see assumptions doc.

alter table public.candidates
  add column if not exists resume_text text,
  add column if not exists ai_score integer,
  add column if not exists ai_summary text,
  add column if not exists ai_assessed_at timestamptz;

grant select, insert, update, delete on public.organizations to authenticated, service_role;
grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.jobs to authenticated, service_role;
grant select, insert, update, delete on public.candidates to authenticated, service_role;
