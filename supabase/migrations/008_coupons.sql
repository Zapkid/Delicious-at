create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index idx_coupons_shop_lower_code on public.coupons (shop_id, lower(code));

alter table public.orders
  add column if not exists coupon_id uuid references public.coupons(id);

create table public.order_coupon_redemptions (
  order_id uuid primary key references public.orders(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id)
);

alter table public.coupons enable row level security;

create policy "Sellers can view coupons of own shop"
  on public.coupons for select using (
    exists (select 1 from public.shops s where s.id = shop_id and s.seller_id = auth.uid())
  );
create policy "Sellers can insert coupons for own shop"
  on public.coupons for insert with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.seller_id = auth.uid())
  );
create policy "Sellers can update coupons of own shop"
  on public.coupons for update using (
    exists (select 1 from public.shops s where s.id = shop_id and s.seller_id = auth.uid())
  );
create policy "Sellers can delete coupons of own shop"
  on public.coupons for delete using (
    exists (select 1 from public.shops s where s.id = shop_id and s.seller_id = auth.uid())
  );
