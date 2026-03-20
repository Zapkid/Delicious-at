create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index idx_favorites_user_created on public.favorites(user_id, created_at desc);

alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on public.favorites for select using (auth.uid() = user_id);
create policy "Users can add favorites"
  on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users can remove favorites"
  on public.favorites for delete using (auth.uid() = user_id);
