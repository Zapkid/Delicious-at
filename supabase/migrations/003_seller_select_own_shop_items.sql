-- Sellers must see their shop and menu even when the shop is inactive (e.g. to re-activate or edit).
create policy "Sellers can view own shop"
  on public.shops for select
  using (auth.uid() = seller_id);

create policy "Sellers can view items in own shops"
  on public.items for select
  using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.seller_id = auth.uid()
    )
  );
