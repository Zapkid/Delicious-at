-- ============================================================
-- ENUMS
-- ============================================================

create type public.active_view as enum ('user', 'seller');
create type public.application_status as enum ('pending', 'approved', 'rejected');
create type public.order_status as enum ('requested', 'accepted', 'rejected', 'paid', 'delivered', 'cancelled');
create type public.payment_method as enum ('bit', 'paybox', 'cash', 'other');
create type public.availability_type as enum ('daily', 'custom');
create type public.fee_status as enum ('pending', 'paid');
create type public.notification_type as enum ('item_available', 'order_update', 'application_decision', 'system');

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  phone text,
  locale text not null default 'he',
  is_seller_approved boolean not null default false,
  active_view public.active_view not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.application_status not null default 'pending',
  business_name text not null,
  phone text not null,
  address text not null,
  lat double precision,
  lng double precision,
  bio text,
  profile_photo_url text,
  cover_photo_url text,
  accepted_fee_terms boolean not null default false,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  tagline text,
  description text,
  cover_photo_url text,
  lat double precision,
  lng double precision,
  address text,
  is_active boolean not null default true,
  supports_delivery boolean not null default false,
  delivery_radius_km numeric,
  delivery_est_minutes integer,
  delivery_fee numeric not null default 0,
  delivery_notes text,
  weekly_hours jsonb not null default '{}',
  hour_exceptions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_payment_methods (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  method public.payment_method not null,
  is_enabled boolean not null default true,
  notes text,
  unique(shop_id, method)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric not null check (base_price >= 0),
  is_vegan boolean not null default false,
  allergens text[] not null default '{}',
  is_available_now boolean not null default false,
  supply_estimate text,
  stock integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create table public.item_portions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  label text not null,
  price_delta numeric not null default 0
);

create table public.item_availability (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  type public.availability_type not null,
  day_of_week integer check (day_of_week >= 0 and day_of_week <= 6),
  start_time time,
  end_time time,
  specific_date date
);

create table public.item_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, item_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles(id),
  shop_id uuid not null references public.shops(id),
  item_id uuid not null references public.items(id),
  portion_id uuid references public.item_portions(id),
  status public.order_status not null default 'requested',
  note text,
  preferred_pickup_time timestamptz,
  wants_delivery boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id),
  to_user_id uuid not null references public.profiles(id),
  stars integer not null check (stars >= 1 and stars <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id, from_user_id)
);

create table public.seller_monthly_fees (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  month date not null,
  total_order_value numeric not null default 0,
  fee_amount numeric not null default 0,
  status public.fee_status not null default 'pending',
  due_date date,
  created_at timestamptz not null default now(),
  unique(shop_id, month)
);

create table public.seller_fee_payments (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid not null references public.seller_monthly_fees(id) on delete cascade,
  proof_url text,
  paid_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title_he text,
  title_en text,
  body_he text,
  body_en text,
  data jsonb not null default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create unique index idx_profiles_email on public.profiles(email);
create index idx_items_shop_sort on public.items(shop_id, sort_order);
create index idx_items_available on public.items(is_available_now) where is_available_now = true;
create index idx_orders_consumer on public.orders(consumer_id, status);
create index idx_orders_shop on public.orders(shop_id, status);
create index idx_order_messages_order on public.order_messages(order_id, created_at);
create index idx_item_subscriptions_item on public.item_subscriptions(item_id);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at);
create index idx_seller_applications_user on public.seller_applications(user_id, status);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger shops_updated_at before update on public.shops
  for each row execute function public.update_updated_at();
create trigger items_updated_at before update on public.items
  for each row execute function public.update_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.seller_applications enable row level security;
alter table public.shops enable row level security;
alter table public.seller_payment_methods enable row level security;
alter table public.items enable row level security;
alter table public.item_photos enable row level security;
alter table public.item_portions enable row level security;
alter table public.item_availability enable row level security;
alter table public.item_subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.order_messages enable row level security;
alter table public.ratings enable row level security;
alter table public.seller_monthly_fees enable row level security;
alter table public.seller_fee_payments enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- seller_applications
create policy "Users can view own applications"
  on public.seller_applications for select using (auth.uid() = user_id);
create policy "Users can create own application"
  on public.seller_applications for insert with check (auth.uid() = user_id);

