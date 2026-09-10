create table if not exists public.people (
  id text primary key,
  name text not null,
  nickname text,
  gender text,
  birth_year text,
  death_year text,
  is_deceased boolean default false,
  domicile text,
  bio text,
  photo text,
  notes text,
  x numeric default 0,
  y numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.unions (
  id text primary key,
  partner1_id text not null references public.people(id) on delete cascade,
  partner2_id text references public.people(id) on delete set null,
  children_ids text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.people enable row level security;
alter table public.unions enable row level security;

drop policy if exists "anon read people" on public.people;
drop policy if exists "anon insert people" on public.people;
drop policy if exists "anon update people" on public.people;
drop policy if exists "anon delete people" on public.people;
drop policy if exists "authenticated read people" on public.people;
drop policy if exists "authenticated insert people" on public.people;
drop policy if exists "authenticated update people" on public.people;
drop policy if exists "authenticated delete people" on public.people;

create policy "anon read people" on public.people for select to anon using (true);
create policy "anon insert people" on public.people for insert to anon with check (true);
create policy "anon update people" on public.people for update to anon using (true);
create policy "anon delete people" on public.people for delete to anon using (true);

create policy "authenticated read people" on public.people for select to authenticated using (true);
create policy "authenticated insert people" on public.people for insert to authenticated with check (true);
create policy "authenticated update people" on public.people for update to authenticated using (true);
create policy "authenticated delete people" on public.people for delete to authenticated using (true);

drop policy if exists "anon read unions" on public.unions;
drop policy if exists "anon insert unions" on public.unions;
drop policy if exists "anon update unions" on public.unions;
drop policy if exists "anon delete unions" on public.unions;
drop policy if exists "authenticated read unions" on public.unions;
drop policy if exists "authenticated insert unions" on public.unions;
drop policy if exists "authenticated update unions" on public.unions;
drop policy if exists "authenticated delete unions" on public.unions;

create policy "anon read unions" on public.unions for select to anon using (true);
create policy "anon insert unions" on public.unions for insert to anon with check (true);
create policy "anon update unions" on public.unions for update to anon using (true);
create policy "anon delete unions" on public.unions for delete to anon using (true);

create policy "authenticated read unions" on public.unions for select to authenticated using (true);
create policy "authenticated insert unions" on public.unions for insert to authenticated with check (true);
create policy "authenticated update unions" on public.unions for update to authenticated using (true);
create policy "authenticated delete unions" on public.unions for delete to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "anon read fotos" on storage.objects;
drop policy if exists "anon insert fotos" on storage.objects;
drop policy if exists "anon update fotos" on storage.objects;
drop policy if exists "anon delete fotos" on storage.objects;
drop policy if exists "authenticated read fotos" on storage.objects;
drop policy if exists "authenticated insert fotos" on storage.objects;
drop policy if exists "authenticated update fotos" on storage.objects;
drop policy if exists "authenticated delete fotos" on storage.objects;

create policy "anon read fotos" on storage.objects for select to anon using (bucket_id = 'fotos');
create policy "anon insert fotos" on storage.objects for insert to anon with check (bucket_id = 'fotos');
create policy "anon update fotos" on storage.objects for update to anon using (bucket_id = 'fotos');
create policy "anon delete fotos" on storage.objects for delete to anon using (bucket_id = 'fotos');

create policy "authenticated read fotos" on storage.objects for select to authenticated using (bucket_id = 'fotos');
create policy "authenticated insert fotos" on storage.objects for insert to authenticated with check (bucket_id = 'fotos');
create policy "authenticated update fotos" on storage.objects for update to authenticated using (bucket_id = 'fotos');
create policy "authenticated delete fotos" on storage.objects for delete to authenticated using (bucket_id = 'fotos');
