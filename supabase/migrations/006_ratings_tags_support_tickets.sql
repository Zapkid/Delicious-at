alter table public.ratings
  add column if not exists feedback_tags text[] not null default '{}';

create type public.support_ticket_status as enum ('open', 'resolved', 'closed');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.support_ticket_status not null default 'open',
  body text not null,
  issue_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_support_tickets_order on public.support_tickets(order_id);
create index idx_support_tickets_user on public.support_tickets(user_id, created_at desc);

alter table public.support_tickets enable row level security;

create policy "Users can view own support tickets"
  on public.support_tickets for select using (auth.uid() = user_id);
create policy "Users can create support tickets for own orders"
  on public.support_tickets for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.consumer_id = auth.uid()
    )
  );

create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.update_updated_at();

insert into storage.buckets (id, name, public)
values ('issue-photos', 'issue-photos', false)
on conflict (id) do nothing;

create policy "Authenticated upload issue photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'issue-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users read own issue photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'issue-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
