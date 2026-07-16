create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  google_maps_url text not null,
  area text not null,
  cuisine_type text,
  contact_email text,
  contact_phone text,
  status text not null default 'onboarding_started',
  subscription_status text not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id)
);

create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  goals text[] not null default '{}',
  tone text,
  signature_dishes text,
  services text,
  competitors text,
  assets_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'published')),
  scheduled_for date,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  reviewer_name text,
  rating numeric,
  review_body text not null,
  suggested_reply text,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  month text not null,
  summary text not null default '',
  metrics jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now(),
  unique(restaurant_id, month)
);

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.content_posts enable row level security;
alter table public.review_replies enable row level security;
alter table public.monthly_reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "restaurants_select_own_or_admin" on public.restaurants
  for select using (owner_id = auth.uid() or public.is_admin());

create policy "restaurants_insert_own" on public.restaurants
  for insert with check (owner_id = auth.uid());

create policy "restaurants_update_own_or_admin" on public.restaurants
  for update using (owner_id = auth.uid() or public.is_admin());

create policy "onboarding_select_own_or_admin" on public.onboarding_responses
  for select using (
    public.is_admin() or exists (
      select 1 from public.restaurants
      where restaurants.id = onboarding_responses.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "onboarding_insert_own" on public.onboarding_responses
  for insert with check (
    exists (
      select 1 from public.restaurants
      where restaurants.id = onboarding_responses.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "onboarding_update_own_or_admin" on public.onboarding_responses
  for update using (
    public.is_admin() or exists (
      select 1 from public.restaurants
      where restaurants.id = onboarding_responses.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "client_content_select_own_or_admin" on public.content_posts
  for select using (
    public.is_admin() or exists (
      select 1 from public.restaurants
      where restaurants.id = content_posts.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "admin_content_all" on public.content_posts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "client_reviews_select_own_or_admin" on public.review_replies
  for select using (
    public.is_admin() or exists (
      select 1 from public.restaurants
      where restaurants.id = review_replies.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "admin_reviews_all" on public.review_replies
  for all using (public.is_admin()) with check (public.is_admin());

create policy "client_reports_select_own_or_admin" on public.monthly_reports
  for select using (
    public.is_admin() or exists (
      select 1 from public.restaurants
      where restaurants.id = monthly_reports.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "admin_reports_all" on public.monthly_reports
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
