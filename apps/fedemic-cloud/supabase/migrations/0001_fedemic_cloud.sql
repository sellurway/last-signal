-- Fedemic Cloud Phase 1 schema. Apply to a dedicated Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  project_type text not null default 'visual' check (project_type in ('visual','github')),
  framework text,
  status text not null default 'draft' check (status in ('draft','building','published','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slug text not null default 'home',
  title text not null default 'Home',
  page_schema jsonb not null default '{"version":1,"sections":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.website_pages enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "projects_select_own" on public.projects
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "projects_update_own" on public.projects
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "projects_delete_own" on public.projects
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "pages_select_via_owned_project" on public.website_pages
  for select to authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );
create policy "pages_insert_via_owned_project" on public.website_pages
  for insert to authenticated with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );
create policy "pages_update_via_owned_project" on public.website_pages
  for update to authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );
create policy "pages_delete_via_owned_project" on public.website_pages
  for delete to authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );

create index if not exists projects_owner_updated_idx on public.projects(owner_id, updated_at desc);
create index if not exists website_pages_project_idx on public.website_pages(project_id);

create or replace function public.handle_new_fedemic_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_fedemic_auth_user_created on auth.users;
create trigger on_fedemic_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_fedemic_user();
