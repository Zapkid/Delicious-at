create or replace function public.enforce_stock_sold_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stock is not null and new.stock <= 0 then
    new.is_available_now := false;
  end if;
  return new;
end;
$$;

drop trigger if exists items_stock_sold_out on public.items;
create trigger items_stock_sold_out
  before insert or update of stock on public.items
  for each row
  execute function public.enforce_stock_sold_out();