-- shops
create policy "Anyone can view active shops"
  on public.shops for select using (is_active = true);
create policy "Sellers can insert own shop"
  on public.shops for insert with check (
    auth.uid() = seller_id
    and exists (
      select 1 from public.profiles where id = auth.uid() and is_seller_approved = true
    )
  );
create policy "Sellers can update own shop"
  on public.shops for update using (auth.uid() = seller_id);

-- seller_payment_methods
create policy "Anyone can view payment methods"
  on public.seller_payment_methods for select using (true);
create policy "Sellers can manage own payment methods"
  on public.seller_payment_methods for insert with check (
    exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );
create policy "Sellers can update own payment methods"
  on public.seller_payment_methods for update using (
    exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );

-- items
create policy "Anyone can view items of active shops"
  on public.items for select using (
    exists (select 1 from public.shops where id = shop_id and is_active = true)
  );
create policy "Sellers can insert items for own shop"
  on public.items for insert with check (
    exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );
create policy "Sellers can update items of own shop"
  on public.items for update using (
    exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );

-- item_photos
create policy "Anyone can view item photos"
  on public.item_photos for select using (true);
create policy "Sellers can manage item photos"
  on public.item_photos for insert with check (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can update item photos"
  on public.item_photos for update using (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can delete item photos"
  on public.item_photos for delete using (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );

-- item_portions
create policy "Anyone can view item portions"
  on public.item_portions for select using (true);
create policy "Sellers can manage item portions"
  on public.item_portions for insert with check (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can update item portions"
  on public.item_portions for update using (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can delete item portions"
  on public.item_portions for delete using (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );

-- item_availability
create policy "Anyone can view item availability"
  on public.item_availability for select using (true);
create policy "Sellers can manage item availability"
  on public.item_availability for insert with check (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can update item availability"
  on public.item_availability for update using (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can delete item availability"
  on public.item_availability for delete using (
    exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id = item_id and s.seller_id = auth.uid()
    )
  );

-- item_subscriptions
create policy "Users can view own subscriptions"
  on public.item_subscriptions for select using (auth.uid() = user_id);
create policy "Users can subscribe"
  on public.item_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can unsubscribe"
  on public.item_subscriptions for delete using (auth.uid() = user_id);

-- orders
create policy "Users can view own orders"
  on public.orders for select using (
    auth.uid() = consumer_id
    or exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );
create policy "Users can create orders"
  on public.orders for insert with check (auth.uid() = consumer_id);
create policy "Participants can update orders"
  on public.orders for update using (
    auth.uid() = consumer_id
    or exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );

-- order_messages
create policy "Participants can view order messages"
  on public.order_messages for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
      and (
        o.consumer_id = auth.uid()
        or exists (select 1 from public.shops where id = o.shop_id and seller_id = auth.uid())
      )
    )
  );
create policy "Participants can send messages"
  on public.order_messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
      and (
        o.consumer_id = auth.uid()
        or exists (select 1 from public.shops where id = o.shop_id and seller_id = auth.uid())
      )
    )
  );

-- ratings
create policy "Anyone can view ratings"
  on public.ratings for select using (true);
create policy "Order participants can rate after delivery"
  on public.ratings for insert with check (
    auth.uid() = from_user_id
    and exists (
      select 1 from public.orders
      where id = order_id and status = 'delivered'
      and (consumer_id = auth.uid() or exists (
        select 1 from public.shops where id = shop_id and seller_id = auth.uid()
      ))
    )
  );

-- seller_monthly_fees
create policy "Sellers can view own fees"
  on public.seller_monthly_fees for select using (
    exists (select 1 from public.shops where id = shop_id and seller_id = auth.uid())
  );

-- seller_fee_payments
create policy "Sellers can view own payments"
  on public.seller_fee_payments for select using (
    exists (
      select 1 from public.seller_monthly_fees f
      join public.shops s on s.id = f.shop_id
      where f.id = fee_id and s.seller_id = auth.uid()
    )
  );
create policy "Sellers can submit payment proof"
  on public.seller_fee_payments for insert with check (
    exists (
      select 1 from public.seller_monthly_fees f
      join public.shops s on s.id = f.shop_id
      where f.id = fee_id and s.seller_id = auth.uid()
    )
  );

-- notifications
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users can mark own notifications as read"
  on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_messages;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.notifications;
