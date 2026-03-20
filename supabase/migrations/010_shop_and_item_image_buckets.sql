-- Public image buckets for shop/item photos (browser <img> uses public URLs; no auth header).

drop policy if exists "Shop owners can upload shop images" on storage.objects;
drop policy if exists "Shop owners can update shop images" on storage.objects;
drop policy if exists "Shop owners can delete shop images" on storage.objects;
drop policy if exists "Sellers can upload item images" on storage.objects;
drop policy if exists "Sellers can update item images" on storage.objects;
drop policy if exists "Sellers can delete item images" on storage.objects;

insert into storage.buckets (id, name, public)
values
  ('shop-images', 'shop-images', true),
  ('item-images', 'item-images', true)
on conflict (id) do update set public = true;

-- Path: shops/{shop_id}/...
create policy "Shop owners can upload shop images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shop-images'
    and split_part(storage.objects.name, '/', 1) = 'shops'
    and exists (
      select 1 from public.shops s
      where s.id::text = split_part(storage.objects.name, '/', 2)
        and s.seller_id = auth.uid()
    )
  );

create policy "Shop owners can update shop images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'shop-images'
    and exists (
      select 1 from public.shops s
      where s.id::text = split_part(storage.objects.name, '/', 2)
        and s.seller_id = auth.uid()
    )
  );

create policy "Shop owners can delete shop images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shop-images'
    and exists (
      select 1 from public.shops s
      where s.id::text = split_part(storage.objects.name, '/', 2)
        and s.seller_id = auth.uid()
    )
  );

-- Path: items/{item_id}/...
create policy "Sellers can upload item images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'item-images'
    and split_part(storage.objects.name, '/', 1) = 'items'
    and exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id::text = split_part(storage.objects.name, '/', 2)
        and s.seller_id = auth.uid()
    )
  );

create policy "Sellers can update item images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'item-images'
    and exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id::text = split_part(storage.objects.name, '/', 2)
        and s.seller_id = auth.uid()
    )
  );

create policy "Sellers can delete item images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'item-images'
    and exists (
      select 1 from public.items i
      join public.shops s on s.id = i.shop_id
      where i.id::text = split_part(storage.objects.name, '/', 2)
        and s.seller_id = auth.uid()
    )
  );
