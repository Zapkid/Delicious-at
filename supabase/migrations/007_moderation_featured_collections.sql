alter table public.shops
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists is_featured boolean not null default false;

alter table public.items
  add column if not exists is_featured boolean not null default false;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

drop policy if exists "Anyone can view active shops" on public.shops;
create policy "Public can view active non-suspended shops"
  on public.shops for select using (is_active = true and suspended_at is null);
create policy "Sellers can view own shop always"
  on public.shops for select using (auth.uid() = seller_id);

drop policy if exists "Anyone can view items of active shops" on public.items;
create policy "Public can view items of open shops"
  on public.items for select using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id
        and s.is_active = true
        and s.suspended_at is null
    )
  );
create policy "Sellers can view items of own shop"
  on public.items for select using (
    exists (select 1 from public.shops s where s.id = shop_id and s.seller_id = auth.uid())
  );

create type public.report_status as enum ('pending', 'reviewed', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete set null,
  item_id uuid references public.items(id) on delete set null,
  body text not null,
  status public.report_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_reports_status on public.reports(status, created_at desc);

alter table public.reports enable row level security;

create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = reporter_id);
create policy "Users can submit reports"
  on public.reports for insert with check (auth.uid() = reporter_id);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  entity text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_admin_audit_log_created on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, item_id)
);

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

create policy "Anyone can read collections"
  on public.collections for select using (true);
create policy "Anyone can read collection items"
  on public.collection_items for select using (true);
